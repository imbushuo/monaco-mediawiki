/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../../lib/mediawiki/mediawiki.d.ts" />

module MwMonacoExtension {

    export class TitleAutoCompletionSource implements ICompletionSource {

        private m_matchRule: RegExp = /\[\[([^|\n]*)$/;
        private static g_searchService = "https://misaka.ink.moe/webproxy.php";

        get matchRule(): RegExp {
            return this.m_matchRule;
        }

        getCandidateItemsAsync(input: string): monaco.Promise<monaco.languages.CompletionItem[]> {
            return new monaco.Promise<monaco.languages.CompletionItem[]>((complete, error, progress) => {
                // Input should be santized. But anyway we will pass it to search engine.
                $.ajax({
                    url: TitleAutoCompletionSource.g_searchService,
                    data: {
                        action: "opensearch",
                        search: input
                    },
                    cache: true,
                    dataType: "json"
                }).then(data => {
                    // Take second array (index = 1) and the last array (index = 3).
                    const arrCandidates = data[1] as string[];
                    const arrCandidateLinks = data[3] as string[];
                    const autoCompletionItems: monaco.languages.CompletionItem[] = [];
                    if (arrCandidates.length >= arrCandidateLinks.length) {
                        for (let i = 0; i < arrCandidates.length; i++) {
                            const candidate = arrCandidates[i];
                            const link = arrCandidateLinks[i];
                            autoCompletionItems.push({
                                insertText: candidate,
                                label: candidate,
                                detail: link,
                                kind: monaco.languages.CompletionItemKind.Field
                            });
                        }
                    }
                    complete(autoCompletionItems);
                }, () => complete([]));
            });
        }

    }

    export class TemplateAutoCompletionSource implements ICompletionSource {

        private m_matchRule: RegExp = /{{(.*)$/;
        private m_templateCache = {};
        private static g_TemplateQualifier = "|";
        private static g_TemplateDataRepo = "https://imbushuos3.azureedge.net/Snippets/Moegirlpedia/TemplateData/{0}.json";

        get matchRule(): RegExp {
            return this.m_matchRule;
        }

        private getTemplateCandidateAsync(templateName: string): monaco.Promise<monaco.languages.CompletionItem[]> {
            // Check input. If starts with ":", query main namespace.
            // Otherwise, query template namespace.
            const queryNamespace = (templateName.indexOf(':') === 0) ? 0 : 10;
            return new monaco.Promise<monaco.languages.CompletionItem[]>((complete, error, progress) => {
                // Input should be santized.
                mw.loader.using("mediawiki.api").then(() => {
                    const apiQuery = new mw.Api();
                    const pageResults = apiQuery.get({
                        action: "query",
                        format: "json",
                        list: "allpages",
                        utf8: 1,
                        formatversion: 2,
                        apprefix: templateName,
                        apnamespace: queryNamespace,
                        aplimit: 20
                    }).then(response => {
                        const completionItems: monaco.languages.CompletionItem[] = [];
                        if (response.query && response.query.allpages) {
                            (response.query.allpages as any[]).forEach(p => {
                                const itemDisplayName = (queryNamespace == 10) ? 
                                    (p.title as string).substring((p.title as string).indexOf(":") + 1) : 
                                    p.title

                                completionItems.push({
                                    documentation: "",
                                    label: itemDisplayName,
                                    insertText: itemDisplayName,
                                    kind: monaco.languages.CompletionItemKind.Class
                                });
                            });
                            complete(completionItems);
                        }
                    }, () => {
                        error([]);
                    });
                });
            });
        }

        private getKeys(obj: any): string[] {

            const ret: string[] = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    ret.push(key);
                }
            }

            return ret;
        }

        /**
         * Get applicable template arguments.
         * @param input Template raw input.
         */
        private getTemplateParametersAsync(input: string) : monaco.Promise<monaco.languages.CompletionItem[]> {
            return new monaco.Promise<monaco.languages.CompletionItem[]>((complete, error, progress) => {
                // Template name
                const templateName = input.substring(0, input.indexOf(TemplateAutoCompletionSource.g_TemplateQualifier));
                // Check current param and input
                const currParamInput = input.substring(input.lastIndexOf(TemplateAutoCompletionSource.g_TemplateQualifier) + 1);
                const paramOpIdx = currParamInput ? currParamInput.indexOf("=") : -1;
                // Check if argument autocomplete is applicable
                if (paramOpIdx >= 0) {
                    complete([]);
                } else {
                    if (this.m_templateCache[templateName]) {
                        complete(this.m_templateCache[templateName]);
                    } else {
                        // Query repository for details
                        $.ajax({
                            url: TemplateAutoCompletionSource.g_TemplateDataRepo.replace("{0}", encodeURI(templateName)),
                            cache: true,
                            dataType: 'json'
                        }).then(data => {
                            // Convert template info to autocompletion items
                            if (data && data.params) {
                                const keys = this.getKeys(data.params);
                                const fields: monaco.languages.CompletionItem[] = [];
                                keys.forEach(key => {
                                    const d = data.params[key];
                                    if (d) {
                                        fields.push({
                                            label: key,
                                            documentation: d.description,
                                            kind: monaco.languages.CompletionItemKind.Property,
                                            detail: d.description,
                                            insertText: key
                                        });
                                    }
                                });
                                this.m_templateCache[templateName] = fields;
                                complete(fields);
                            } else {
                                complete([]);
                            }
                        }, () => complete([]));
                    }
                }
            });
        }

        getCandidateItemsAsync(input: string): monaco.Promise<monaco.languages.CompletionItem[]> {
            // Check input. If parameter qualifier present, query detailed information.
            if (input && input.indexOf(TemplateAutoCompletionSource.g_TemplateQualifier) != -1) {
                return this.getTemplateParametersAsync(input);
            } else {
                return this.getTemplateCandidateAsync(input);
            }
        }

    }

    interface ICompletionSource {
        matchRule: RegExp;
        getCandidateItemsAsync(input: string) : monaco.Promise<monaco.languages.CompletionItem[]>;
    }
}
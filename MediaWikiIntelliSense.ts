module MwMonacoExtension {

    export class TitleAutoCompletionSource implements ICompletionSource {

        private m_matchRule: RegExp = /\[\[(.*)$/;

        get matchRule(): RegExp {
            return this.m_matchRule;
        }

        getCandidateItemsAsync(input: string): monaco.Promise<monaco.languages.CompletionItem[]> {
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
                        apprefix: input
                    }).then(response => {
                        const completionItems: monaco.languages.CompletionItem[] = [];
                        if (response.query && response.query.allpages) {
                            (response.query.allpages as any[]).forEach(p => {
                                completionItems.push({
                                    documentation: "",
                                    label: p.title,
                                    insertText: p.title,
                                    kind: monaco.languages.CompletionItemKind.Field
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

    }

    interface ICompletionSource {
        matchRule: RegExp;
        getCandidateItemsAsync(input: string) : monaco.Promise<monaco.languages.CompletionItem[]>;
    }
}
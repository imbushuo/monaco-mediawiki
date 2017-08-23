/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../lib/mediawiki/mediawiki.d.ts" />

import * as MediaWikiIntelliSense from "./languageServices/MediaWikiIntelliSense";
import * as Tokenizer from "./languageServices/MediaWikiTokenizer";
import * as Configuration from "./configuration/UserConfiguration";
import * as Linter from "./languageServices/lint/LinkLinter";

/**
* Loader for Monaco editor.
*/
export class MonacoLoader {

    /**
     * A dictionary that contains prefix mapping.
     */
    private static g_prefixMapping = {
        'Module': 'lua',
        '模块': 'lua'
    };

    /**
     * A dictionary that contains extension mapping.
     */
    private static g_extMapping = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.css': 'css',
        '.less': 'less',
        '.scss': 'scss'
    };

    /**
     * List of common modules.
     */
    private static g_commonLibraries: ILibraryModule[] = [
        {
            url: "/User:Imbushuo/MonacoEditor/jquery.d.ts?action=raw&ctype=text/typescript",
            fileName: "jquery.d.ts"
        },
        {
            url: "/User:Imbushuo/MonacoEditor/mediawiki.d.ts?action=raw&ctype=text/typescript",
            fileName: "mediawiki.d.ts"
        }
    ];

    private m_hostControl: HTMLDivElement;
    private m_textAreaControl: HTMLTextAreaElement;
    private m_editorControl: monaco.editor.IStandaloneCodeEditor;
    private m_diffEditorControl: monaco.editor.IStandaloneDiffEditor;
    private m_linter: Linter.LinkLinter;

    private m_docType: string;
    private m_userOptions: Configuration.IMonacoUserConfiguration;

    private m_docPrefix: string;
    private m_docExtension: string;
    private m_title: string;
    private m_originalContent: string;

    /**
     * Constructor that creates new instance of MonacoLoader.
     * @param textAreaControl MediaWiki source text input control.
     * @param options Constructor options. (Optional)
     */
    constructor(textAreaControl: HTMLTextAreaElement, options?: IMonacoLoaderConstructionOptions) {

        this.m_textAreaControl = textAreaControl;
        this.m_docType = "markdown";

        // Register language.
        monaco.languages.register({ id: 'mediawiki' });

        if ((window as any).monacoUserConfig) {
            this.m_userOptions = <Configuration.IMonacoUserConfiguration>(window as any).monacoUserConfig;
        }

        if (options && options.autoLoad) {
            this.initialize();
        }
    }

    /**
     * Determine the availbility of Monaco loader.
     * @returns {boolean} Value indicates whether the editor can be loaded.
     */
    static determineAvailability(): boolean {
        if (!document.getElementById("wpTextbox1")) return false;
        // TODO: Stop loading if other editor is detected
        return true;
    }

    /**
     * Check title extension asynchronously.
     */
    private checkTitleExtensionAsync(): monaco.Promise<string> {
        return new monaco.Promise<string>((complete, error, progress) => {
            mw.loader.using("mediawiki.Uri").then(() => {
                const currentUri = new mw.Uri();
                if (currentUri.query.title) {
                    const currentTitle = <string>currentUri.query.title;
                    const lastDotPos = currentTitle.lastIndexOf('.');
                    const prefixQualifierPos = currentTitle.indexOf(':');
                    this.m_docPrefix = currentTitle.substring(0, prefixQualifierPos);
                    this.m_docExtension = currentTitle.substring(lastDotPos);
                    this.m_title = currentTitle;

                    if (MonacoLoader.g_prefixMapping[this.m_docPrefix]) {
                        complete(MonacoLoader.g_prefixMapping[this.m_docPrefix]);
                    } else if (MonacoLoader.g_extMapping[this.m_docExtension]) {
                        complete(MonacoLoader.g_extMapping[this.m_docExtension]);
                    } else {
                        complete("mediawiki");
                    }
                } else {
                    error("Unable to load title");
                }
            });
        });
    }

    /**
     * Creates module load XHR promise for given module.
     * @param module Module definition.
     */
    private createLibraryXhrPromise(module: ILibraryModule): monaco.Promise<ILibraryModule> {
        return new monaco.Promise<ILibraryModule>((complete, error, progress) => {
            $.ajax({
                url: module.url,
                cache: true
            }).then((data: string) => {
                complete({
                    content: data,
                    fileName: module.fileName,
                    url: module.url
                });
            }).fail(() => {
                error(null);
            })
        });
    }

    /**
     * Load reference library modules asynchronously.
     */
    private loadReferenceLibrariesAsync(): monaco.Promise<boolean> {
        return new monaco.Promise<boolean>((complete, error, progress) => {
            switch (this.m_docType) {
                // IntelliSense library reference for scripts
                case "javascript":
                case "typescript":
                    console.info("Loading references for script editor.");
                    let xhrPromises: monaco.Promise<ILibraryModule>[] = [];
                    MonacoLoader.g_commonLibraries.forEach(module => xhrPromises.push(this.createLibraryXhrPromise(module)));
                    monaco.Promise.join(xhrPromises).then((modules: ILibraryModule[]) => {
                        modules.forEach(module => {
                            console.info(`Loaded module ${module.fileName}.`);
                            monaco.languages.typescript.typescriptDefaults.addExtraLib(module.content, module.fileName);
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(module.content, module.fileName);
                        });
                        complete(true);
                    }, () => complete(false));
                    break;
                // IntelliSense module reference
                case "mediawiki":
                    // Load initial highlight.
                    this.setupMediaWikiHighlight();

                    // Load auto completion provider.
                    const mwAutoCompletionSource = new MediaWikiIntelliSense.TitleAutoCompletionSource();
                    const mwTmplAutoCompletionSource = new MediaWikiIntelliSense.TemplateAutoCompletionSource();
                    monaco.languages.registerCompletionItemProvider("mediawiki", {
                        provideCompletionItems: (model, position) => {
                            const textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
                            let match = mwAutoCompletionSource.matchRule.exec(textUntilPosition);
                            if (match && match.length > 1) {
                                // We should have two, pass the second one to create a Thenable object
                                return mwAutoCompletionSource.getCandidateItemsAsync(match[1]);
                            } else {
                                // For template reference
                                match = mwTmplAutoCompletionSource.matchRule.exec(textUntilPosition);
                                if (match && match.length > 1) {
                                    return mwTmplAutoCompletionSource.getCandidateItemsAsync(match[1]);
                                }
                            }

                            return [];
                        }
                    });
                    break;
                default:
                    complete(true);
                    break;
            }
        });
    }

    /**
     * Creates editor host div element.
     */
    private createEditorHost(): HTMLDivElement {
        // Container
        var editorContainer = document.createElement("div");
        editorContainer.id = "editorContainer";
        editorContainer.style.cssText = "width:100%;height:500px;";
        $("#wpTextbox1").after(editorContainer);
        // Hide textarea
        $("#wpTextbox1").hide();
        return editorContainer;
    }

    /**
     * Get theme options.
     */
    private getTheme(): string {
        if (this.m_userOptions && this.m_userOptions.theme) {
            return this.m_userOptions.theme;
        } else {
            return "vs";
        }
    }

    /**
     * Get font family options.
     */
    private getFontFamily(): string {
        if (this.m_userOptions && this.m_userOptions.fontFamily) {
            return this.m_userOptions.fontFamily;
        } else {
            return "Iosevka, Consolas, Monaco, 'Source Han Sans SC', 'Source Han Sans', 'Microsoft YaHei', monospace";
        }
    }

    /**
     * Flush editor content to actual form text input control.
     */
    private flushEditor(): void {
        if (this.m_editorControl) {
            // Flush content
            $("#wpTextbox1").val(this.m_editorControl.getModel().getValue());
        }
    }

    /**
     * Set up editor actions.
     */
    private setupActions(): void {
        this.m_editorControl.addAction({
            id: 'save-action',
            label: 'Save changes',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F7],
            keybindingContext: null,
            contextMenuGroupId: 'mediawikiActions',
            contextMenuOrder: 1,
            run: (ed) => {
                this.flushEditor();
                $("#editform").submit();
            }
        });
        this.m_editorControl.addAction({
            id: 'diff-toggle-action',
            label: 'Compare with current',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_D],
            keybindingContext: null,
            contextMenuGroupId: 'mediawikiActions',
            contextMenuOrder: 2,
            run: (ed) => {
                this.initializeDiffEditor();
            }
        })
    }

    /**
     * Set up diff editor.
     */
    private setupDiffActions(): void {
        this.m_diffEditorControl.addAction({
            id: 'save-action',
            label: 'Save changes',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F7],
            keybindingContext: null,
            contextMenuGroupId: 'mediawikiActions',
            contextMenuOrder: 1,
            run: (ed) => {
                this.flushEditor();
                $("#editform").submit();
            }
        });
    }

    /**
     * Set up MediaWiki highlight.
     * TODO: Move it to extension module.
     */
    private setupMediaWikiHighlight(): void {
        monaco.languages.setMonarchTokensProvider('mediawiki', new Tokenizer.MediaWikiTokenizer());
        console.info("MediaWiki Monarch token provider is set.");
    }

    /**
     * Initialize editor control.
     */
    initialize(): void {
        if (!MonacoLoader.determineAvailability()) return;
        this.checkTitleExtensionAsync().then((docType: string) => {
            this.m_docType = docType;
            this.m_hostControl = this.createEditorHost();
            this.loadReferenceLibrariesAsync().then(() => {
                this.m_originalContent = this.m_textAreaControl.value;
                monaco.editor.defineTheme("localTheme", {
                    base: this.getTheme() as monaco.editor.BuiltinTheme,
                    inherit: true,
                    rules: [
                        { token: 'bold', fontStyle: 'bold' },
                        { token: 'bold.quote', fontStyle: 'bold' },
                        { token: 'italic', fontStyle: 'italic' },
                        { token: 'italic.quote', fontStyle: 'italic' }
                    ],
                    colors: {}
                });

                this.m_editorControl = monaco.editor.create(this.m_hostControl, {
                    value: this.m_textAreaControl.value,
                    language: this.m_docType,
                    theme: "localTheme",
                    fontFamily: this.getFontFamily(),
                    automaticLayout: true,
                    // Enable word wrap for Wikitext, and restricted word wrap for others
                    wordWrap: (this.m_docType === "mediawiki") ? "on" : "wordWrapColumn",
                    folding: true
                });

                // Save content every 5 seconds
                window.setInterval(() => this.flushEditor(), 5000);

                // Register event for submission
                $("#editform").submit((e) => {
                    // Flush content
                    this.flushEditor();
                });

                // Set up actions
                this.setupActions();

                // Load linter
                if (Linter.LinkLinter && this.m_docType === "mediawiki") {
                    this.m_linter = new Linter.LinkLinter(this.m_editorControl);
                }
            });
        });
    }

    /**
     * Initialize diff editor
     */
    private initializeDiffEditor(): void {
        if (this.m_originalContent) {
            // Flush and dispose current editor
            this.flushEditor();
            this.m_editorControl.dispose();
            this.m_editorControl = null;

            // Reset container
            $(this.m_hostControl).empty();

            // Load diff editor
            this.m_diffEditorControl = monaco.editor.createDiffEditor(this.m_hostControl, {
                fontFamily: this.getFontFamily(),
                automaticLayout: true,
                theme: "localTheme",
                // Enable word wrap for Wikitext, and restricted word wrap for others
                wordWrap: (this.m_docType === "mediawiki") ? "on" : "wordWrapColumn",
                folding: true
            });
            this.m_diffEditorControl.setModel({
                original: monaco.editor.createModel(this.m_originalContent, this.m_docType),
                modified: monaco.editor.createModel(this.m_textAreaControl.value, this.m_docType)
            });
            this.m_editorControl = this.m_diffEditorControl.getModifiedEditor();
            this.setupDiffActions();
        }
    }
}

export interface IMonacoLoaderConstructionOptions {
    autoLoad?: boolean;
}

export interface ILibraryModule {
    url: string;
    fileName?: string;
    content?: string;
}
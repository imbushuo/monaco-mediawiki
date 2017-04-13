module MwMonaco {

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

        private m_docType: string;
        private m_userOptions: IMonacoUserConfiguration;

        private m_docPrefix: string;
        private m_docExtension: string;
        

        /**
         * Constructor that creates new instance of MonacoLoader.
         * @param textAreaControl MediaWiki source text input control.
         * @param options Constructor options. (Optional)
         */
        constructor(textAreaControl: HTMLTextAreaElement, options?: IMonacoLoaderConstructionOptions) {

            this.m_textAreaControl = textAreaControl;
            this.m_docType = "markdown";

            if ((window as any).monacoUserConfig) {
                this.m_userOptions = <IMonacoUserConfiguration> (window as any).monacoUserConfig;
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
                        const currentTitle = <string> currentUri.query.title;
                        const lastDotPos = currentTitle.lastIndexOf('.');
                        const prefixQualifierPos = currentTitle.indexOf(':');
                        this.m_docPrefix = currentTitle.substring(0, prefixQualifierPos);
                        this.m_docExtension = currentTitle.substring(lastDotPos);

                        if (MonacoLoader.g_prefixMapping[this.m_docPrefix]) {
                            complete(MonacoLoader.g_prefixMapping[this.m_docPrefix]);
                        } else if (MonacoLoader.g_extMapping[this.m_docExtension]) {
                            complete(MonacoLoader.g_extMapping[this.m_docExtension]);
                        } else {
                            complete("plaintext");
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
            // Toolbar
            var editorToolbar = document.createElement("div");
            editorToolbar.id = "editorToolbar";
            editorToolbar.style.cssText = "width:100%;height:36px;background: rgb(37,37,38);";
            $("#wpTextbox1").after(editorToolbar);
            // Container
            var editorContainer = document.createElement("div");
            editorContainer.id = "editorContainer";
            editorContainer.style.cssText = "width:100%;height:500px;";
            $(editorToolbar).after(editorContainer);
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
                return "vs-dark";
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
         * Initialize editor control.
         */
        initialize() : void {
            if (!MonacoLoader.determineAvailability()) return;
            this.checkTitleExtensionAsync().then((docType: string) => {
                this.m_docType = docType;
                this.m_hostControl = this.createEditorHost();
                this.loadReferenceLibrariesAsync().then(() => {
                    this.m_editorControl = monaco.editor.create(this.m_hostControl, {
                        value: this.m_textAreaControl.value,
                        language: this.m_docType,
                        theme: this.getTheme(),
                        fontFamily: this.getFontFamily(),
                        automaticLayout: true
                    });

                    // Register event for submission
                    $("#editform").submit((e) => {
                        // Flush content
                        $("#wpTextbox1").val(this.m_editorControl.getModel().getValue());
                    });
                });
            });
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
}
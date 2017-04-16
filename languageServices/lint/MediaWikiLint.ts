module MwMonacoExtension {
    export class LinkLinter implements monaco.IDisposable {

        private static g_OwnerId: string = "LinkLinter";
        private m_editor: monaco.editor.IStandaloneCodeEditor;
        private m_model: monaco.editor.IModel;
        private m_handle: number;

        constructor(editor: monaco.editor.IStandaloneCodeEditor) {
            console.info("Linter is loaded.");
            this.m_editor = editor;
            this.m_model = editor.getModel();
            this.m_editor.onDidChangeModelContent(e => {
                clearTimeout(this.m_handle);
                this.m_handle = setTimeout(() => this.doValidation(), 500);
                console.info("Validation is scheduled.");
            });
        }

        private doValidation() {
            console.info("Start validation.");
            // Clear
            monaco.editor.setModelMarkers(this.m_model, LinkLinter.g_OwnerId, []);
            // And validate
            const validationErrors: monaco.editor.IMarkerData[] = [];
            for (let i = 1; i < this.m_model.getLineCount(); i++) {
                const content = this.m_model.getLineContent(i);
                if (content) {
                    const vStack: number[] = [];
                    let fail: boolean = false;
                    for (let j = 0; j < content.length; j++) {
                        // Do not check if fails
                        if (fail) break;
                        switch (content[j])
                        {
                            case '[':
                                vStack.push(j);
                                break;
                            case ']':
                                if (vStack.length > 0) {
                                    vStack.pop();
                                } else {
                                    // Something must happened
                                    fail = true;
                                }
                                break;
                        }
                    }
                    if (fail || vStack.length > 0) {
                        validationErrors.push({
                            code: content,
                            startLineNumber: i,
                            endLineNumber: i,
                            severity: monaco.Severity.Warning,
                            message: "Unable to match bracket for link reference.",
                            startColumn: 1,
                            endColumn: content.length + 1
                        });
                    }
                }
            }
            monaco.editor.setModelMarkers(this.m_model, LinkLinter.g_OwnerId, validationErrors);
            console.info("Complete validation. " + validationErrors.length + " error(s) found.");
        }

        dispose(): void {
            // Cancel check
            clearTimeout(this.m_handle);
            // We don't dispose it though. We will deref it.
            this.m_editor = null;
        }

    }
}
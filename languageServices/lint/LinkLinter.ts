module MwMonacoExtension.LanguageServices {

    import shared = MwMonacoExtension.LanguageServices.Shared;

    export class LinkLinter implements monaco.IDisposable {

        // No wiki section can cross line. Hence we need to save line status
        // Nested no-op will be captured
        private static g_regExpNoOpNoWikiSectionBeginIdentifier             : RegExp = /<nowiki\s*>/;
        private static g_regExpNoOpPreFormattedBlkBeginIdentifier           : RegExp = /<pre\s*>/;
        private static g_regExpNoOpNoWikiSectionEndIdentifier               : RegExp = /<\/nowiki\s*>/;
        private static g_regExpNoOpPreFormattedBlkEndIdentifier             : RegExp = /<\/pre\s*>/;

        // Links will not cross line.
        private static g_regExpLinkBlkBeginIdentifier                       : RegExp = /\[\[/;
        private static g_regExpLinkBlkEndIdentifier                         : RegExp  = /\]\]/;

        private m_editorModel                                               : monaco.editor.IModel;
        private m_lastPopBlk                                                : shared.ControlBlockEnvironment;
        private m_stCtrlBlkEnv                                              : shared.ControlBlockEnvironment[];
        private m_validationMarkups                                         : monaco.editor.IMarkerData[];

        // Input handle
        private m_hTimer                                                    : number;

        /**
         * Get current linter stack state.
         */
        private get currentState(): shared.ControlBlockEnvironment {
            return (this.m_stCtrlBlkEnv) ? this.m_stCtrlBlkEnv[this.m_stCtrlBlkEnv.length - 1] : null;
        }

        /**
         * Initializes new instance of LinkLinter.
         * @param editor Editor model.
         */
        constructor(editor: monaco.editor.IStandaloneCodeEditor) {
            if (editor) {
                this.m_editorModel = editor.getModel();
                editor.onDidChangeModelContent(e => {
                    clearTimeout(this.m_hTimer);
                    this.m_hTimer = setTimeout(() => this.validate(), 500);
                });
            } else {
                throw new Error("Arg_ArgumentNullException");
            }

            this.m_lastPopBlk = null;
            this.m_stCtrlBlkEnv = [];
            this.m_validationMarkups = [];
        }

        /**
         * Performs validation.
         */
        validate(): void {
            // Clear state
            let rootState: shared.ControlBlockEnvironment = new shared.ControlBlockEnvironment(false, 0);
            monaco.editor.setModelMarkers(this.m_editorModel, "LinkLinter", []);
            this.m_validationMarkups = [];
            this.m_stCtrlBlkEnv = [];
            this.m_lastPopBlk = null;
            this.m_stCtrlBlkEnv.push(rootState);

            for (let line: number = 1; line <= this.m_editorModel.getLineCount(); line++) {
                const lineContent = this.m_editorModel.getLineContent(line);
                if (!lineContent) continue;

                // Evalulate line.
                this.validateMatchInternal(lineContent, line, 0);
                // Sanity check.
                if (this.currentState.lastOpenSection == shared.Sections.Link) {
                    this.m_validationMarkups.push({
                        code: "MW1004",
                        message: "Link reference block is not closed.",
                        startLineNumber: this.currentState.beginLine,
                        endLineNumber: this.currentState.beginLine,
                        // -2 + 1, Monaco starts from 1
                        startColumn: this.currentState.beginColumn - 1,
                        // + 1
                        endColumn: lineContent.length + 1,
                        severity: monaco.Severity.Error
                    });
                    // Clear error state.
                    this.m_stCtrlBlkEnv.pop();
                }
            }

            monaco.editor.setModelMarkers(this.m_editorModel, "LinkLinter", this.m_validationMarkups);
        }

        /**
         * Internal validation worker procedure.
         * @param input Line input or subset of line input.
         * @param line Line index.
         * @param column Column index.
         */
        private validateMatchInternal(input: string, line: number, column: number)
        {
            // Well, there's no peek method in script world, so we wrote one
            const state = this.currentState;

            // No-op region?
            if (state.isNoOpRegion) {
                let noOpMatches: RegExpMatchArray = null;

                switch (state.lastOpenSection)
                {
                    case shared.Sections.NoWiki:
                        noOpMatches = input.match(LinkLinter.g_regExpNoOpNoWikiSectionEndIdentifier);
                        break;
                    case shared.Sections.Pre:
                        noOpMatches = input.match(LinkLinter.g_regExpNoOpPreFormattedBlkEndIdentifier);
                        break;
                }

                // Check for matches
                if (noOpMatches && noOpMatches.length > 0) {
                    // Check column and launch rematch operation (pop state)
                    const noOpMatch = noOpMatches[0];
                    const nxtBeginIndex = noOpMatches.index + noOpMatch.length;
                    this.m_lastPopBlk = this.m_stCtrlBlkEnv.pop();
                    // Relaunch match
                    this.validateMatchInternal(input.substring(nxtBeginIndex), line, nxtBeginIndex);
                }

            } else {

                // Check link or no-op region
                // All links need to be completed in one line
                const noOpNoWikiMatch = shared.Match.convertToMatch(input.match(LinkLinter.g_regExpNoOpNoWikiSectionBeginIdentifier));
                const noOpPreMatch = shared.Match.convertToMatch(input.match(LinkLinter.g_regExpNoOpPreFormattedBlkBeginIdentifier));
                const linkBeginBracketMatch = shared.Match.convertToMatch(input.match(LinkLinter.g_regExpLinkBlkBeginIdentifier));
                const linkEndBracketMatch = shared.Match.convertToMatch(input.match(LinkLinter.g_regExpLinkBlkEndIdentifier));

                const matches: [number, shared.Match, shared.Sections][] = [];
                if (noOpNoWikiMatch.success) matches.push([noOpNoWikiMatch.index, noOpNoWikiMatch, shared.Sections.NoWiki]);
                if (noOpPreMatch.success) matches.push([noOpPreMatch.index, noOpPreMatch, shared.Sections.Pre]);
                if (linkBeginBracketMatch.success) matches.push([linkBeginBracketMatch.index, linkBeginBracketMatch, shared.Sections.Link]);
                if (linkEndBracketMatch.success) matches.push([linkEndBracketMatch.index, linkEndBracketMatch, shared.Sections.LinkEnd]);

                // Sort it
                matches.sort((a, b) => (a[0] - b[0]));

                // Take the first one, and exit if not captured
                if (matches.length < 1) return;
                var fMatch = matches[0];
                let newEnv: shared.ControlBlockEnvironment = null;
                switch (fMatch[2])
                {
                    case shared.Sections.NoWiki:
                    case shared.Sections.Pre:
                        // No-op region: Push environment block and carry on
                        newEnv = new shared.ControlBlockEnvironment(
                            true, state.depth + 1, fMatch[2], 
                            line, fMatch[1].index + fMatch[1].length + column);
                        break;
                    case shared.Sections.Link:
                        // Link region: Push limited env block and carry on
                        if (state.lastOpenSection == shared.Sections.Link) {
                            this.m_validationMarkups.push({
                                severity: monaco.Severity.Error,
                                startLineNumber: line,
                                // +1
                                startColumn: fMatch[1].index + 1,
                                endLineNumber: line,
                                // +1
                                endColumn: fMatch[1].index + fMatch[1].length + 1,
                                message: "Cannot include nested link.",
                                code: "MW1005"
                            });
                            return;
                        }
                        newEnv = new shared.ControlBlockEnvironment(
                            false, state.depth + 1, fMatch[2], 
                            line, fMatch[1].index + fMatch[1].length + column
                        );
                        break;
                    case shared.Sections.LinkEnd:
                        if (state.lastOpenSection == shared.Sections.Link) this.m_lastPopBlk = this.m_stCtrlBlkEnv.pop();
                        break;
                }

                if (newEnv) {
                    this.m_stCtrlBlkEnv.push(newEnv);
                }
                // Validate then
                this.validateMatchInternal(
                    input.substring(fMatch[1].index + fMatch[1].length), 
                    line, fMatch[1].index + fMatch[1].length + column);
            }
        }

        dispose(): void {
            // Cancel check
            clearTimeout(this.m_hTimer);
            // We don't dispose it though. We will deref it.
            this.m_editorModel = null;
        }

    }

}
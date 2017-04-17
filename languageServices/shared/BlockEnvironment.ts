module MwMonacoExtension.LanguageServices.Shared {
    export class ControlBlockEnvironment {
        isNoOpRegion: boolean;
        depth: number;
        lastOpenSection: Sections;
        beginLine: number;
        beginColumn: number;

        constructor(isNoOpRegion: boolean, depth: number, lastOpenSection?: Sections, beginLine?: number, beginColumn?: number)
        {
            this.isNoOpRegion = isNoOpRegion;
            this.depth = depth;
            this.lastOpenSection = lastOpenSection;
            this.beginLine = (beginLine) ? beginLine : 0;
            this.beginColumn = (beginColumn) ? beginColumn : 0;
        }
    }
}
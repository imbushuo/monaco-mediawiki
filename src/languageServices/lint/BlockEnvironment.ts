// Class that maintains regex compatibility with C#
export class Match {
    success: boolean;
    index: number;
    length: number;

    constructor(success: boolean, index: number, length: number) {
        this.success = success;
        this.index = index;
        this.length = length;
    }

    static convertToMatch(matchArray: RegExpMatchArray): Match {
        if (matchArray && matchArray.length > 0) {
            const match = matchArray[0];
            return new Match(true, matchArray.index, match.length);
        } else {
            return new Match(false, 0, 0);
        }
    }
}

export const enum Sections {
    Unknown,
    Pre,
    NoWiki,
    Text,
    Link,
    LinkEnd
}

export class ControlBlockEnvironment {
    isNoOpRegion: boolean;
    depth: number;
    lastOpenSection: Sections;
    beginLine: number;
    beginColumn: number;

    constructor(isNoOpRegion: boolean, depth: number, lastOpenSection?: Sections, beginLine?: number, beginColumn?: number) {
        this.isNoOpRegion = isNoOpRegion;
        this.depth = depth;
        this.lastOpenSection = lastOpenSection;
        this.beginLine = (beginLine) ? beginLine : 0;
        this.beginColumn = (beginColumn) ? beginColumn : 0;
    }
}
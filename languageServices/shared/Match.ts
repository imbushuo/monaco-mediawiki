module MwMonacoExtension.LanguageServices.Shared {
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
}
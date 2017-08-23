/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

module MwMonacoExtension {

    export class MediaWikiTokenizer implements monaco.languages.IMonarchLanguage {

        ignorecase: boolean = true;

        empty: string[] =  [
            'area', 'base', 'basefont', 'br', 'col', 'frame',
            'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param'
        ];

        // escape codes for javascript/CSS strings
        escapes: RegExp = /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/;

        tokenizer: { [name: string]: monaco.languages.IMonarchLanguageRule[] | any[]; } = {
            root: [
                { include: '@whitespace' },
                // Link reference
                [ /\[\[/, {
                    token: "string.quote", bracket: "@open",
                    next: "@linkReferenceBlock"
                }],
                // Bold
                [ /'''/, {
                    token: 'bold.quote', bracket: '@open', 
                    next: '@boldBlock'
                }],
                // Italic
                [ /''/, {
                    token: 'italic.quote', bracket: '@open',
                    next: '@italicBlock'
                }],
                // HTML-Style blocks
                [ /<(\w+)\/>/, 'tag.tag-$1'],
                [ /<(\w+)/, {
                    cases: {
                        '@empty': { token: 'tag.tag-$1', next: '@tag.$1', log: 'Push stack to tag.$1' },
                        '@default': { token: 'tag.tag-$1', bracket: '@open', next: '@tag.$1', log: 'Push stack to tag.$1, bracket open' }
                    }
                }],
                [ /<\/(\w+)\s*>/, {
                    token: 'tag.tag-$1', bracket: '@close',
                    log: 'Close bracket of tag.$1'
                }],
                [ /&\w+;/, 'string.escape']
            ],
            boldBlock: [
                [ /'''/, { token: "bold.quote", bracket: "@close", next: "@pop" } ],
                [ /[^''']+/, { token: "bold" } ]
            ],
            italicBlock: [
                [ /''/, { token: "italic.quote", bracket: "@close", next: "@pop" } ],
                [ /[^'']+/, { token: "italic" } ]
            ],
            linkReferenceBlock: [
                [ /\]\]/, { token: "string.quote", bracket: "@close", next: "@pop" } ],
                [ /[^\]\]]+/, { token: "string" } ]
            ],
            // Tags
            tag: [
                [/[ \t\r\n]+/, 'white'],
                [/(type)(\s*=\s*)(")([^"]+)(")/, ['attribute.name', 'delimiter', 'attribute.value',
                    { token: 'attribute.value', switchTo: '@tag.$S2.$4' },
                    'attribute.value']],
                [/(type)(\s*=\s*)(')([^']+)(')/, ['attribute.name', 'delimiter', 'attribute.value',
                    { token: 'attribute.value', switchTo: '@tag.$S2.$4' },
                    'attribute.value']],
                [/(\w+)(\s*=\s*)("[^"]*"|'[^']*')/, ['attribute.name', 'delimiter', 'attribute.value']],
                [/\w+/, 'attribute.name'],
                [/\/>/, 'tag.tag-$S2', '@pop'],
                [/>/, {
                    cases: {
                        '$S2==style': { token: 'tag.tag-$S2', switchTo: '@inlineStyle.$S2', nextEmbedded: 'text/css', log: 'Entering CSS section ($S2)' },
                        '$S2==script': {
                            cases: {
                                '$S3': { token: 'tag.tag-$S2', switchTo: '@inlineScript.$S2', nextEmbedded: '$S3' },
                                '@default': { token: 'tag.tag-$S2', switchTo: '@inlineScript.$S2', nextEmbedded: 'javascript', log: 'Entering JS section ($S2)' }
                            }
                        },
                        '@default': { token: 'tag.tag-$S2', next: '@pop', log: 'Entering $S2 section' }
                    }
                }],
            ],
            inlineStyle: [
                [/<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop', log: 'Pop stack ($S2)' }]
            ],
            inlineScript: [
                [/<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop', log: 'Pop stack ($S2)' }]
            ],
            // scan embedded strings in javascript or css
            // string.<delimiter>
            string: [
                [/[^\\"']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/["']/, {
                    cases: {
                        '$#==$S2': { token: 'string', next: '@pop' },
                        '@default': 'string'
                    }
                }]
            ],
            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/<!--/, 'comment', '@comment']
            ],
            comment: [
                [/[^<\-]+/, 'comment.content'],
                [/-->/, 'comment', '@pop'],
                [/<!--/, 'comment.content.invalid'],
                [/[<\-]/, 'comment.content']
            ]
        };

        tokenPostfix: string = "";
    }
    
}
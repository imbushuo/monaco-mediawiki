module MwMonacoExtension {

    export class MediaWikiTokenizer implements monaco.languages.IMonarchLanguage {

        tokenizer: { [name: string]: monaco.languages.IMonarchLanguageRule[]; } = {
            root: [
                // Link reference
                [ /\[\[/, {
                    token: "string.quote", bracket: "@open",
                    next: "@linkref_blk"
                }],
                // Template variable
                [ /{{{(.*)}}}/, "identifier"],
                // Parser function reference
                [
                    /{{#/, {
                        token: "type.identifier", bracket: "@open",
                        next: "@pfnRef_blk"
                    }
                ],
                // Template reference
                [ /{{/, {
                    token: "type.identifier", bracket: "@open",
                    next: "@tmplRef_blk"
                }],
                // Bold
                [ /'''/, {
                    token: 'bold.quote', bracket: '@open', 
                    next: '@bold_blk'
                }],
                // Italic
                [ /''/, {
                    token: 'italic.quote', bracket: '@open',
                    next: '@italic_blk'
                }],
                // HTML-style Comment
                [ /<!--.*-->/, "comment"],
                // Widget namespace
                [ /<script\s*>/, {
                    token: 'keyword', bracket: '@open',
                    next: '@script_blk', nextEmbedded: 'javascript'
                }],
                [ /<\/script\s*>/, { 
                    token: 'keyword', bracket: '@close'
                }],
                [ /<style\s*>/, {
                    token: 'keyword', bracket: '@open',
                    next: '@css_blk', nextEmbedded: 'css'
                }],
                [ /<\/style\s*>/, { 
                    token: 'keyword', bracket: '@close'
                }],
                // MediaWiki tags
                [ /<noinclude\s*>/, { 
                    token: 'keyword', bracket: '@open' 
                }],
                [ /<\/noinclude\s*>/, { 
                    token: 'keyword', bracket: '@close'
                }],
                [ /<includeonly\s*>/, { 
                    token: 'keyword', bracket: '@open' 
                }],
                [ /<\/includeonly\s*>/, { 
                    token: 'keyword', bracket: '@close'
                }],
                [ /<nowiki\s*>/, { 
                    token: 'keyword', bracket: '@open' 
                }],
                [ /<\/nowiki\s*>/, { 
                    token: 'keyword', bracket: '@close'
                }]
            ],
            script_blk: [
                [ /<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' } ]
            ],
            css_blk: [
                [ /<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' } ]
            ],
            bold_blk: [
                [ /'''/, { token: "bold.quote", bracket: "@close", next: "@pop" } ],
                [ /[^''']+/, { token: "bold" } ]
            ],
            italic_blk: [
                [ /''/, { token: "italic.quote", bracket: "@close", next: "@pop" } ],
                [ /[^'']+/, { token: "italic" } ]
            ],
            linkref_blk: [
                [ /\]\]/, { token: "string.quote", bracket: "@close", next: "@pop" } ],
                [ /[^\]\]]+/, { token: "string" } ]
            ],
            tmplRef_blk: [
                [ /\[\[/, {
                    token: "string.quote", bracket: "@open",
                    next: "@linkref_blk"
                }],
                [
                    /{{#/, {
                        token: "type.identifier", bracket: "@open",
                        next: "@pfnRef_blk"
                    }
                ],
                [ /{{/, {
                    token: "type.identifier", bracket: "@open",
                    next: "@tmplRef_blk"
                }],
                [ /}}/, { token: "type.identifier", bracket: "@close", next: "@pop" } ],
                [ /[^}}]+/, { token: "type.identifier" }]
            ],
            pfnRef_blk: [
                [ /\[\[/, {
                    token: "string.quote", bracket: "@open",
                    next: "@linkref_blk"
                }],
                [
                    /{{#/, {
                        token: "type.identifier", bracket: "@open",
                        next: "@pfnRef_blk"
                    }
                ],
                [ /{{/, {
                    token: "type.identifier", bracket: "@open",
                    next: "@tmplRef_blk"
                }],
                [ /}}/, { token: "type.identifier", bracket: "@close", next: "@pop" } ],
                [ /[^}}]+/, { token: "type.identifier" }]
            ]
        };

        tokenPostfix: string = "";
    }
    
}
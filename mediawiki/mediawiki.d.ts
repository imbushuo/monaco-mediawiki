// <pre>
/**
 * MediaWiki.d.ts: TypeScript definition for MediaWiki
 */

declare module mediawiki {
    function UriRelative(documentLocation: string): Uri;
    function confirmCloseWindow(options?: ConfirmCloseWindowOptions): any;
    function format(formatString: string, parameters,...args: string[]): string;
    function hook(name: string): MwHook;
    function log(msg: string): void;
    function message(key: string, parameters,...args: any[]): MwMessage;
    function msg(key: string, parameters,...args: any[]): string;
    function notify(message: any, options: any): JQueryPromise<any>;
    function now(): number;
    function requestIdleCallback(callback: () => any, options?: RequestIdleCallbackOptions): void;
    function track(topic: string, data?: any): void;
    function trackSubscribe(topic: string, callback: (topic: string, data?: any) => any): void;
    function trackUnsubscribe(callback: () => any): void;

    export class Uri {
        constructor(uri?: string, options?: IUriConstructorOptions);
    }

    interface IUriConstructorOptions
    {
        strictMode?: boolean;
        overrideKeys?: boolean;
    }

    interface ConfirmCloseWindowOptions
    {
        namespace?: string;
        message?: string;
        test?: () => boolean;
    }

    interface RequestIdleCallbackOptions
    {
        timeout?: number;
    }

    interface MwHook
    {
        
    }

    interface MwMessage
    {
        escaped(): string;
        exists(): boolean;
        params(parameters: any[]): MwMessage;
        parse(): string;
        parseDom(): JQueryStatic;
        plain(): string;
        text(): string;
        toString(): string;
    }
}

declare module mw {
    export class Uri {
        constructor(uri?: string, options?: IUriConstructorOptions);
        fragment?: string;
        host: string;
        password?: string;
        path: string;
        port: string;
        protocol: string;
        query: any;
        user?: string;

        clone(): Uri;
        extend(parameters: any): Uri;
        getAuthority(): string;
        getHostPort(): string;
        getQueryString(): string;
        getRelativePath(): string;
        getUserInfo(): string;
        toString(): string;
    }

    export class Api {
        constructor(options?: IApiConstructorOptions);

        abort(): void;
        ajax(parameters: any, ajaxOptions?: any): JQueryPromise<any>;
        badToken(type: string): void;
        create(title: string, params: IApiCreatePageParams, content: string): JQueryPromise<any>;
        edit(title: string, transform: (revision: any) => any): JQueryPromise<any>;
        get(parameters: any, ajaxOptions?: any): JQueryPromise<any>;
        getCategories(title: string): JQueryPromise<any>;
        getCategoriesByPrefix(prefix: string): JQueryPromise<IApiGetCategoriesByPrefixResponse>;
        getEditToken(): JQueryPromise<any>;
        getMessages(messages: any[], options?: any): JQueryPromise<any>;
        // More to come
        
    }

    interface IApiConstructorOptions {
        parameters: any;
        ajax: any;
        useUS: boolean;
    }

    interface IApiCreatePageParams {
        summary: string;
    }

    interface IApiGetCategoriesByPrefixResponse {
        categories: string[];
    }

    interface IUriConstructorOptions {
        strictMode?: boolean;
        overrideKeys?: boolean;
    }
}

declare module mw.loader {
    function using(module: string): Promise<void>;  
}
// </pre>
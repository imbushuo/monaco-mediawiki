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

    /**
     * Register a source.
     * @param id Source ID, or object mapping ids to load urls.
     * @param loadUrl Url to a load.php end point.
     */
    function addSource(id: string | any, loadUrl: string): void;

    /**
     * Create a new style element and add it to the DOM.
     * @param text CSS text.
     * @param nextNode The element where the style tag should be inserted before.
     * @returns Reference to the created style element.
     */
    function addStyleTag(text: string, nextNode?: Node): HTMLElement;

    /**
     * Get the names of all registered modules.
     */
    function getModuleNames(): string[];

    /**
     * Get the state of a module.
     * @param module Name of module.
     * @returns The state, or null if the module (or its state) is not in the registry.
     */
    function getState(module: string): string | null;

    /**
     * Get the version of a module.
     * @param module Name of module.
     * @returns The version, or null if the module (or its version) is not in the registry.
     */
    function getVersion(module: string): string | null;

    /**
     * Generate and print one more reports. When invoked with no arguments, print all reports.
     * @param reports Report names to run, or unset to print all available reports.
     */
    function inspect(reports,...args: string[]);

    /**
     * Load an external script or one or more modules.
     * @param module Either the name of a module, array of modules, or a URL of an external script or style.
     * @param contentType MIME type to use if calling with a URL of an external script or style; acceptable values are "text/css" and "text/javascript"; if no type is provided, text/javascript is assumed. Defaults to: 'text/javascript'.
     */
    function load(module: string | string[], contentType?: string): void;

    /**
     * Register a module, letting the system know about it and its properties.
     *
     * The startup modules contain calls to this method.
     * When using multiple module registration by passing an array,
     * dependencies that are specified as references to modules within the array
     * will be resolved before the modules are registered.
     *
     * @param module Module name or array of arrays, each containing a list of arguments compatible with this method.
     * @param version Module version hash (falls backs to empty string) Can also be a number (timestamp) for compatibility with MediaWiki 1.25 and earlier.
     * @param dependencies One string or array of strings of module names on which this module depends, or a function that returns that array.
     * @param group Group which the module is in. Defaults to: null
     * @param source Name of the source. Defaults to: 'local'
     * @param skip Script body of the skip function. Defaults to: null
     */
    function register(module: string | string[], version: string | number,
        dependencies: string | string[] | Function, group?: string, source?: string, skip?: string);

    /**
     * Change the state of one or more modules.
     * @param module Module name or object of module name/state pairs.
     * @param state State name.
     */
    function state(module: string | any, state: string): void;

    /**
     * Execute a function as soon as one or more required modules are ready.
     * @param dependencies Module name or array of modules names the callback depends on to be ready before executing.
     * @param ready Callback to execute when all dependencies are ready.
     * @param error Callback to execute if one or more dependencies failed.
     */
    function using(dependencies: string | string[], ready?: () => any, error?: () => any): Promise<void>;  
}
// </pre>
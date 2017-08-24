/**
 * @license
 *
 * LoaderBootstrap.ts: Monaco Editor loader for MediaWiki.
 * -----------------------------------------------
 * Copyright (c) 2017 The Little Moe New LLC.
 * 
 * Beta technology - no warranty
 *
 */

import * as LoaderCore from "./MonacoEditorHost";

(function (){

    if ((window as any).monacoHost) return;

    $.getScript("https://imbushuos3.azureedge.net/Monaco/0.10.0-1/vs/loader.js", function (data, textStatus, jqxhr) {

        // Configure for language services
        // Workaround for webpack, see: https://github.com/Microsoft/monaco-editor/issues/18#issuecomment-261063117
        (<any>window).require.config({
            paths: {
                'vs': 'https://imbushuos3.azureedge.net/Monaco/0.10.0-1/vs'
            }
        });

        (window as any).MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return '/User:imbushuo/MonacoProxyStub.js?action=raw&ctype=text/javascript';
            }
        };

        // Log status
        console.info('Monaco bootstrapper has been loaded.');

        // Load editor
        (<any>window).require(['vs/editor/editor.main'], function () {
            if (LoaderCore.MonacoEditorHost.isAvailable) {
                const host = new LoaderCore.MonacoEditorHost(document.getElementById("wpTextbox1") as HTMLTextAreaElement);
                host.initialize();
                (window as any).monacoHost = host;
                console.info('Monaco bootstrapper has been initialized.');
            }
        });
    });

})();
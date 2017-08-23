/**
 * @license
 *
 * LoaderBootstrap.ts: Monaco Editor loader for MediaWiki.
 * -----------------------------------------------
 * Copyright (c) 2017 The Little Moe New LLC.
 * 
 * Beta technology - no warranty
 * 
 * Note: You might want to disable all advanced editor features in order to let it work properly.
 * I haven't tested the compatibility with the original MediaWiki editor.
 * 备注：您可能需要禁用所有 MediaWiki 编辑器功能以让这个编辑器正常工作。
 * 作者尚未测试和 MediaWiki 别的高级编辑器功能的兼容性。
 * 
 * 用法：在用户页 JavaScript 里插入 mw.loader.load('https://zh.moegirl.org/User:Imbushuo/MonacoEditor.js?action=raw&ctype=text/javascript'); 即可。
 * 
 * Usage: 
 * Add this code snippet to your user script:
 * mw.loader.load('https://zh.moegirl.org/User:Imbushuo/MonacoEditor.js?action=raw&ctype=text/javascript');
 * 
 * 
 */

import * as LoaderCore from "./MonacoLoader";

(function (){

    if ((window as any).monacoLoader) return;

    $.getScript("https://imbushuos3.azureedge.net/Monaco/0.10.0-1/vs/loader.js", function (data, textStatus, jqxhr) {

        // Configure for language services
        require.config({ paths: { 'vs': 'https://imbushuos3.azureedge.net/Monaco/0.10.0-1/vs' } });
        (window as any).MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return '/User:imbushuo/MonacoProxyStub.js?action=raw&ctype=text/javascript';
            }
        };

        // Log status
        console.info("Monaco loaded and environment has been configured.");

        // Load editor
        require(['vs/editor/editor.main'], function () {
            if (LoaderCore.MonacoLoader.determineAvailability()) {
                const loader = new LoaderCore.MonacoLoader(document.getElementById("wpTextbox1") as HTMLTextAreaElement);
                loader.initialize();
                (window as any).monacoLoader = loader;
            }
        });
    });

})();
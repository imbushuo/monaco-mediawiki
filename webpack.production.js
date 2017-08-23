const path = require('path');
const webpack = require('webpack');
const WebpackSHAHash = require('webpack-sha-hash');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

module.exports = {
    context: path.join(__dirname, 'src'),
    entry: {
        'MonacoLoader.min': './MonacoLoader.ts',
        'LoaderBootstrap.min': './LoaderBootstrap.ts'
    },
    devtool: "source-map",
    output: {
        path: path.join(__dirname, 'bin/Release'),
        filename: '[name].[chunkhash].js'
    },
    module: {
        loaders: [
            {
                test: /\.ts?$/,
                loader: "awesome-typescript-loader"
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ],
    },
    plugins: [
        new WebpackCleanupPlugin(),
        new WebpackSHAHash(),
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
            sourceMap: true,
            comments: false
        }),
        new StatsWriterPlugin({
            filename: "buildMetadata.json"
        })
    ],
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    externals: {
        "monaco-editor": "monaco-editor",
        "vs/editor/editor.main": "monaco-editor"
    }
};
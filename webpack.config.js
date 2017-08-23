const path = require('path');
const webpack = require('webpack');
const WebpackSHAHash = require('webpack-sha-hash');

module.exports = {
    context: path.join(__dirname, 'src'),
    entry: {
        'MonacoLoader': './MonacoLoader.ts',
        'MonacoLoader.min': './MonacoLoader.ts',
        'LoaderBootstrap': './LoaderBootstrap.ts',
        'LoaderBootstrap.min': './LoaderBootstrap.ts'
    },
    devtool: "source-map",
    output: {
        path: path.join(__dirname, 'bin'),
        filename: '[name].[chunkhash].js'
    },
    module: {
        loaders: [
            // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.ts?$/,
                loader: "awesome-typescript-loader"
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
            sourceMap: true,
            comments: false
        }),
        new WebpackSHAHash()
    ],
    resolve: {
        extensions: [ '.ts', '.js', '.json' ]
    },
    externals: {
        "monaco-editor": "monaco-editor",
        "vs/editor/editor.main": "monaco-editor"
    }
};
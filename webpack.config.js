module.exports = function (env) {
    if (!env) env = 'development';
    return require(`./webpack.${env}.js`)
}
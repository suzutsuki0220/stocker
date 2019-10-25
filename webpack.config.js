const MODE = 'development';  // 'production' or 'development'

// development に設定するとソースマップ有効でJSファイルが出力される
const enabledSourceMap = (MODE === 'development');

var path = require('path'),
ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = env => {
    const HTDOCS_ROOT = (env && env.htdocs_root) ? env.htdocs_root : '/stocker';
    const CGI_ROOT = (env && env.cgi_root) ? env.cgi_root : '/cgi-bin/stocker';

    console.log("webpack config: htdocs_root -> " + HTDOCS_ROOT);
    console.log("webpack config: cgi_root -> " + CGI_ROOT);

    return {
        mode: MODE,
        entry: [
            './node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css',
            './node_modules/@fortawesome/fontawesome-free/css/solid.min.css',
            './webpack/assets/scss/bulma.scss',
            './webpack/index.js'
        ],
        output: {
            path: path.join(__dirname, 'dist/bundle'),
            filename: 'stocker.js'
        },
        module: {
            rules: [
                {
                    test: /\.(s)?css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                url: true,
                                sourceMap: enabledSourceMap,

                                // 0 => no loaders (default);
                                // 1 => postcss-loader;
                                // 2 => postcss-loader, sass-loader
                                importLoaders: 2
                            },
                        }, {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: enabledSourceMap,
                            }
                        }
                    ],
                }, {
                    test: /uri.js/,
                    loader: 'string-replace-loader',
                    options: {
                        multiple: [
                            { search: '%htdocs_root%', replace: HTDOCS_ROOT },
                            { search: '%cgi_root%', replace: CGI_ROOT }
                        ]
                    }
                }, {
                    // 画像など
                    test: /\.(gif|png|jpg)$/,
                    loader: 'url-loader'  // Base64化
                }, {
                    test: /\.(ttf|eot|svg|woff(2)?)(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader'
                }
            ],
        },
        externals: [
            'fs',
            'xmlhttprequest'
        ],
    };
};

const MODE = 'development';  // 'production' or 'development'

// development に設定するとソースマップ有効でJSファイルが出力される
const enabledSourceMap = (MODE === 'development');

const path = require('path');

const contentBase = [
    path.join(__dirname, 'htdocs'),
    path.join(__dirname, 'dist')
];
const outPath = path.resolve(__dirname, 'dist/bundle');

module.exports = env => {
    const HTDOCS_ROOT = (env && env.htdocs_root) ? env.htdocs_root : '/stocker';
    const CGI_ROOT = (env && env.cgi_root) ? env.cgi_root : '/cgi-bin/stocker';
    const API_DUMMY = (env && env.api_dummy) ? env.api_dummy : 'no';

    console.log("webpack config: htdocs_root -> " + HTDOCS_ROOT);
    console.log("webpack config: cgi_root -> " + CGI_ROOT);

    return {
        mode: MODE,
        entry: {
            font: './node_modules/html-render/dist/font.bundle.js',
            bulma: './node_modules/html-render/dist/bulma.bundle.js',
            stocker: './webpack/index.js'
        },
        output: {
            path: outPath,
            filename: '[name].js'
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
                            { search: '%cgi_root%', replace: CGI_ROOT },
                            { search: '%api_dummy%', replace: API_DUMMY },
                        ]
                    }
                }, {
                    test: /\.ts$/,
                    use: 'ts-loader'
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
        devServer: {
            contentBase: contentBase,
            watchContentBase: true,
            inline: true,
            hot: true
        },
        externals: [
            'fs',
            'xmlhttprequest'
        ],
        resolve: {
            extensions: [
                '.ts', '.js'
            ]
        }
    };
};

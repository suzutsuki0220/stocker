const jsUtils = require('js-utils');
const stockerConf = require('../../config/stocker-conf.json');

const fetchOptions: RequestInit = {
    mode: 'same-origin',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'error',
    referrerPolicy: 'no-referrer'
};

export class Api {
    private static fetchData = async (url: string, format: string = 'json', method: string = 'GET') => {
        return await fetch(url, {
            method: method,
            ...fetchOptions
        }).then(function (response) {
            if (response.ok) {
                return response[format]();
            } else {
                return Promise.reject(new Error(response.status + ' ' + response.statusText));
            }
        })
    }

    private static pushData = async (url: string, body: string, method: string = 'POST') => {
        return await fetch(url, {
            ...fetchOptions,
            method: method,
            body: body,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(new Error(response.status + ' ' + response.statusText));
            }
        })
    }

    private static getUriRoot(className: string, root: string, path: string): string {
        return stockerConf.htdocsRoot + '/api/v1/' + className + '/' + root + '/' + path;
    }

    static convert = {
        addJob: (query: string) => {
            return Api.pushData(stockerConf.htdocsRoot + '/api/v1/converts', query);
        }
    }

    static media = {
        getExif: (root: string, path: string) => {
            const uri = Api.getUriRoot('media', root, path) + "/exif";
            return Api.fetchData(uri);
        },
        getMovieInfo: (root: string, path: string) => {
            const uri = Api.getUriRoot('media', root, path) + "/movieInfo";
            return Api.fetchData(uri);
        },
        getTag: (root: string, path: string) => {
            const uri = Api.getUriRoot('media', root, path) + "/mediaTag";
            return Api.fetchData(uri);
        }
    }

    static storage = {
        download: (root: string, path: string, filename: string) => {
            jsUtils.file.DownloadWithDummyAnchor(stockerConf.htdocsRoot + '/api/v1/storage/' + root + '/' + path + '/raw', filename);
        },
        getProperty: (root: string, path: string, optionParam: string = '') => {
            const uri = Api.getUriRoot('storage', root, path) + '/properties' + (optionParam ? '?' + optionParam : '');
            return Api.fetchData(uri);
        },
        getRaw: (root: string, path: string, format: string = 'text') => {
            const uri = Api.getUriRoot('storage', root, path) + '/raw';
            return Api.fetchData(uri, format);
        },
        getRoots: () => {
            return Api.fetchData(stockerConf.htdocsRoot + '/api/v1/storage/root-paths');
        },
        delete: (root: string, path: string) => {
            const uri = Api.getUriRoot('storage', root, path);
            return Api.fetchData(uri, 'json', 'DELETE');
        },
        mkdir: (root: string, path: string, newname: string) => {
            const uri = Api.getUriRoot('storage', root, path) + '/mkdir';
            return Api.pushData(uri, jsUtils.url.makeQueryString({ newname: newname }), 'PUT');
        }
    }
}

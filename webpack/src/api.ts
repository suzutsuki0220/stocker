const jsUtils = require('js-utils');
const stockerConf = require('../../config/stocker-conf.json');

export class Api {
    private static fetchData = async (url: string) => {
        return await fetch(url, {
            method: 'GET',
            mode: 'same-origin',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'error',
            referrerPolicy: 'no-referrer'
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

    static getMediaTag = (root: string, path: string) => {
        const uri = Api.getUriRoot('media', root, path) + "/mediaTag";
        return Api.fetchData(uri);
    }

    static getMediaExif = (root: string, path: string) => {
        const uri = Api.getUriRoot('media', root, path) + "/mediaTag";
        return Api.fetchData(uri);
    }

    static getStorageProperty = (root: string, path: string, optionParam: string = '') => {
        const uri = Api.getUriRoot('storage', root, path) + '/properties' + (optionParam ? '?' + optionParam : '');
        return Api.fetchData(uri);
    }

    static getStorageRoots = () => {
        return Api.fetchData(stockerConf.htdocsRoot + '/api/v1/storage/root-paths');
    }

    static download = (root: string, path: string, filename: string) => {
        jsUtils.file.DownloadWithDummyAnchor('/api/v1/storage/' + root + '/' + path + '/raw', filename);
    }
}

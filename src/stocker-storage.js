const fs = require('fs');
const Path = require('path');
const jsUtils = require('js-utils');
const StockerLib = require('../build/Release/stockerlib').StockerLib;

const stockerLib = new StockerLib();

module.exports = class StockerStorage {
    static divideRootPath(rootAndPath) {
        const index = rootAndPath.indexOf('/');
        if (index >= 0) {
            return {
                root: rootAndPath.substring(0, index),
                path: rootAndPath.substring(index + 1)
            };
        } else {
            return {
                root: rootAndPath,
                path: ''
            }
        }
    }

    static getStats(path) {
        const stats = fs.statSync(path);
        if (stats.isDirectory()) {
            return {
                size: fs.readdirSync(path).length,
                last_modified: stats.mtimeMs
            };
        } else {
            return {
                size: stats.size,
                last_modified: stats.mtimeMs
            };
        }
    }

    static mkdir(rootAndPath, newName) {
        return new Promise((resolve, reject) => {
            if (jsUtils.file.isFileName(newName) === false) {
                reject('指定された名前は使用できません。別の名前に変更してください');
            }

            try {
                const rp = this.divideRootPath(rootAndPath);
                const decoded = stockerLib.decodeUrlPath(rp.root, rp.path);

                const newPath = Path.join(decoded, newName);
                if (fs.existsSync(newPath)) {
                    // 既に同じ名前のフォルダがあれば何もしないで成功とする
                    resolve();
                } else {
                    fs.mkdir(newPath, (err) => {
                        if (err) {
                            reject(err.message);
                        }
                        resolve();
                    });
                }
            } catch (e) {
                reject(e.message);
            }
        });
    }
}

/* global jsUtils, render, stocker */

class ActionForm {
    constructor() {
        this.query = jsUtils.url.getQueryInUrl();
        this.filesList = new Array();
    }

    _getReal(filenameObj, path) {
        for (let i = 0; i < filenameObj.length; i++) {
            const f = filenameObj[i];
            if (path === f.path) {
                return f;
            }
        }

        return null;
    }

    _statusIcon() {
        const icon = document.createElement('span');
        icon.innerHTML = '未実行';

        return icon;
    }

    makeFilesList(root, paths, callback) {
        const self = this;
        stocker.api.storage.getProperty(root, paths[0]).then(function (currentProp) {
            getDirectoryProperties(root, currentProp.properties.up_path, NaN, NaN, function (data) {
                self.filesList = [];
                for (const path of paths) {
                    const elem = data.elements.find(e => e.path === path);
                    if (elem) {
                        const icon = self._statusIcon();
                        self.filesList.push({ name: elem.name, root: elem.root, path: elem.path, statusIcon: icon });
                    }
                }
                callback();
            });
        });
    }

    filenameTable() {
        let list = new Array();
        for (let i = 0; i < this.filesList.length; i++) {
            const num = i + 1;
            list.push([num.toString(10), this.filesList[i].name, this.filesList[i].statusIcon]);
        }
        return render.bulma.elements.table(['No', '名前', '実行結果'], list);
    }

    changeStatus(index, stat) {
        const f = this.filesList[index];

        if (f) {
            const elem = f.statusIcon;
            elem.innerHTML = render.bulma.statusIcon[stat];
        }
    }

    setBackToList(f) {
        document.getElementById('cancelButton').onclick = function () { stocker.components.backToList(f.dir, f.location) };
        document.getElementById('backAnchor').onclick = function () { stocker.components.backToList(f.dir, f.location) };
    }
}

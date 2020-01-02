class ActionForm {
    constructor() {
        this.query = jsUtils.url.getQueryInUrl();
        this.filesList = new Array();
    }

    _getReal(filenameObj, path) {
        for (let i=0; i<filenameObj.length; i++) {
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

    makeFilesList(root, files, callback) {
        const self = this;
        stocker.components.getFilenames(root, files, function(reals) {
            self.filesList = [];
            for (let i=0; i<files.length; i++) {
                const icon = self._statusIcon();
                const real = self._getReal(reals, files[i]);
                if (real) {
                    self.filesList.push({name: real.name, root: real.dir, path: files[i], statusIcon: icon});
                }
            }
            callback();
        });
    }

    filenameTable(elem) {
        let list = new Array();
        for (let i=0; i<this.filesList.length; i++) {
            const num = i + 1;
            list.push([num.toString(10), this.filesList[i].name, this.filesList[i].statusIcon]);
        }
        bulmaRender.makeTable(elem, ['No', '名前', '実行結果'], list);
    }

    changeStatus(index, stat) {
        const f = this.filesList[index];

        if (f) {
            const elem = f.statusIcon;
            elem.innerHTML = bulmaRender.statusIcon[stat];
        }
    }

    setBackToList(f) {
        document.getElementById('cancelButton').onclick = function() {stocker.components.backToList(f.dir, f.location)};
        document.getElementById('backAnchor').onclick = function() {stocker.components.backToList(f.dir, f.location)};
    }
}

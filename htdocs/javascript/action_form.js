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

        return "";
    }

    _statusIcon() {
        const icon = document.createElement('span');
        icon.innerHTML = '未実行';

        return icon;
    }

    filenameTable(elem, files, reals) {
        this.filesList = [];
        let list = new Array();
        for (let i=0; i<files.length; i++) {
            const num = i + 1;
            const icon = this._statusIcon();
            const real = this._getReal(reals, files[i]);

            this.filesList.push({name: real.name, root: real.dir, path: files[i], statusIcon: icon});
            list.push([num.toString(10), real.name, icon]);
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

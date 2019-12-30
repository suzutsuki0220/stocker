class ModalContent {
    constructor() {
        this.element = new Object();
        this.form = new Object();

        // initialize sequence
        this._initNewFolder();
    }

    _initNewFolder() {
        this.form.newFolder = document.createElement('form');
        this.form.newFolder.innerHTML = 'フォルダー名: <input type="text" name="foldername" value="">';

        const self = this;
        const foot = document.createElement('span');
        foot.appendChild(bulmaRender.okButton('実行', function() {
            doMkdir(self.form.newFolder.foldername.value, function() {
                const params = jsUtils.url.getRawParams();
                bulmaRender.active(self.element.newFolder, false);
                reloadDirectoryList(params.dir, params.file, 0, 99999);  // TODO: refactor
            }, function(message) {
                window.alert(message);
            });
        }));
        foot.appendChild(bulmaRender.cancelButton('キャンセル', function() {
            bulmaRender.active(self.element.newFolder, false);
        }));

     //   _element.newFolder = bulmaRender.modal(content, true);
        this.element.newFolder = bulmaRender.modalCard("新規フォルダー作成", this.form.newFolder, foot);
        document.body.appendChild(this.element.newFolder);
    }

    newFolder() {
        bulmaRender.active(this.element.newFolder, true);
        this.form.newFolder.foldername.value = "";
        this.form.newFolder.foldername.focus();
    }
}

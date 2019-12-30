class ModalContent {
    constructor() {
        this.modalOperationElement = null;
        this._initNewFolder();
    }

    _initNewFolder() {
        const content = '<form action="#" name="f1" method="POST">フォルダー名: <input type="text" name="foldername" value=""></form>';

        const self = this;
        const foot = document.createElement('span');
        foot.appendChild(bulmaRender.okButton('実行', function() {
            doMkdir(document.f1.foldername.value, function() {
                const params = jsUtils.url.getRawParams();
                bulmaRender.active(self.modalOperationElement, false);
                reloadDirectoryList(params.dir, params.file, 0, 99999);  // TODO: refactor
            }, function(message) {
                window.alert(message);
            });
        }));
        foot.appendChild(bulmaRender.cancelButton('キャンセル', function() {
            bulmaRender.active(self.modalOperationElement, false);
        }));

     //   _modalOperationElement = bulmaRender.modal(content, true);
        this.modalOperationElement = bulmaRender.modalCard("新規フォルダー作成", content, foot);
        document.body.appendChild(this.modalOperationElement);
    }

    newFolder() {
        bulmaRender.active(this.modalOperationElement, true);
        document.f1.foldername.value = "";
        document.f1.foldername.focus();
    }
}

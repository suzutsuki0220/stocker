class ModalContent {
    constructor() {
        this.element = new Object();
        this.form = new Object();

        this._actionForm = new ActionForm();

        // initialize sequence
        this._initNewFolder();
        this._initRemove();
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

    _initRemove() {
        this.form.remove = document.createElement('div');
        this.form.remove.innerHTML = '<span id="filesArea"></span>';

        const self = this;
        const foot = document.createElement('span');
        foot.appendChild(bulmaRender.okButton('実行', function() {
            doRemove(self.form.remove.foldername.value, function() {
                const params = jsUtils.url.getRawParams();
                bulmaRender.active(self.element.remove, false);
                reloadDirectoryList(params.dir, params.file, 0, 99999);  // TODO: refactor
            }, function(message) {
                window.alert(message);
            });
        }));
        foot.appendChild(bulmaRender.cancelButton('キャンセル', function() {
            bulmaRender.active(self.element.remove, false);
        }));

        this.element.remove = bulmaRender.modalCard("削除", this.form.remove, foot);
        document.body.appendChild(this.element.remove);
    }

    remove() {
        if (isAnyChecked() === false) {
            bulmaRender.notification("error", "削除するファイル・フォルダーにチェックを入れてください");
            return;
        }
        bulmaRender.active(this.element.remove, true);

        const self = this;
        const files = getCheckedFiles()
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('filesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('filesArea').innerHTML = "";
            self._actionForm.filenameTable(document.getElementById('filesArea'));
        });
    }
}

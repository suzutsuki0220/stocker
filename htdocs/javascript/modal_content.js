/* global stocker, jsUtils, render getCheckedFiles encoded_dir selectedParam makeDirectorySelector */

class ModalContent {  // eslint-disable-line no-unused-vars
    constructor(onClose) {
        this.onClose = onClose;
        this._actionForm = new ActionForm();  // eslint-disable-line no-undef
    }

    _footerButtons(okFunc, cancelFunc) {
        const foot = document.createElement('span');
        const self = this;

        const okButton = render.bulma.button.okButton('実行', function() {
            self._disableFooterButton(true);
            okFunc();
        });
        okButton.id = 'footerOkButton';
        foot.appendChild(okButton);

        const cancelButton = render.bulma.button.cancelButton('キャンセル', function() {
            self._disableFooterButton(false);
            cancelFunc();
        });
        cancelButton.id = 'footerCancelButton';
        foot.appendChild(cancelButton);

        return foot;
    }

    _disableFooterButton(flag = true) {
        const okButton = document.getElementById('footerOkButton');
        const cancelButton = document.getElementById('footerCancelButton');

        render.bulma.button.loading(okButton, flag);
        cancelButton.disabled = flag;
    }

    _openModal(modalElem) {
        document.body.appendChild(modalElem);
        render.bulma.active.switch(modalElem, true);
    }

    _closeModal(modalElem) {
        render.basic.element.remove(modalElem);
    }

    _callFileFunc(parameterList, cardElement) {
        const changeIcon = function(f, stat) {
            if (!f || !f.statusIcon) {
                return;
            }
            f.statusIcon.innerHTML = render.bulma.statusIcon[stat];
        };

        const self = this;
        const p = parameterList.shift();
        if (!p) {
            self._onSuccess(cardElement);
            return;
        }

        const f = p.list;
        changeIcon(f, "loading");
        jsUtils.fetch.request(
            {uri: stocker.uri.cgi_root + "/action/filefunc.cgi",
             headers: {"Content-Type": "application/x-www-form-urlencoded"},
             body: stocker.components.makeDirFileParam(f.root, f.path, p.parameter),
             method: 'POST',
             format: 'json'
            }, function(json) {
                if (json.status === 'ok') {
                    changeIcon(f, "done");
                    self._callFileFunc(parameterList, cardElement);  // do recursively
                } else {
                    changeIcon(f, "error");
                    self._onError(json.message);
                }
            }, function(error) {
                changeIcon(f, "error");
                self._onError(error.message);
            }
        );
    }

    _onSuccess(cardElement) {
        this._closeModal(cardElement);
        this.onClose();
    }

    _onError(message) {
        window.alert(message);
        this._disableFooterButton(false);
    }

    newFolder(root, path) {
        let cardElement;
        const cardContent = document.createElement('form');
        cardContent.innerHTML = 'フォルダー名: <input type="text" name="foldername" value="">';

        const self = this;
        const foot = this._footerButtons(function() {
            const mkdirWork = [{
                list: {root: root, path: path},
                parameter: {mode: "do_newfolder", newname: cardContent.foldername.value}
            }]
            self._callFileFunc(mkdirWork, cardElement);
        }, function() {
            self._closeModal(cardElement);
        });

        cardElement = render.bulma.components.modalCard("新規フォルダー作成", cardContent, foot, false);
        self._openModal(cardElement);

        cardContent.foldername.value = "";
        cardContent.foldername.focus();
    }

    upload() {
        let cardElement;
        const cardContent = document.createElement('form');
        cardContent.innerHTML =
            '<div class="field is-horizontal"><div class="field-label"><label class="label">ファイルを選択</label></div><div class="field-body"><div class="field"><p class="control"><input type="file" multiple /></p></div></div></div>' +
            '<p>画像・動画を選択<input type="file" accept="image/*" multiple /></p>' +
            '<p>カメラで撮影<input type="file" accept="image/*" capture="environment" /></p>';

        const self = this;
        const foot = this._footerButtons(function() {
            //ok
        }, function() {
            self._closeModal(cardElement);
        });

        cardElement = render.bulma.components.modalCard("アップロード", cardContent, foot, false);
        self._openModal(cardElement);
    }

    remove() {
        const files = getCheckedFiles()
        if (files.length === 0) {
            render.bulma.elements.notification("error", "削除するファイル・フォルダーにチェックを入れてください");
            return;
        }

        let cardElement;
        const cardContent = document.createElement('div');
        cardContent.innerHTML = '<span id="filesArea"></span>';

        const self = this;
        const foot = this._footerButtons(function() {
            let removeWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                removeWorks.push({list: list[i], parameter: {mode: 'do_delete'}});
            }
            self._callFileFunc(removeWorks, cardElement);
        }, function() {
            self._closeModal(cardElement);
        });

        cardElement = render.bulma.components.modalCard("削除", cardContent, foot, false);
        self._openModal(cardElement);

        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('filesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('filesArea').innerHTML = "";
            document.getElementById('filesArea').appendChild(self._actionForm.filenameTable());
        });
    }

    rename() {
        const files = getCheckedFiles()
        if (files.length === 0) {
            render.bulma.elements.notification("error", "名前を変更するファイル・フォルダーにチェックを入れてください");
            return;
        }
        const cardContent = document.createElement('div');
        cardContent.innerHTML = '<span id="renameFormArea"></span>';

        let cardElement;
        const self = this;
        const foot = this._footerButtons(function() {
            let renameWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                const newName = document.getElementById('newName' + i).value;
                renameWorks.push({list: list[i], parameter: {mode: 'do_rename', newname: newName}});
            }
            self._callFileFunc(renameWorks, cardElement);
        }, function() {
            self._closeModal(cardElement);
        });

        cardElement = render.bulma.components.modalCard("名前の変更", cardContent, foot, false);
        self._openModal(cardElement);

        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('renameFormArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('renameFormArea').innerHTML = "";

            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
            //self._actionForm.filenameTable(document.getElementById('renameFormArea'));
                const label = list[i].name;  // 変更前の名前
                const control = document.createElement('input');
                control.classList.add('input');
                control.id = 'newName' + i;
                control.type = 'text';
                control.value = list[i].name;

                document.getElementById('renameFormArea').appendChild(render.bulma.form.formField(label, control));
            }
        });
    }

    move() {
        const files = getCheckedFiles()
        if (files.length === 0) {
            render.bulma.elements.notification("error", "移動するファイル・フォルダーにチェックを入れてください");
            return;
        }

        let cardElement;
        const cardContent = document.createElement('div');
        cardContent.innerHTML =
        '<h2 class="subtitle is-6">移動先:</h2>' +
        '<span id="destinationSelectorArea"></span>' +
        '<span id="moveFilesArea"></span>';

        const self = this;
        const foot = this._footerButtons(function() {
            let moveWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                moveWorks.push({list: list[i], parameter: {mode: 'do_move', dest_path: selectedParam.path, dest_root: selectedParam.root}});
            }
            self._callFileFunc(moveWorks, cardElement);
        }, function() {
            self._closeModal(cardElement);
        });

        cardElement = render.bulma.components.modalCard("移動", cardContent, foot, false);
        self._openModal(cardElement);

        makeDirectorySelector(document.getElementById('destinationSelectorArea'));
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('moveFilesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('moveFilesArea').innerHTML = ""
            document.getElementById('moveFilesArea').appendChild(self._actionForm.filenameTable());
        });
    }
}

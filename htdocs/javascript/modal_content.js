/* global stocker, jsUtils, render getCheckedFiles encoded_dir selectedParam makeDirectorySelector */

class ModalContent {
    constructor(onClose) {
        this.onClose = onClose;
        this._actionForm = new ActionForm();
    }

    _footerButtons(okFunc, cancelFunc) {
        const foot = document.createElement('span');
        foot.appendChild(render.bulma.button.okButton('実行', function() {
            //disableActionButton();
            okFunc();
        }));
        foot.appendChild(render.bulma.button.cancelButton('キャンセル', function() {
            cancelFunc();
        }));

        return foot;
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
    }

    newFolder(root, path) {
        var cardElement;
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
        document.body.appendChild(cardElement);
        render.bulma.active.switch(cardElement, true);

        cardContent.foldername.value = "";
        cardContent.foldername.focus();
    }

    remove() {
        const files = getCheckedFiles()
        if (files.length === 0) {
            render.bulma.elements.notification("error", "削除するファイル・フォルダーにチェックを入れてください");
            return;
        }

        var cardElement;
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
        document.body.appendChild(cardElement);
        render.bulma.active.switch(cardElement, true);

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

        var cardElement;
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
        document.body.appendChild(cardElement);
        render.bulma.active.switch(cardElement, true);

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

        var cardElement;
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
        document.body.appendChild(cardElement);
        render.bulma.active.switch(cardElement, true);

        makeDirectorySelector(document.getElementById('destinationSelectorArea'));
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('moveFilesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('moveFilesArea').innerHTML = ""
            document.getElementById('moveFilesArea').appendChild(self._actionForm.filenameTable());
        });
    }
}

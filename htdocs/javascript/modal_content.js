/* global stocker, jsUtils, render */

class ModalContent {
    constructor(onClose) {
        this.element = new Object();
        this.form = new Object();
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

    _closeModal(modalElem, onClose = null) {
        render.basic.element.remove(modalElem);
        if (onClose) {
            onClose();
        }
    }

    _callFileFunc(parameterList, onSuccess, onError) {
        const changeIcon = function(f, stat) {
            if (!f || !f.statusIcon) {
                return;
            }
            f.statusIcon.innerHTML = render.bulma.statusIcon[stat];
        };

        const p = parameterList.shift();
        if (!p) {
            onSuccess();
            return;
        }

        const self = this;
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
                    self._callFileFunc(parameterList, onSuccess, onError);  // do recursively
                } else {
                    changeIcon(f, "error");
                    onError(json.message);
                }
            }, function(error) {
                changeIcon(f, "error");
                onError(error.message);
            }
        );
    }

    newFolder(root, path) {
        this.form.newFolder = document.createElement('form');
        this.form.newFolder.innerHTML = 'フォルダー名: <input type="text" name="foldername" value="">';

        const self = this;
        const foot = this._footerButtons(function() {
            const mkdirWork = [{
                list: {root: root, path: path},
                parameter: {mode: "do_newfolder", newname: self.form.newFolder.foldername.value}
            }]
            self._callFileFunc(mkdirWork, function() {
                self._closeModal(self.element.newFolder, self.onClose);
            }, function(message) {
                window.alert(message);
            });
        }, function() {
            self._closeModal(self.element.newFolder);
        });

        this.element.newFolder = render.bulma.components.modalCard("新規フォルダー作成", this.form.newFolder, foot, false);
        document.body.appendChild(this.element.newFolder);
        render.bulma.active.switch(this.element.newFolder, true);

        this.form.newFolder.foldername.value = "";
        this.form.newFolder.foldername.focus();
    }

    remove() {
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "削除するファイル・フォルダーにチェックを入れてください");
            return;
        }

        this.form.remove = document.createElement('div');
        this.form.remove.innerHTML = '<span id="filesArea"></span>';

        const self = this;
        const foot = this._footerButtons(function() {
            let removeWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                removeWorks.push({list: list[i], parameter: {mode: 'do_delete'}});
            }

            self._callFileFunc(removeWorks, function() {
                self._closeModal(self.element.remove, self.onClose);
            }, function(message) {
                window.alert(message);
            });
        }, function() {
            self._closeModal(self.element.remove);
        });

        this.element.remove = render.bulma.components.modalCard("削除", this.form.remove, foot, false);
        document.body.appendChild(this.element.remove);
        render.bulma.active.switch(this.element.remove, true);

        const files = getCheckedFiles()
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('filesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('filesArea').innerHTML = "";
            document.getElementById('filesArea').appendChild(self._actionForm.filenameTable());
        });
    }

    rename() {
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "名前を変更するファイル・フォルダーにチェックを入れてください");
            return;
        }
        this.form.rename = document.createElement('div');
        this.form.rename.innerHTML = '<span id="renameFormArea"></span>';

        const self = this;
        const foot = this._footerButtons(function() {
            let renameWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                const newName = document.getElementById('newName' + i).value;
                renameWorks.push({list: list[i], parameter: {mode: 'do_rename', newname: newName}});
            }

            self._callFileFunc(renameWorks, function() {
                self._closeModal(self.element.rename, self.onClose);
            }, function(message) {
                window.alert(message);
            });
        }, function() {
            self._closeModal(self.element.rename);
        });

        this.element.rename = render.bulma.components.modalCard("名前の変更", this.form.rename, foot, false);
        document.body.appendChild(this.element.rename);
        render.bulma.active.switch(this.element.rename, true);

        const files = getCheckedFiles()
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
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "移動するファイル・フォルダーにチェックを入れてください");
            return;
        }

        this.form.move = document.createElement('div');
        this.form.move.innerHTML =
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

            self._callFileFunc(moveWorks, function() {
                self._closeModal(self.element.move, self.onClose);
            }, function(message) {
                window.alert(message);
            });
        }, function() {
            self._closeModal(self.element.move);
        });

        this.element.move = render.bulma.components.modalCard("移動", this.form.move, foot, false);
        document.body.appendChild(this.element.move);
        render.bulma.active.switch(this.element.move, true);

        makeDirectorySelector(document.getElementById('destinationSelectorArea'));
        const files = getCheckedFiles()
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('moveFilesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('moveFilesArea').innerHTML = ""
            document.getElementById('moveFilesArea').appendChild(self._actionForm.filenameTable());
        });
    }
}

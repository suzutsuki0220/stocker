/* global jsUtils, render, callFileFunc */

class ModalContent {
    constructor() {
        this.element = new Object();
        this.form = new Object();

        this._actionForm = new ActionForm();

        // initialize sequence
        this._initNewFolder();
        this._initRemove();
        this._initRename();
        this._initMove();
    }

    _footerButtons(modalElem, okFunc) {
        const foot = document.createElement('span');
        foot.appendChild(render.bulma.button.okButton('実行', function() {
            //disableActionButton();
            okFunc();
        }));
        foot.appendChild(render.bulma.button.cancelButton('キャンセル', function() {
            render.bulma.active.switch(modalElem, false);
        }));

        return foot;
    }

    _closeModal(modalElem) {
        const params = jsUtils.url.getRawParams();
        render.bulma.active.switch(modalElem, false);
        reloadDirectoryList(params.dir, params.file, 0, 99999);  // TODO: refactor
    }

    _initNewFolder() {
        this.form.newFolder = document.createElement('form');
        this.form.newFolder.innerHTML = 'フォルダー名: <input type="text" name="foldername" value="">';

        const self = this;
        const foot = this._footerButtons(this.element.newFolder, function() {
            doMkdir(self.form.newFolder.foldername.value, function() {
                self._closeModal(self.element.newFolder);
            }, function(message) {
                window.alert(message);
            });
        });

        this.element.newFolder = render.bulma.components.modalCard("新規フォルダー作成", this.form.newFolder, foot);
        document.body.appendChild(this.element.newFolder);
    }

    newFolder() {
        render.bulma.active.switch(this.element.newFolder, true);
        this.form.newFolder.foldername.value = "";
        this.form.newFolder.foldername.focus();
    }

    _initRemove() {
        this.form.remove = document.createElement('div');
        this.form.remove.innerHTML = '<span id="filesArea"></span>';

        const self = this;
        const foot = this._footerButtons(self.element.remove, function() {
            let removeWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                removeWorks.push({list: list[i], parameter: {mode: 'do_delete'}});
            }

            callFileFunc(removeWorks, function() {
                self._closeModal(self.element.remove);
            }, function(message) {
                window.alert(message);
            });
        });

        this.element.remove = render.bulma.components.modalCard("削除", this.form.remove, foot);
        document.body.appendChild(this.element.remove);
    }

    remove() {
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "削除するファイル・フォルダーにチェックを入れてください");
            return;
        }
        render.bulma.active.switch(this.element.remove, true);

        const self = this;
        const files = getCheckedFiles()
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('filesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('filesArea').innerHTML = "";
            self._actionForm.filenameTable(document.getElementById('filesArea'));
        });
    }

    _initRename() {
        this.form.rename = document.createElement('div');
        this.form.rename.innerHTML = '<span id="renameFormArea"></span>';

        const self = this;
        const foot = this._footerButtons(self.element.rename, function() {
            let renameWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                const newName = document.getElementById('newName' + i).value;
                renameWorks.push({list: list[i], parameter: {mode: 'do_rename', newname: newName}});
            }

            callFileFunc(renameWorks, function() {
                this._closeModal(self.element.rename);
            }, function(message) {
                window.alert(message);
            });
        });

        this.element.rename = render.bulma.components.modalCard("名前の変更", this.form.rename, foot);
        document.body.appendChild(this.element.rename);
    }

    rename() {
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "名前を変更するファイル・フォルダーにチェックを入れてください");
            return;
        }
        render.bulma.active.switch(this.element.rename, true);

        const self = this;
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

    _initMove() {
        this.form.move = document.createElement('div');
        this.form.move.innerHTML =
        '<h2 class="subtitle is-6">移動先:</h2>' +
        '<span id="destinationSelectorArea"></span>' +
        '<span id="moveFilesArea"></span>';

        const self = this;
        const foot = this._footerButtons(self.element.move, function() {
            let moveWorks = new Array();
            const list = self._actionForm.filesList;
            for (let i=0; i<list.length; i++) {
                moveWorks.push({list: list[i], parameter: {mode: 'do_move', dest_path: selectedParam.path, dest_root: selectedParam.root}});
            }

            callFileFunc(moveWorks, function() {
                this._closeModal(self.element.move);
            }, function(message) {
                window.alert(message);
            });
        });

        this.element.move = render.bulma.components.modalCard("移動", this.form.move, foot);
        document.body.appendChild(this.element.move);
    }

    move() {
        if (isAnyChecked() === false) {
            render.bulma.elements.notification("error", "移動するファイル・フォルダーにチェックを入れてください");
            return;
        }
        render.bulma.active.switch(this.element.move, true);
        makeDirectorySelector(document.getElementById('destinationSelectorArea'));
        const self = this;
        const files = getCheckedFiles()
        //document.getElementById('filesCountArea').innerText = files.length;
        document.getElementById('moveFilesArea').innerHTML = "読み込み中...";
        this._actionForm.makeFilesList(encoded_dir, files, function() {
            document.getElementById('moveFilesArea').innerHTML = "";
            self._actionForm.filenameTable(document.getElementById('moveFilesArea'));
        });
    }
}

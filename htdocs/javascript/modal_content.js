let _modalOperationElement;

document.addEventListener('DOMContentLoaded', () => {
    _initOperationNewFolder();
});

function _initOperationNewFolder() {
    const content = '<form action="#" name="f1" method="POST">フォルダー名: <input type="text" name="foldername" value=""></form>';

    const foot = document.createElement('span');
    foot.appendChild(bulmaRender.okButton('実行', function() {
        doMkdir(document.f1.foldername.value, function() {
            const params = jsUtils.url.getRawParams();
            bulmaRender.active(_modalOperationElement, false);
            reloadDirectoryList(params.dir, params.file, 0, 99999);  // TODO: refactor
        }, function(message) {
            window.alert(message);
        });
    }));
    foot.appendChild(bulmaRender.cancelButton('キャンセル', function() {
        bulmaRender.active(_modalOperationElement, false);
    }));

 //   _modalOperationElement = bulmaRender.modal(content, true);
    _modalOperationElement = bulmaRender.modalCard("新規フォルダー作成", content, foot);
    document.body.appendChild(_modalOperationElement);
}

function operationNewFolder() {
    bulmaRender.active(_modalOperationElement, true);
    document.f1.foldername.value = "";
    document.f1.foldername.focus();
}

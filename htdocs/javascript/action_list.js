/* global jsUtils, stocker */

class ActionList {
    constructor(options) {
        this.actionParam = new Array();
        this.element = options.element;
    }

    _addList(list_json) {
        const self = this;
        const fragment = document.createDocumentFragment();

        for (var i = 0; i < list_json.length; i++) {
            const l = list_json[i];

            const a = document.createElement('a');
            a.classList.add('navbar-item');
            a.onclick = function () { self._performAction(l.id) };
            a.innerText = l.title;
            fragment.appendChild(a);
        }

        this.element.appendChild(fragment);
    }

    make() {
        const self = this;

        jsUtils.fetch.request({
            uri: stocker.uri.htdocs_root + "/action_param.json",
            format: 'json',
            method: 'GET'
        }, function (json) {
            self._addList(json);
            self.actionParam = json;
        }, function (error) {
            console.warn(error);
            render.bulma.elements.notification("error", 'error: ' + error.message);
        });
    }

    _performAction(sw) {
        for (var i = 0; i < this.actionParam.length; i++) {
            const ap = this.actionParam[i];
            if (ap.id === sw) {
                const params = Object.assign((ap.parameters || {}), {
                    dir: decodeURIComponent(document.file_check.fm_dir.value),
                    path: decodeURIComponent(document.file_check.target.value),
                    file: getCheckedFiles()  // stocker_list.js
                });
                location.href = stocker.uri.htdocs_root + "/action/" + ap.form + '?' + jsUtils.url.makeQueryString(params);
            }
        }
    }
}

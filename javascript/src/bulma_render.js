function textNode(tagName, value, option = {}) {
    var elem = document.createElement(tagName);
    elem.innerHTML = value;  // enable HTML tags
//    elem.appendChild(document.createTextNode(value));

    for (var property in option) {
        elem.setAttribute(property, option[property]);
    }

    return elem;
}

function tableHeader(names) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    var fragment = document.createDocumentFragment();
    for (var i=0; i<names.length; i++) {
        fragment.appendChild(textNode('th', names[i]));
    }

    tr.appendChild(fragment);
    thead.appendChild(tr);

    return thead;
}

function tableBody(values) {
    const tbody = document.createElement('tbody');

    var fragment = document.createDocumentFragment();
    for (var i=0; i<values.length; i++) {
        const v = values[i];
        var tr = document.createElement('tr');
        if (Array.isArray(v)) {
            for (var j=0; j<v.length; j++) {
                tr.appendChild(textNode('td', v[j]));
            }
        } else {
            tr.appendChild(textNode('td', v));
        }
        fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);

    return tbody;
}

module.exports.statusIcon = {
    loading: '<span class="icon is-medium has-text-info"><i class="fas fa-spinner fa-pulse"></i></span>',
    info: '<span class="icon is-medium has-text-info"><i class="fas fa-info-circle"></i></span>',
    done: '<span class="icon is-medium has-text-success"><i class="fas fa-check"></i></span>',
    warning: '<span class="icon is-medium has-text-warning"><i class="fas fa-exclamation-triangle"></i></span>',
    error: '<span class="icon is-medium has-text-danger"><i class="fas fa-exclamation-circle"></i></span>'
};

module.exports.makeTable = function(elem, names, values) {
    elem.appendChild(tableHeader(names));
    elem.appendChild(tableBody(values));
}

module.exports.notification = function(elem, message) {
    elem.appendChild(textNode('div', message, {class: "notification is-info"}));
};

module.exports.warning = function(elem, message) {
    elem.appendChild(textNode('div', message, {class: "notification is-danger"}));
};

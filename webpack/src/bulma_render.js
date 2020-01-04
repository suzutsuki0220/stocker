function active(elem, flag) {
    if (flag) {
        elem.classList.add('is-active');
    } else {
        elem.classList.remove('is-active');
    }
}

function closeButton(elem) {
    const button = newNode('button', '', {class: 'delete'});
    button.onclick = function() {
        elem.parentNode.removeChild(elem);
    };

    return button;
}

function newNode(tagName, value, option = {}) {
    var elem = document.createElement(tagName);

    if (typeof value === 'string') {
        elem.innerHTML = value;  // enable HTML tags
    } else {
        elem.appendChild(value);  // expects object HTML element
    }

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
        fragment.appendChild(newNode('th', names[i]));
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
                tr.appendChild(newNode('td', v[j]));
            }
        } else {
            tr.appendChild(newNode('td', v));
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

module.exports.active = active;

module.exports.okButton = function(contents, onClick) {
    const button = newNode("button", contents, {class: "button is-link"});
    button.onclick = onClick;
    return button;
}

module.exports.cancelButton = function(contents, onClick) {
    const button = newNode("button", contents, {class: "button"});
    button.onclick = onClick;
    return button;
}

module.exports.formField = function(label, control, help = null) {
    const field = document.createElement('div');
    field.classList.add('field');

    field.appendChild(newNode('label', label, {class: 'label'}));
    field.appendChild(newNode('div', control, {class: 'control'}));
    if (help) {
        field.appendChild(help);
    }

    return field;
}

module.exports.formHelp = function(type, message) {
    const help = newNode('p', help, {class: 'help'});
    switch(type) {
    case "success":
        help.classList.add('is-success');
        break;
    case "failure":
        help.classList.add('is-danger');
        break;
    }

    return help;
}

module.exports.makeTable = function(elem, names, values) {
    const table = document.createElement('table');
    table.classList.add('table');

    table.appendChild(tableHeader(names));
    table.appendChild(tableBody(values));

    elem.appendChild(table);
}

module.exports.notification = function(level, message, showCloseButton=true) {
    const c = {
        info:    {class: "notification is-info"},
        warning: {class: "notification is-warning"},
        error:   {class: "notification is-danger"}
    };

    const notif =newNode('div', message, c[level]);
    if (showCloseButton === true) {
        notif.appendChild(closeButton(notif));
    }

    return document.body.insertBefore(notif, document.body.firstChild);
};

module.exports.card = function(elem, cards) {
    const columns = document.createElement('div');
    columns.classList.add('columns');

    for (let i=0; i<cards.length; i++) {
        const column = document.createElement('div');
        column.classList.add('column');
        column.classList.add('is-one-fifth');

        const card = document.createElement('div');
        card.classList.add('card');

        const c = cards[i];
        if (c.image) {
            card.appendChild(newNode('div', c.image, {class: 'card-image'}));
        }
        if (c.content) {
            card.appendChild(newNode('div', c.content, {class: 'card-content'}));
        }

        column.appendChild(card);
        columns.appendChild(column);
    }

    elem.appendChild(columns);
};

module.exports.media = function(elem, image, content, right = "") {
    const media = document.createElement('div');
    media.classList.add('media');

    media.appendChild(newNode('div', image, {class: 'media-left'}));
    media.appendChild(newNode('div', content, {class: 'media-content'}));
    if (right) {
        media.appendChild(newNode('div', right, {class: 'media-right'}));
    }

    elem.appendChild(media);
};

module.exports.modal = function(content, showCloseButton=true) {
    const modal = newNode('div', '', {class: 'modal'});
    modal.appendChild(newNode('div', '', {class: 'modal-background'}));
    modal.appendChild(newNode('div', content, {class: 'modal-content'}));

    if (showCloseButton === true) {
        const button = newNode('button', '', {class: 'modal-close is-large'});
        button.onclick = function() {
            active(modal, false);
        };
        modal.appendChild(button);
    }

    return modal;
};

module.exports.modalCard = function(title, content, footer = "", showCloseButton=true) {
    const modal = newNode('div', '', {class: 'modal'});
    modal.appendChild(newNode('div', '', {class: 'modal-background'}));

    const cardBody = newNode('div', '', {class: 'modal-card'});
    const header = newNode('header', '<p class="modal-card-title">' + title + '</p>', {class: 'modal-card-head'});
    if (showCloseButton === true) {
        const button = newNode('button', '', {class: 'delete'});
        button.onclick = function() {
            active(modal, false);
        }
        header.appendChild(button);
    }
    cardBody.appendChild(header);
    cardBody.appendChild(newNode('section', content, {class: 'modal-card-body'}))+
    cardBody.appendChild(newNode('footer', footer, {class: 'modal-card-foot'}));

    modal.appendChild(cardBody);

    return modal;
};

window.jsUtils = require('js-utils');
window.stocker = require('./src');
window.render = {
    basic: require('html-render')('basic'),
    bulma: require('html-render')('bulma')
};

// TODO: remove below
window.stockerConfig = require('./src/stocker-config').stockerConfig;

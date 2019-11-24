const myQuery = jsUtils.url.getQueryInUrl();

function setBackToStocker(f) {
    document.getElementById('cancelButton').onclick = function() {stocker.components.backToList(f.dir, f.location)};
    document.getElementById('backAnchor').onclick = function() {stocker.components.backToList(f.dir, f.location)};
}

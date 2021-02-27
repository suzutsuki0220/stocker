/* global jsUtils, stocker */

function printIcons(i, e) {
    const HTDOCS_ROOT = stocker.uri.htdocs_root;

    //  try {

    let icon;
    let action;

    if (e.type === "DIRECTORY") {
        icon = stocker.uri.icon.directory;
        action = "dir:" + e.path;
    } else {
        if (stocker.supportTypes.pattern.audio.test(e.name)) {
            icon = stocker.uri.icon.audio;
            action = HTDOCS_ROOT + "/music_player.html?file=" + e.path + "&dir=" + e.root;
        } else if (stocker.supportTypes.pattern.image.test(e.name) || stocker.supportTypes.browserPlayableMovie().test(e.name)) {
            icon = HTDOCS_ROOT + "/api/v1/media/" + e.root + "/" + e.path + "/thumbnail";
            action = HTDOCS_ROOT + "/picture_viewer.html?file=" + e.path + "&dir=" + e.root;
        } else if (stocker.supportTypes.pattern.video.test(e.name)) {
            icon = HTDOCS_ROOT + "/api/v1/media/" + e.root + "/" + e.path + "/thumbnail";
            action = HTDOCS_ROOT + "/action/converter.html?file=" + e.path + "&dir=" + e.root;
        } else if (stocker.supportTypes.pattern.gps.test(e.name)) {
            icon = stocker.uri.icon.gps;
            action = HTDOCS_ROOT + "/gps_viewer.html?file=" + e.path + "&dir=" + e.root;
        } else if (stocker.supportTypes.pattern.txt.test(e.name)) {
            icon = stocker.uri.icon.txt;
            action = HTDOCS_ROOT + "/text_viewer.html?file=" + e.path + "&dir=" + e.root;
        } else if (stocker.supportTypes.pattern.doc.test(e.name)) {
            icon = stocker.uri.icon.doc;
            action = HTDOCS_ROOT + "/api/v1/storage/" + e.root + "/" + e.path + "/raw";
        } else if (stocker.supportTypes.pattern.excel.test(e.name)) {
            icon = stocker.uri.icon.excel;
            action = HTDOCS_ROOT + "/api/v1/storage/" + e.root + "/" + e.path + "/raw";
        } else if (stocker.supportTypes.pattern.ppt.test(e.name)) {
            icon = stocker.uri.icon.ppt;
            action = HTDOCS_ROOT + "/api/v1/storage/" + e.root + "/" + e.path + "/raw";
        } else if (stocker.supportTypes.pattern.pdf.test(e.name)) {
            icon = stocker.uri.icon.pdf;
            action = HTDOCS_ROOT + "/api/v1/storage/" + e.root + "/" + e.path + "/raw";
        } else {
            icon = stocker.uri.icon.unknown;
            action = HTDOCS_ROOT + "/api/v1/storage/" + e.root + "/" + e.path + "/raw";
        }
    }

    const id = "icon_" + i;
    printIcon(id, e.path, e.name, e.size, e.last_modified, icon, action);
    //  } catch(e) {
    //     alert("ERROR: " + e.description);
    //  }
}

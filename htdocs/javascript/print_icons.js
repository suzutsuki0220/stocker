function printIcons(i, e) {
    const HTDOCS_ROOT = stocker.uri.htdocs_root;

//  try {

    var icon;
    var action;

    const name = e.name;
    const path = e.path;

    if (e.type === "DIRECTORY") {
        icon   = stocker.uri.icon.directory;
        action = "dir:" + path;
    } else {
        if (stocker.supportTypes.pattern.audio.test(name)) {
            icon   = stocker.uri.icon.audio;
            action = HTDOCS_ROOT + "/music_player.html?file=" + path + "&dir=" + encoded_dir;
        } else if (stocker.supportTypes.pattern.image.test(name) || stocker.supportTypes.browserPlayableMovie().test(name)) {
            icon   = stocker.uri.cgi.thumbnail + "?file=" + path + "&dir=" + encoded_dir;
            action = HTDOCS_ROOT + "/picture_viewer.html?file=" + path + "&dir=" + encoded_dir;
        } else if (stocker.supportTypes.pattern.video.test(name)) {
            icon   = stocker.uri.cgi.thumbnail + "?file=" + path + "&dir=" + encoded_dir;
            action = HTDOCS_ROOT + "/action/converter.html?file=" + path + "&dir=" + encoded_dir;
        } else if (stocker.supportTypes.pattern.gps.test(name)) {
            icon   = stocker.uri.icon.gps;
            action = HTDOCS_ROOT + "/gps_viewer.html?file=" + path + "&dir=" + encoded_dir;
        } else if (stocker.supportTypes.pattern.txt.test(name)) {
            icon   = stocker.uri.icon.txt;
            action = HTDOCS_ROOT + "/text_viewer.html?file=" + path + "&dir=" + encoded_dir;
        } else if (stocker.supportTypes.pattern.doc.test(name)) {
            icon   = stocker.uri.icon.doc;
            action = stocker.uri.cgi.get_file + "?file=" + path + "&dir=" + encoded_dir + "&mime=application/msword";
        } else if (stocker.supportTypes.pattern.excel.test(name)) {
            icon   = stocker.uri.icon.excel;
            action = stocker.uri.cgi.get_file + "?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-excel";
        } else if (stocker.supportTypes.pattern.ppt.test(name)) {
            icon   = stocker.uri.icon.ppt;
            action = stocker.uri.cgi.get_file + "?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-powerpoint";
        } else if (stocker.supportTypes.pattern.pdf.test(name)) {
            icon   = stocker.uri.icon.pdf;
            action = stocker.uri.cgi.get_file + "?file=" + path + "&dir=" + encoded_dir + "&mime=application/pdf";
        } else {
            icon   = stocker.uri.icon.unknown;
            action = stocker.uri.cgi.get_file + "?file=" + path + "&dir=" + encoded_dir + "&mime=application/octet-stream";
        }
    }

    const id = "icon_" + i;
    printIcon(id, path, name, e.size, e.last_modified, icon, action);
//  } catch(e) {
//     alert("ERROR: " + e.description);
//  }
}

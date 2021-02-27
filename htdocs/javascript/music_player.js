var tracks = new Array();

const graypad = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

let params, rootDir, upPath;

window.addEventListener("load", function (event) {
    params = jsUtils.url.getRawParams();
    rootDir = params.dir;

    errorCoverart();

    // 再生可能形式チェック
    if (support_mp3 == 'maybe' || support_mp3 == 'probably') { document.controller.type[1].checked = true; }
    else if (support_ogg == 'maybe' || support_ogg == 'probably') { document.controller.type[2].checked = true; }
    else if (support_wav == 'maybe' || support_wav == 'probably') { document.controller.type[0].checked = true; }

    // CoverArt
    if (document.coverart.addEventListener) {
        document.coverart.addEventListener("error", errorCoverart, false);
        document.coverart.addEventListener("abort", errorCoverart, false);
    } else if (document.coverart.attachEvent) {  // for InternetExplorer
        document.coverart.attachEvent("onerror", errorCoverart);
        document.coverart.attachEvent("onabort", errorCoverart);
    }

    getDirectoryProperties(params.dir, params.file, 0, 0, function (data) {
        try {
            upPath = data.properties.up_path;
            getDirectoryProperties(params.dir, upPath, 0, 0, getMusicFiles);
        } catch (e) {
            alert("ERROR: " + e.description);
        }
    });
});

function errorCoverart() {
    document.coverart.src = graypad;
}

function sortMusicListByOrder() {
    for (i = tracks.length - 1; i > 0; i--) {
        for (j = 0; j < i; j++) {
            if (parseInt(tracks[j].playOrder) > parseInt(tracks[j + 1].playOrder)) {
                var temp = tracks[j + 1];
                tracks[j + 1] = tracks[j];
                tracks[j] = temp;
            }
        }
    }
}

function printMusicList() {
    let content;

    sortMusicListByOrder();

    content = "<table border=1>";
    content += "<tr><th>No.</th><th>title</th><th>time</th><th>artist</th><th>album</th><th>year</th></tr>";
    for (i = 0; i < tracks.length; i++) {
        const num = i + 1;
        content += "<tr id='track" + i + "'>";
        content += "<td>" + num + "</td>";
        content += "<td><a href=\"javascript:playit('" + i + "')\">" + tracks[i].title + "</a></td>";
        content += "<td>" + tracks[i].time + "</td>";
        content += "<td>" + tracks[i].artist + "</td>";
        content += "<td>" + tracks[i].album + "</td>";
        content += "<td>" + tracks[i].year + "</td>";
        content += "</tr>";
    }
    content += "</table>";

    document.getElementById('music_list').innerHTML = content;
}

function getTrackOrder(t, element) {
    if (!t.track) {
        return element.num; // tagにtrack noがなければファイル名順の番号を使う
    }

    return t.disc_number ? parseInt(t.disc_number) * 100 + parseInt(t.track) : parseInt(t.track);
}

function getMediaTag(element) {
    return new Promise(function (resolve) {
        stocker.api.media.getTag(params.dir, element.path)
            .then(function (json) {
                resolve({
                    ...json,
                    root: params.dir,
                    path: element.path,
                    title: json.title || element.name,  // tagのtitleが無ければファイル名をタイトルとする
                    playOrder: getTrackOrder(json, element)
                });
            }).catch(function (e) {
                resolve({
                    root: params.dir,
                    path: element.path,
                    title: element.name, // ファイル名をタイトルとする
                    playOrder: element.num   // ファイル名順で番号を振る
                });
            });
    });
}

function getMusicFiles(data) {
    document.title = data.properties.name;
    document.getElementById('directory_name_area').innerHTML = data.properties.name;

    const elements = data.elements;
    if (elements === null) {
        alert("ERROR: music list has no elements");
        return;
    }

    tracks = [];
    elements.forEach(async function (e) {
        if (stocker.supportTypes.pattern.audio.test(e.name)) {
            const tagData = await getMediaTag(e);
            tracks.push(tagData);
            printMusicList();
        }
    });
}

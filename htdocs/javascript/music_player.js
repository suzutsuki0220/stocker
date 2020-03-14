var track = new Array();
var music_count = 0;  // ajaxを読んだ数とcallbackが実行された数が一致した時にリスト内の情報を全て読み込んだと判断する

const STOCKER_CGI = stocker.uri.cgi.stocker;
const TAGINFO_CGI = stocker.uri.cgi.music_player.tag_info;
const GET_MEDIA_CGI = stocker.uri.cgi.music_player.get_media;

const graypad = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

let params, rootDir, upPath;

window.addEventListener("load", function(event) {
    params = jsUtils.url.getRawParams();
    rootDir = params.dir;

    errorCoverart();
    var player_timer = document.getElementById('AudioTimer');

    // 再生可能形式チェック
    if      (support_mp3 == 'maybe' || support_mp3 == 'probably') { document.controller.type[1].checked = true; }
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

    getDirectoryList(params.dir, params.file, 0, 0, function musicList(data) {
        try {
            const directory = jsUtils.xml.getFirstFoundChildNode(data, 'directory');
            const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['up_path'])[0];
            upPath  = properties.up_path;

            getDirectoryList(params.dir, upPath, 0, 0, getMusicFiles);
        } catch(e) {
            alert("ERROR: " + e.description);
        }
    });
});

function errorCoverart() {
  document.coverart.src = graypad;
}

function sortMusicListByTrackNumber() {
    for(i=track.length-1 ; i>0 ; i--) {
        for(j=0 ; j<i ; j++) {
            if(parseInt(track[j].track_no) > parseInt(track[j+1].track_no)) {
                var temp = track[j+1];
                track[j+1] = track[j];
                track[j] = temp;
            }
        }
    }
}

function printMusicList() {
    var content;

    if (music_count === track.length) {
        sortMusicListByTrackNumber();

        content  = "<table border=1>";
        content += "<tr><th>No.</th><th>title</th><th>time</th><th>artist</th><th>album</th><th>year</th></tr>";
        for(i=0 ; i<track.length ; i++) {
            const num = i+1;
            content += "<tr id='track" + i + "'>";
            content += "<td>"+ num +"</td>";
            content += "<td><a href=\"javascript:playit('"+ i +"')\">"+ track[i].title +"</a></td>";
            content += "<td>"+ track[i].time +"</td>";
            content += "<td>"+ track[i].artist +"</td>";
            content += "<td>"+ track[i].album +"</td>";
            content += "<td>"+ track[i].year +"</td>";
            content += "</tr>";
        }
        content += "</table>";
    } else {
        content = "タグを読み込み中 " + music_count + "/" + track.length;
    }

    document.getElementById('music_list').innerHTML = content;
}

function addTagInfoToTrack(data, idx) {
    const get_names = [
        "title",
        "artist",
        "album",
        "year",
        "comment",
        "track",
        "genre",
        "bitrate",
        "sample_rate",
        "channels",
        "duration",
        "time"
    ];
    track[idx] = Object.assign(track[idx], jsUtils.xml.getDataInElements(data, "tag", get_names)[0]);

    track[idx].title    = track[idx].title || track[idx].name;  // tagにtitleがなければファイル名を使う
    track[idx].track_no = track[idx].track || track[idx].num; // tagにtrack noがなければファイル名順の番号を使う
    track[idx].getProperty = true;

    music_count++;
    printMusicList();
}

function addEmptyInfoToTrack(idx) {
    track[idx].title    = track[idx].name;  // tagにtitleがなければファイル名を使う
    track[idx].track_no = track[idx].num; // tagにtrack noがなければファイル名順の番号を使う
    track[idx].getProperty = true;

    music_count++;
    printMusicList();
}

function findNotGetPropertyTrack() {
    for (var i=0; i<track.length; i++) {
        if (track[i].getProperty === false) {
            return i;
        }
    }

    return NaN;
}

function getMusicProperties() {
    const ajax = jsUtils.ajax;

    const idx = findNotGetPropertyTrack();
    if (isNaN(idx) === true) {
        return;
    }

    ajax.init();
    ajax.setOnSuccess(function(httpRequest) {
        addTagInfoToTrack(httpRequest.responseXML, idx);
        getMusicProperties();
    });
    ajax.setOnError(function(httpRequest) {
        console.log("failed to get property: " + track[idx].name + ' (' + httpRequest.status + ' ' + httpRequest.statusText + ')');
        addEmptyInfoToTrack(idx);
        getMusicProperties();
    });
    ajax.post(TAGINFO_CGI, "dir=" + track[idx].base_name + "&file=" + track[idx].path + "&mode=tag");
}

function getMusicFiles(data) {
    const directory = jsUtils.xml.getFirstFoundChildNode(data, 'directory');
    const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['name'])[0];
    document.title = properties.name;
    document.getElementById('directory_name_area').innerHTML = properties.name;

    const contents = jsUtils.xml.getFirstFoundChildNode(directory, 'contents');
    const elements = jsUtils.xml.getDataInElements(contents, 'element', ["name", "path", "num"]);
    if (elements === null) {
        alert("ERROR: music list has no elements");
        return;
    }

    for (var i=0; i<elements.length; i++) {
        const e = elements[i];
        if (stocker.supportTypes.pattern.audio.test(e.name)) {
            track.push({
                "name": e.name,
                "getProperty": false,
                "num": !isNaN(e.num) ? e.num : 0,
                "base_name": params.dir,
                "path": e.path
            });
        }
    }
    getMusicProperties();
}

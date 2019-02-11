var track = new Array();
var music_count = 0;  // ajaxを読んだ数とcallbackが実行された数が一致した時にリスト内の情報を全て読み込んだと判断する

function getXMLfirstChildData(node) {
    if (node) {
        if (node.firstChild) {
            return node.firstChild.data;
        }
    }

    return "";
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
    track[idx].title    = getXMLfirstChildData(data.getElementsByTagName('title').item(0));
    track[idx].artist   = getXMLfirstChildData(data.getElementsByTagName('artist').item(0));
    track[idx].album    = getXMLfirstChildData(data.getElementsByTagName('album').item(0));
    track[idx].year     = getXMLfirstChildData(data.getElementsByTagName('year').item(0));
    track[idx].comment  = getXMLfirstChildData(data.getElementsByTagName('comment').item(0));
    track[idx].track_no = getXMLfirstChildData(data.getElementsByTagName('track').item(0));
    track[idx].genre    = getXMLfirstChildData(data.getElementsByTagName('genre').item(0));
    track[idx].bitrate  = getXMLfirstChildData(data.getElementsByTagName('bitrate').item(0));
    track[idx].sample_rate = getXMLfirstChildData(data.getElementsByTagName('sample_rate').item(0));
    track[idx].channels = getXMLfirstChildData(data.getElementsByTagName('channels').item(0));
    track[idx].duration = getXMLfirstChildData(data.getElementsByTagName('duration').item(0));
    track[idx].time     = getXMLfirstChildData(data.getElementsByTagName('time').item(0));
    track[idx].getProperty = true;

    track[idx].track_no ?= track[idx].num;  // tagにtrack noがなければファイル名順の番号を使う
    track[idx].title ?= track[idx].name;  // tagにtitleがなければファイル名を使う

    music_count++;
    printMusicList();
}

function musicList(data) {
    try {
        const properties = data.getElementsByTagName('properties').item(0);
        const up_path    = getXMLfirstChildData(properties.getElementsByTagName('up_path').item(0));

        getDirectoryList(base_name, up_path, 0, 0, getMusicFiles);
    } catch(e) {
        alert("ERROR: " + e.description);
    }
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
        alert("Error: " + httpRequest.status);
    });
    ajax.post(TAGINFO_CGI, "dir=" + track[idx].base_name + "&file=" + track[idx].path + "&mode=tag");
}

function getMusicFiles(data) {
    const properties = data.getElementsByTagName('properties');
    if (properties != null) {
        const name_elem = properties.item(0).getElementsByTagName('name');
        var name_string = "";
        if (name_elem != null && name_elem.item(0).firstChild != null) {
            name_string = name_elem.item(0).firstChild.data;
        }
        document.title = name_string;
        document.getElementById('directory_name_area').innerHTML = name_string;
    }

    const contents = data.getElementsByTagName('contents').item(0);
    if (contents == null) {
        alert("ERROR: music files list is NULL");
        return;
    }

    const elements = contents.getElementsByTagName('element');
    if (elements == null) {
        alert("ERROR: music list has no elements");
        return;
    }

    for (var i=0; i<elements.length; i++) {
        var name_elem = elements.item(i).getElementsByTagName('name');
        var path_elem = elements.item(i).getElementsByTagName('path');
        var num_elem = elements.item(i).getElementsByTagName('num');  // tagが無い場合のソート用
        if (name_elem != null && path_elem != null) {
            var name = name_elem.item(0).firstChild.data;
            var path = path_elem.item(0).firstChild.data;
            var num  = num_elem != null ? num_elem.item(0).firstChild.data : 0;

            if (music_pattern.test(name.toLowerCase())) {
                track.push({
                    "name": name,
                    "getProperty": false,
                    "num": num,
                    "base_name": base_name,
                    "path": path
                });
            }
        }
    }
    getMusicProperties();
}

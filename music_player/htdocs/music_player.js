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
            if(parseInt(track[j][0]) > parseInt(track[j+1][0])) {
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
            content += "<td><a href=\"javascript:playit('"+ i +"')\">"+ track[i][2] +"</a></td>";
            content += "<td>"+ track[i][3] +"</td>";
            content += "<td>"+ track[i][4] +"</td>";
            content += "<td>"+ track[i][5] +"</td>";
            content += "<td>"+ track[i][6] +"</td>";
            content += "</tr>";
        }
        content += "</table>";
    } else {
        content = "タグを読み込み中 " + track.length + "/" + music_count;
    }

    document.getElementById('music_list').innerHTML = content;
}

function addToMusicList(data, base_name, name, num, url_path) {
    const title    = getXMLfirstChildData(data.getElementsByTagName('title').item(0));
    const artist   = getXMLfirstChildData(data.getElementsByTagName('artist').item(0));
    const album    = getXMLfirstChildData(data.getElementsByTagName('album').item(0));
    const year     = getXMLfirstChildData(data.getElementsByTagName('year').item(0));
    const comment  = getXMLfirstChildData(data.getElementsByTagName('comment').item(0));
    const track_no = getXMLfirstChildData(data.getElementsByTagName('track').item(0));
    const genre    = getXMLfirstChildData(data.getElementsByTagName('genre').item(0));
    const bitrate  = getXMLfirstChildData(data.getElementsByTagName('bitrate').item(0));
    const sample_rate = getXMLfirstChildData(data.getElementsByTagName('sample_rate').item(0));
    const channels = getXMLfirstChildData(data.getElementsByTagName('channels').item(0));
    const duration = getXMLfirstChildData(data.getElementsByTagName('duration').item(0));
    const time     = getXMLfirstChildData(data.getElementsByTagName('time').item(0));

/**
    console.log(title ? title : "");
    console.log(artist ? artist : "");
    console.log(album ? album : "");
    console.log(year ? year : "");
    console.log(comment ? comment : "");
    console.log(track_no ? track_no : "");
    console.log(genre ? genre : "");
    console.log(bitrate ? bitrate : "");
    console.log(sample_rate ? sample_rate : "");
    console.log(channels ? channels : "");
    console.log(duration ? duration : "");
    console.log(time ? time : "");
**/

    var tag = new Array(track_no != 0 ? track_no : num, url_path, title ? title : name, time, artist, album, year, base_name);
    track.push(tag);

    printMusicList();
}

function getMusicProperties(get_media_cgi, base_name, name, num, url_path, receive_func) {
    var httpRequest = ajax_init();
    if (!httpRequest) {
        alert('情報取得プロセスの起動に失敗しました');
        return false;
    }
    ajax_set_instance(httpRequest, function() { getMusicPropertiesResult(httpRequest, base_name, name, num, url_path, receive_func); });
    ajax_post(httpRequest, get_media_cgi, "dir=" + base_name + "&file=" + url_path + "&mode=tag");

    music_count++;  // ajaxを呼んだ数
}

function getMusicPropertiesResult(httpRequest, base_name, name, num, url_path, receive_func) {
    try {
        if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
            //document.getElementById('sStatus').innerHTML = "読み込み中...";
        } else if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
                var data = httpRequest.responseXML;
                receive_func(data, base_name, name, num, url_path);
            } else {
                alert("ERROR: " + httpRequest.status);
            }
        }
    } catch(e) {
        alert("ERROR: " + e.description);
    }
}


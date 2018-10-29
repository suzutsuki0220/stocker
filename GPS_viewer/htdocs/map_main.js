var map;
var geocoder;
var playback;
var maptrack;
var maptrack_pos = 0;
var eventMarker = null;
var tracks;
var map_info_field;
var map_operation;
var map_range_slider;
var map_googlemaps;

var pre_lat;
var pre_lng;
var lat_min, lng_min, lat_max, lng_max;
var lastDelayReloadTimerID = NaN;

const datetime_pattern = /(\d{4})[-\/](\d\d)[-\/](\d\d) (\d\d):(\d\d):([\d\.]+)/;

function getDateFromDatetimeString(datetime) {
    var d;

    if (!datetime) {
        return NaN;
    }

    var dt_match = datetime.match(datetime_pattern);
    if (dt_match === null) {
        return NaN;
    }

    const sec = Math.floor(dt_match[6]);
    const milisec = Math.floor((dt_match[6] * 1000) - (sec * 1000));

    d = new Date(dt_match[1], dt_match[2] - 1, dt_match[3], dt_match[4], dt_match[5], sec, milisec);

    return d.getTime();  // ミリ秒
}

function drawMap(get_file_cgi, base_name, url_path, name) {
    map_init();
    getPositionData(get_file_cgi, base_name, url_path, name);
}

function map_init() {
  var central = new google.maps.LatLng(35.6580939,139.7413553);  // 日本緯度経度原点
  var mapOptions = {
    zoom: 10,
    center: central,
    scaleControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  geocoder = new google.maps.Geocoder;

  playback = new mapPlaybackRoute(map);
  maptrack = new mapTrack();
  map_info_field = new mapInfoField();
  map_operation = new mapOperation();
  map_range_slider = new mapRangeSlider();
  eventMarker = new mapEventMarker({map: map});
  map_googlemaps = new mapGoogleMaps(map);

  map_googlemaps.initPanorama(document.getElementById('panorama_canvas'));
  map_operation.resetLatLngMinMax();
}

function map_clear() {
  map_googlemaps.clearPolyLine();
  map_googlemaps.clearStartEndMarker();

  map_range_slider.setStrokeData([], 0, 120); // clear stroke
  map_info_field.clear();
}

// 経路描画
function map_route() {
  map_operation.resetLatLngMinMax();
  maptrack.clearIndex();
  maptrack.searchTrackIndex(tracks);
  if (reloadMap(0, tracks.length) === true) {
    map_googlemaps.centeringMap(map_operation.getCenterLatlng(), map_operation.getCentralScale());
  }
}

function reloadMap(start_range, end_range) {
  var start_route = null;
  var end_route = null;
  var plot_count = 0;
  var invalid_count = 0;
  var line_color = "";
  var last_line_color = "";
  var beforeMarkerDatetime = 0;

  var count = {
      total: (end_range - start_range),
      plot: 0,
      invalid:  0,
      skip: Math.floor((end_range - start_range)/10000)
  };

  var distance = 0;
  pre_lat = 0;
  pre_lng = 0;
  eventMarker.clear();
  playback.stop();
  for (var i=start_range; i<end_range; i+=(count.skip + 1)) {
    const p = tracks[i];
    const latlng = map_googlemaps.getLatLng(p.coordinate);
    if (latlng === null) {
      count.invalid++;
      continue;
    }

    if (start_route === null) {
      map_clear();
      start_route = latlng;
      last_line_color = judgePolyLineColor(p);
    }
    end_route = latlng;
    count.plot++;

    //distance += getDistance(p.coordinate, {latitude: pre_lat, longitude: pre_lng}, "K");
    distance += getDistHubeny(p.coordinate, {latitude: pre_lat, longitude: pre_lng}, WGS84) / 1000;

    if (p.behavior && p.behavior !== 0) {
      const dt = getDateFromDatetimeString(p.datetime);
      if (dt && dt - beforeMarkerDatetime > 3000) {
        eventMarker.create(tracks, i);
        beforeMarkerDatetime = dt;
      }
    }

    map_googlemaps.pushPolyLinePath(latlng);
    line_color = judgePolyLineColor(p);
    if (last_line_color !== line_color) {
      map_googlemaps.plotPolyLine(last_line_color);
      map_googlemaps.pushPolyLinePath(latlng);
    }
    last_line_color = line_color;

    pre_lat = p.coordinate.latitude;
    pre_lng = p.coordinate.longitude;
    map_operation.setLatLngMinMax(p.coordinate);
  }

  if (count.plot === 0) {
    showMapWarning('選択された範囲に有効な位置情報がありません');
    map_clear();
    return false;
  }

  map_googlemaps.plotPolyLine(line_color);
  hideMapWarning();
  plotRangeStroke();

  map_info_field.setCounter(count);
  map_info_field.setDistance(distance); 
  map_info_field.setDuration(tracks[start_range].datetime, tracks[end_range - 1].datetime);
  map_info_field.setDatetime(tracks[start_range].datetime, tracks[end_range - 1].datetime);

  reloadAfterDelayWork(start_range, start_route, end_route);
  map_googlemaps.setStartEndMarker(start_route, end_route);

  return true;
}

function reloadAfterDelayWork(start_range, start_route, end_route) {
  var delayReloadFunc = function() {
    geocoder.geocode({'location': start_route}, putStartGeoCode);
    geocoder.geocode({'location': end_route}, putEndGeoCode);

    const p_diff = getPositionDifference(tracks, start_range + 12, 12);  // streetviewの向き決定用
    map_googlemaps.setPanoramaPosition(start_route, p_diff.azimuth);  // street viewは開始位置にする

    lastDelayReloadTimerID = NaN;
  };

  if (isNaN(lastDelayReloadTimerID) === false) {
    clearTimeout(lastDelayReloadTimerID);
    lastDelayReloadTimerID = NaN;
  }

  lastDelayReloadTimerID = setTimeout(delayReloadFunc, 3000);
  map_info_field.setStartAddress("取得中");
  map_info_field.setEndAddress("取得中");
}

function setStartEndRangeByPolylineClicked(name, lat, lng) {
    const index = searchTracksIndexByLatLng({latitude: lat, longitude: lng});
    if (isNaN(index) === false) {
        var value = Math.floor(index / tracks.length * 1000);
        var sr = map_range_slider.getStartEndValue();
        if (name === "range_start_pos") {
            map_range_slider.setRangePosition(value, sr.end);
        } else if (name === "range_end_pos") {
            map_range_slider.setRangePosition(sr.start, value);
        }
        rangeChanged();
    } else {
        alert("経路内で近似のサンプルが見つかりませんでした。別の場所を選択してください");
    }
    map_googlemaps.closePolyLineInfo();
}

function putStartGeoCode(results, status) {
  map_info_field.setStartAddress(getGeoCode(results, status));
}

function putEndGeoCode(results, status) {
  map_info_field.setEndAddress(getGeoCode(results, status));
}

function getGeoCode(results, status) {
  var ret = '取得失敗: ' + status;

  if (status === 'OK') {
    // debug
//    var i=0;
//    while (results[i]) {
//      console.log(results[i]);
//      i++;
//    }

    if (results[0]) {
      ret = results[0].formatted_address;
    } else {
      ret = '住所不明';
    }
  }

  return ret;
}

function getPositionData(get_file_cgi, base_name, url_path, name) {
    var getPositionDataResult = function(httpRequest, name) {
        try {
            if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
                //document.getElementById('sStatus').innerHTML = "読み込み中...";
            } else if (httpRequest.readyState == 4) {
                if (httpRequest.status == 200) {
                    tracks = gpsCommon.getPosition(httpRequest.responseText, name);
                    map_route();
                } else {
                    alert("ERROR: " + httpRequest.status);
                }
            }
        } catch(e) {
            const description = e.description ? e.description : "";
            alert("get position ERROR: " + description);
        }
    };

    var httpRequest = ajax_init();
    if (httpRequest) {
        ajax_set_instance(httpRequest, function() { getPositionDataResult(httpRequest, name); });
        ajax_post(httpRequest, get_file_cgi, "dir=" + base_name + "&file=" + url_path + "&mime=application/xml");
    } else {
        alert('情報取得プロセスの起動に失敗しました');
    }
}

function getPositionStartEndFromRangeController(p) {
    var ret = new Object();

    var startEnd = map_range_slider.getStartEndValue();

    if (p && p.length) {
        ret.start = Math.floor(p.length * startEnd.start / 1000);
        ret.end   = Math.floor(p.length * startEnd.end / 1000);
        ret.length = ret.end - ret.start;
    } else {
        ret.start = 0;
        ret.end   = 0;
        ret.length = 0;
    }

    return ret;
}

function rangeChanged() {
    if (tracks) {
        const range = getPositionStartEndFromRangeController(tracks);
        reloadMap(range.start, range.end);
    }
}

function plotRangeStroke() {
    var data = new Array();
    const skip_idx = Math.floor(tracks.length / 1000) + 1;

    for (var i=0; i<tracks.length; i+=skip_idx) {
        data.push(tracks[i].speed);
    }

    map_range_slider.setStrokeData(data, 0, 120);
}

function paintTimeRangeBgSpeed(canvas) {
    const ctx = canvas.getContext("2d");
    const step = 3;
    const graphY_offset = 20;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<canvas.width; i+=step) {
        const get_pos = Math.floor(tracks.length * ((i + step / 2) / canvas.width));
        const p = tracks[get_pos];
        var graphY = (canvas.height - graphY_offset) - (p.speed / 100 * canvas.height);
        var color = "#0000b1";
        if (p.speed > 100) {
            color = "#cf0000";
            graphY = 0;
        } else if (p.speed > 60) {
            color = "#cfcf00";
        } else if (p.speed > 10) {
            color = "#00cf00";
        }
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(i, graphY, step, canvas.height - graphY);
        ctx.stroke();
    }

    ctx.closePath();
}

function showMapWarning(message) {
    if (playback.isPlaying() === true) {
        return;
    }

    document.getElementById('map_warningText').innerHTML = "<i class=\"fas fa-exclamation-triangle\"></i> " + message;
    document.getElementById('map_warningText').style.display = "inline";
}

function hideMapWarning() {
    document.getElementById('map_warningText').style.display = "none";
};

function showMapError(message) {
    if (playback.isPlaying() === false) {
        return;
    }

    alert(message);
}

function playbackRoute() {
    var range = getPositionStartEndFromRangeController(tracks);
    if (range.length >= 100) {
        playback.start(tracks, range.start, range.end);
    } else {
        alert("開始位置と終了位置の間隔が狭すぎるため処理できません");
    }
}

function makeEventTitle(behavior) {
    var title = "";

    for (var i=0; i<4; i++) {
        const case_bit = 1 << i;
        if ((behavior & case_bit) === case_bit) {
            title += title ? " / " + config.title.event[i] : config.title.event[i];
        }
    }

    return title ? title : "--";
}

function getPositionDifference(tracks, index, back_count) {
    var position_diff = new Object();

    const current_index = getFirstValidPositionIndex(normalize(index, 0, tracks.length - 1));
    const back_index    = getLastValidPositionIndex(normalize(current_index - back_count, 0, tracks.length - 1));

    const p_curr = tracks[current_index];
    const p_back = tracks[back_index];

    const azimuth = getAzimuth(p_back.coordinate, p_curr.coordinate);
    position_diff.azimuth   = azimuth;
    position_diff.direction = getDirectionString(azimuth);
    position_diff.altitude  = replaceNanToZero(p_curr.coordinate.altitude - p_back.coordinate.altitude);
    position_diff.speed     = replaceNanToZero(p_curr.speed - p_back.speed);

    return position_diff;
}

function getFirstValidPositionIndex(start_index) {
    var index = start_index;
    while(index < tracks.length && isValidLatLng(tracks[index].coordinate) === false) {
        index++;
    }

    return index;
};

function getLastValidPositionIndex(start_index) {
    var index = start_index;
    while(index > 0 && isValidLatLng(tracks[index].coordinate) === false) {
        index--;
    }

    return index;
}

function searchTracksIndexByLatLng(latlng) {
    var scanTracks = function(prec) {
        for (var i=0; i<tracks.length; i++) {
            if (isNearLatLng(tracks[i].coordinate, latlng, prec) === true) {
                return i;
            }
        }
        return NaN;
    };

    // 数メートル単位から1桁ずつ精度を下げて最も近いtracksを探す
    return scanTracks(0.000001) || scanTracks(0.00001) || scanTracks(0.0001);
}

function setTimeRangeByTrack(num) {
    const last_pos = maptrack_pos;

    maptrack_pos += num;
    if (maptrack_pos < 0) {
        maptrack_pos = 0;
    } else if (maptrack_pos >= maptrack.getTrackCount()) {
        maptrack_pos = maptrack.getTrackCount();
    }

    if (last_pos !== maptrack_pos) {
        var range = maptrack.getTrackRange(tracks, maptrack_pos);
        // シーンの切替えより少し手前の範囲を出す
        range.start = range.start > 30 ? range.start - 30 : 0;

        const start_pos = Math.floor(range.start / tracks.length * 1000);
        const end_pos   = Math.floor(range.end / tracks.length * 1000);
        map_range_slider.setRangePosition(start_pos, end_pos);

        reloadMap(range.start, range.end);
    }
}

function uuid() {
    var uuid = "";
    for (var i=0; i<32; i++) {
        const random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += "-"
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}

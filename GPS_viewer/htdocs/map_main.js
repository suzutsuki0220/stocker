var map;
var geocoder;
var playback;
var maptrack;
var maptrack_pos = 0;
var eventMarker = null;
var poly = new Array();
var tracks;
var polyline_clicked_info = null;
var map_info_field;
var map_operation;
var map_range_slider;
var map_googlemaps;

var pre_lat;
var pre_lng;
var distance;
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

function makeStreetviewImgUrl(coordinate, heading) {
    const url_base = "https://maps.googleapis.com/maps/api/streetview";
    var parameters = "size=96x96&fov=90&heading=" + heading + "&pitch=10&location=" + coordinate.latitude + "," + coordinate.longitude;
    if (config.apiKey.googlemap) {
        parameters += "&key=" + config.apiKey.googlemap;
    }

    return url_base + "?" + parameters;
}

function getDuration(start, end) {
    var s = getDateFromDatetimeString(start);
    var e = getDateFromDatetimeString(end);

    if (isNaN(s) || isNaN(e)) {
        return NaN;
    }

    return (e - s) / 1000;
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
  map_googlemaps = new mapGoogleMaps();

  map_googlemaps.initPanorama(document.getElementById('panorama_canvas'));
  map_operation.resetLatLngMinMax();
}

function map_clear() {
  while ((polyline = poly.pop()) !== undefined) {
    google.maps.event.clearListeners(polyline, "click");
    polyline.setMap(null);
  }
  map_googlemaps.clearStartEndMarker();

  map_range_slider.setStrokeData([], 0, 120); // clear stroke
  map_info_field.clear();
}

function get_latlng(coordinate) {
  if (isValidLatLng(coordinate) === false) {
    return null;
  }

  if (pre_lat !== 0 && pre_lng !== 0) {
    //var d = getDistance(coordinate, {latitude: pre_lat, longitude: pre_lng}, "K");
    var d = getDistHubeny(coordinate, {latitude: pre_lat, longitude: pre_lng}, WGS84) / 1000;
    if (d === d) {  // is not NaN
      distance += d;
    }
  }
  pre_lat = coordinate.latitude;
  pre_lng = coordinate.longitude;

  map_operation.setLatLngMinMax(coordinate);

  return new google.maps.LatLng(coordinate.latitude, coordinate.longitude);
}

// 経路描画
function map_route() {
  map_operation.resetLatLngMinMax();
  maptrack.clearIndex();
  maptrack.searchTrackIndex(tracks);
  if (reloadMap(0, tracks.length) === true) {
    centeringMap();
  }
}

function reloadMap(start_range, end_range) {
  var route = [];
  var start_route = null;
  var end_route = null;
  var duration = 0;
  var route_length = 0;
  var invalid_count = 0;
  var skip_idx = Math.floor((end_range - start_range)/10000) + 1;
  var line_color = "";
  var last_line_color = "";
  var beforeMarkerDatetime = 0;

  distance = 0;
  pre_lat = 0;
  pre_lng = 0;
  eventMarker.clear();
  playback.stop();
  for (var i=start_range; i<end_range; i+=skip_idx) {
    const p = tracks[i];
    const latlng = get_latlng(p.coordinate);
    if (latlng != null) {
      if (start_route === null) {
        map_clear();  // ここに来れば有効なサンプルは存在してるはず
        start_route = latlng;
        last_line_color = judgePolyLineColor(p);
      }
      end_route = latlng;
      route_length++;
      if (p.behavior && p.behavior !== 0) {
        var dt = getDateFromDatetimeString(p.datetime);
        if (dt && dt - beforeMarkerDatetime > 3000) {
          eventMarker.create(tracks, i);
          beforeMarkerDatetime = dt;
        }
      }

      line_color = judgePolyLineColor(p);
      if (last_line_color !== line_color) {
        route.push(latlng);
        plotMapPolyLine(route, last_line_color);
        route = [];
      }
      route.push(latlng);
      last_line_color = line_color;
    } else {
      invalid_count++;
    }
  }
  if (start_route !== null && end_route !== null) {
    plotMapPolyLine(route, line_color);
  }

  if (route_length === 0) {
    if (start_range !== end_range) {
      showMapWarning('有効な位置情報がありません');
      map_clear();
    } else {
      showMapWarning('開始位置-終了位置の指定が不適切なため、走行データを表示できません');
    }
    return false;
  }
  document.getElementById('map_warningText').style.display = "none";

  plotRangeStroke();

  document.getElementById("distance_text").innerHTML = distance.toFixed(3) + " km"; 
  document.getElementById("sample_count").innerHTML  = String(end_range - start_range);
  document.getElementById("point_count").innerHTML  = String(route_length);
  document.getElementById("skip_sample").innerHTML  = String(skip_idx - 1);
  document.getElementById("invalid_sample_count").innerHTML  = String(invalid_count);

  duration = getDuration(tracks[start_range].datetime, tracks[end_range - 1].datetime);
  if (!isNaN(duration)) {
      document.getElementById("duration_text").innerHTML = duration.toFixed() + " 秒"; 
  }
  document.getElementById('start_datetime').innerHTML = tracks[start_range].datetime ? tracks[start_range].datetime : "不明";
  document.getElementById('end_datetime').innerHTML = tracks[end_range - 1].datetime ? tracks[end_range - 1].datetime : "不明";

  var delayReloadFunc = function() {
    const p_diff = getPositionDifference(tracks, start_range + 12, 12);  // streetviewの向き決定用
    geocoder.geocode({'location': start_route}, putStartGeoCode);
    geocoder.geocode({'location': end_route}, putEndGeoCode);
    map_googlemaps.setPanoramaPosition(start_route, p_diff.azimuth);  // street viewは開始位置にする
    lastDelayReloadTimerID = NaN;
  }
  if (isNaN(lastDelayReloadTimerID) === false) {
    clearTimeout(lastDelayReloadTimerID);
    lastDelayReloadTimerID = NaN;
  }
  lastDelayReloadTimerID = setTimeout(delayReloadFunc, 3000);
  document.getElementById("start_address").innerHTML = "取得中";
  document.getElementById("end_address").innerHTML = "取得中";

  map_googlemaps.setStartEndMarker(map, start_route, end_route);

  return true;
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
    if (polyline_clicked_info !== null) {
        polyline_clicked_info.close();
        polyline_clicked_info = null;
    }
}

function polyLineClickEvent(e) {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // 航空写真表示では位置がずれてしまうことがあったので、地図表示で選択させたい
    if (map.getMapTypeId() !== google.maps.MapTypeId.ROADMAP) {
        if (window.confirm("範囲選択のために地図表示に切り替えます")) {
            map.setMapTypeId(google.maps.MapTypeId.ROADMAP)
        }
        return;
    }

    const info_content = "<div style=\"color: #202020\">経路の範囲</div><br><a href=\"javascript:setStartEndRangeByPolylineClicked('range_start_pos', " + lat + ", " + lng + ")\" class=\"button\">開始位置に指定</a>&nbsp;<a href=\"javascript:setStartEndRangeByPolylineClicked('range_end_pos', " + lat + ", " + lng + ")\" class=\"button\">終了位置に指定</a>";

    if (polyline_clicked_info === null) {
        polyline_clicked_info = new google.maps.InfoWindow();
    } else {
        polyline_clicked_info.close();
    }
    polyline_clicked_info.setPosition(e.latLng);
    polyline_clicked_info.setContent(info_content);
    polyline_clicked_info.open(map);
}

function plotMapPolyLine(route, color) {
  var polyOptions = {
    path: route,
    strokeColor: color,
    strokeOpacity: 0.75,
    strokeWeight: 5
  }
  var polyline = new google.maps.Polyline(polyOptions);
  polyline.setMap(map);
  polyline.addListener("click", polyLineClickEvent);
  poly.push(polyline);
}

// マップの中央を奇跡が全て見える位置に合わせる
function centeringMap() {
  const center = map_operation.getCenterLatlng();
  const latlng = new google.maps.LatLng(center.latitude, center.longitude);

  map.panTo(latlng);
  map.setZoom(map_operation.getCentralScale());
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
    if (!httpRequest) {
        alert('情報取得プロセスの起動に失敗しました');
        return false;
    }
    ajax_set_instance(httpRequest, function() { getPositionDataResult(httpRequest, name); });
    ajax_post(httpRequest, get_file_cgi, "dir=" + base_name + "&file=" + url_path + "&mime=application/xml");
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

    var current_index = !isNaN(index) ? index : 0;
    if (current_index >= tracks.length) {
        current_index = tracks.length - 1;
    }
    while(!tracks[current_index] && current_index < tracks.length) {
        current_index++;
    }

    var back_index = current_index - back_count;
    if (back_index >= 0) {
        while(!tracks[back_index] && back_index > 0) {
            back_index--;
        }
    } else {
        back_index = 0;
    }
    while(!tracks[back_index] && current_index > back_index) {
        back_index++;
    }

    const p_curr = tracks[current_index];
    const p_back = tracks[back_index];

    if (p_curr && p_back) {
        const azimuth = getAzimuth(p_back.coordinate, p_curr.coordinate);
        position_diff.azimuth   = azimuth;
        position_diff.direction = getDirectionString(azimuth);
        position_diff.altitude  = p_curr.coordinate.altitude ? p_curr.coordinate.altitude - p_back.coordinate.altitude : 0;
        position_diff.speed     = p_curr.speed ? p_curr.speed - p_back.speed : 0;
    }

    return position_diff;
}

function searchTracksIndexByLatLng(latlng) {
    // 数メートル単位で近いtracksを探す
    for (var i=0; i<tracks.length; i++) {
        if (isNearLatLng(tracks[i].coordinate, latlng)) {
            return i;
        }
    }

    // 1桁上げて比較
    for (var i=0; i<tracks.length; i++) {
        if (isNearLatLng(tracks[i].coordinate, latlng, 0.00001)) {
            return i;
        }
    }

    // 更に1桁
    for (var i=0; i<tracks.length; i+=5) {
        if (isNearLatLng(tracks[i].coordinate, latlng, 0.0001)) {
            return i;
        }
    }

    return NaN;
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

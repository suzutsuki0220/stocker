var map;
var geocoder;
var panorama;
var startMarker = null;
var endMarker = null;
var eventMarkers = new Array();
var poly = new Array();
var positions;

var pre_lat;
var pre_lng;
var distance;
var lat_min, lng_min, lat_max, lng_max;
var lastDelayReloadTimerID = NaN;

const nmea_pattern = /\.(nmea)$/;
const accel_csv_pattern = /\.(accel.csv)$/;
const datetime_pattern = /(\d{4})[-\/](\d\d)[-\/](\d\d) (\d\d):(\d\d):([\d\.]+)/;

function getDateFromDatetimeString(datetime) {
    var d;
    var dt_match = datetime.match(datetime_pattern);

    if (dt_match === null) {
        return NaN;
    }

    d = new Date(dt_match[1], dt_match[2], dt_match[3], dt_match[4], dt_match[5], dt_match[6]);

    return d.getTime();
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

  var panoramaOptions = {
    position: central,
    pov: {
      heading: 34,
      pitch: 10
    },
    motionTracking: false
  };
  panorama = new google.maps.StreetViewPanorama(document.getElementById('panorama_canvas'), panoramaOptions);
  map.setStreetView(panorama);
  resetLatLngMinMax();
}

function resetLatLngMinMax() {
  lat_min = 0;
  lng_min = 0;
  lat_max = 0;
  lng_max = 0;
}

function setLatLngMinMax(lat, lng) {
  if (lat_min === 0 || lat_min > lat) {
    lat_min = lat;
  }
  if (lat_max === 0 || lat_max < lat) {
    lat_max = lat;
  }
  if (lng_min === 0 || lng_min > lng) {
    lng_min = lng;
  }
  if (lng_max === 0 || lng_max < lng) {
    lng_max = lng;
  }
}

function getCenterLocation(lat_min, lng_min, lat_max, lng_max) {
  var lat_ave = (lat_min + lat_max) / 2;
  var lng_ave = (lng_min + lng_max) / 2;

  return new google.maps.LatLng(lat_ave, lng_ave);
}

function getMapScale() {
  var distance = Math.sqrt(Math.pow(lat_max - lat_min, 2) + Math.pow(lng_max - lng_min, 2));

  if (distance < 0.0001) {
    return 19;
  } else if (distance < 0.001) {
    return 18;
  } else if (distance < 0.002) {
    return 17;
  } else if (distance < 0.01) {
    return 15;
  } else if (distance < 0.1) {
    return 12;
  } else if (distance < 0.2) {
    return 11;
  } else if (distance < 0.7) {
    return 10;
  } else if (distance < 1.2) {
    return 8;
  } else if (distance < 5.0) {
    return 7;
  } else if (distance < 15) {
    return 4;
  } else {
    return 3;
  }
}

function map_clear() {
  while ((polyline = poly.pop()) !== undefined) {
    polyline.setMap(null);
  }
  if (startMarker != null) {
    startMarker.setMap(null);
    startMarker = null;
  }
  if (endMarker != null) {
    endMarker.setMap(null);
    endMarker = null;
  }

  clearTimeRangeBgSpeed(document.getElementById('range_start_background'));
  clearTimeRangeBgSpeed(document.getElementById('range_end_background'));

  document.getElementById("distance_text").innerHTML = "--  km"; 
  document.getElementById("duration_text").innerHTML = "---- 秒"; 
  document.getElementById("sample_count").innerHTML = "0";
  document.getElementById("invalid_sample_count").innerHTML = "0";
  document.getElementById("start_address").innerHTML = "";
  document.getElementById("end_address").innerHTML = "";
}

function get_latlng(lat, lng) {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  if (pre_lat !== 0 && pre_lng !== 0) {
    //var d = getDistance(lat, lng, pre_lat, pre_lng, "K");
    var d = getDistHubeny(lat, lng, pre_lat, pre_lng, WGS84) / 1000;
    if (d === d) {  // is not NaN
      distance += d;
    }
  }
  pre_lat = lat;
  pre_lng = lng;

  setLatLngMinMax(lat, lng);

  return new google.maps.LatLng(lat, lng);
}

function map_route(data, name) {
  resetLatLngMinMax();
  try {
    if (nmea_pattern.test(name.toLowerCase())) {
      // nmeaデータ
      positions = getPositionEmea(data);
    } else if (accel_csv_pattern.test(name.toLowerCase())) {
      positions = getPositionAccelCsv(data);
    } else {
      // KML and GPX
      positions = getPositionXml(data);
    }
  } catch(e) {
    alert("map_route error: " + e.message);
    return;
  }

  // 経路描画
  reloadMap(0, positions.length);
  centeringMap();
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

  distance = 0;
  pre_lat = 0;
  pre_lng = 0;
  clearEventMarker();
  for (var i=start_range; i<end_range; i+=skip_idx) {
    var p = positions[i];
    var latlng = get_latlng(p.latitude, p.longitude);
    if (latlng != null) {
      if (start_route === null) {
        map_clear();  // ここに来れば有効なサンプルは存在してるはず
        start_route = latlng;
        last_line_color = judgePolyLineColor(p);
      }
      end_route = latlng;
      route_length++;
      if (p.behavior && p.behavior !== 0) {
        createEventMarker(p);
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
    alert('有効な位置を示すサンプルがありません');
    return;
  }

  paintTimeRangeBgSpeed(document.getElementById('range_start_background'));
  paintTimeRangeBgSpeed(document.getElementById('range_end_background'));

  document.getElementById("distance_text").innerHTML = distance.toFixed(3) + " km"; 
  document.getElementById("sample_count").innerHTML  = String(end_range - start_range);
  document.getElementById("point_count").innerHTML  = String(route_length);
  document.getElementById("skip_sample").innerHTML  = String(skip_idx - 1);
  document.getElementById("invalid_sample_count").innerHTML  = String(invalid_count);

  duration = getDuration(positions[start_range].datetime, positions[end_range - 1].datetime);
  if (!isNaN(duration)) {
      document.getElementById("duration_text").innerHTML = duration.toFixed() + " 秒"; 
  }
  document.getElementById('start_datetime').innerHTML = positions[start_range].datetime ? positions[start_range].datetime : "不明";
  document.getElementById('end_datetime').innerHTML = positions[end_range - 1].datetime ? positions[end_range - 1].datetime : "不明";

  var delayReloadFunc = function() {
    geocoder.geocode({'location': start_route}, putStartGeoCode);
    geocoder.geocode({'location': end_route}, putEndGeoCode);
    panorama.setPosition(start_route);  // street viewは開始位置にする
    lastDelayReloadTimerID = NaN;
  }
  if (isNaN(lastDelayReloadTimerID) === false) {
    clearTimeout(lastDelayReloadTimerID);
    lastDelayReloadTimerID = NaN;
  }
  lastDelayReloadTimerID = setTimeout(delayReloadFunc, 2000);
  document.getElementById("start_address").innerHTML = "取得中";
  document.getElementById("end_address").innerHTML = "取得中";

  var StartMarkerOptions = {
    position: start_route,
    icon: START_MARKER_ICON,
    map: map,
    title: "Start Point"
  };
  startMarker = new google.maps.Marker(StartMarkerOptions);

  var EndMarkerOptions = {
    position: end_route,
    icon: END_MARKER_ICON,
    map: map,
    title: "End Point"
  };
  endMarker = new google.maps.Marker(EndMarkerOptions);
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
  poly.push(polyline);
}

// マップの中央を奇跡が全て見える位置に合わせる
function centeringMap() {
  map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));
  map.setZoom(parseInt(getMapScale()));
}

function createEventMarker(p) {
  var title, label;
  switch (p.behavior) {
    case 1:
      title = "Braking";
      label = "B";
      break;
    case 2:
      title = "Throttle";
      label = "T";
      break;
    case 4:
      title = "Cornering(left)";
      label = "L";
      break;
    case 8:
      title = "Cornering(right)";
      label = "R";
      break;
  }

  var markerOptions = {
    position: new google.maps.LatLng(p.latitude, p.longitude),
    map: map,
    title: title,
    label: label,
    animation: google.maps.Animation.DROP,
  };

  var marker = new google.maps.Marker(markerOptions);
  addMarkerInfo(marker, makeEventInfoContents(p));
  eventMarkers.push(marker);
}

function makeEventInfoContents(p) {
  var title = "--";
  switch (p.behavior) {
    case 1:
      title = "Braking";
      break;
    case 2:
      title = "Throttle";
      break;
    case 4:
      title = "Cornering(left)";
      break;
    case 8:
      title = "Cornering(right)";
      break;
  }

  var contents;
  contents  = '<div style="color: #202020">';
  contents += title + "<br>";
  contents += "発生時刻: " + p.datetime + "<br>";
  contents += "速度: " + String(Math.floor(p.speed * 100) / 100) + " km/h";
  contents += '</div>';

  return contents;
}

function addMarkerInfo(marker, contentData) {
  var showInfoWindow = function(event) {
    var windowOptions = {
      content: contentData,
    };
    new google.maps.InfoWindow(windowOptions).open(marker.getMap(), marker);
  };
  google.maps.event.addListener(marker, 'click', showInfoWindow);
}

function clearEventMarker() {
  while(eventMarkers.length !== 0) {
    var poped = eventMarkers.pop();
    if (poped) {
      poped.setMap(null);
      poped = null;
    }
  }
}

function putStartGeoCode(results, status) {
  var elem = document.getElementById("start_address");
  putGeoCode(elem, results, status);
}

function putEndGeoCode(results, status) {
  var elem = document.getElementById("end_address");
  putGeoCode(elem, results, status);
}

function putGeoCode(elem, results, status) {
  if (status === 'OK') {
    // debug
//    var i=0;
//    while (results[i]) {
//      console.log(results[i]);
//      i++;
//    }

    if (results[0]) {
      elem.innerHTML = results[0].formatted_address;
    } else {
      elem.innerHTML = '住所不明';
    }
  } else {
    elem.innerHTML = '取得失敗: ' + status;
  }
}

function getPositionData(get_file_cgi, base_name, url_path, name) {
    var httpRequest = ajax_init();
    if (!httpRequest) {
        alert('情報取得プロセスの起動に失敗しました');
        return false;
    }
    ajax_set_instance(httpRequest, function() { getPositionDataResult(httpRequest, name); });
    ajax_post(httpRequest, get_file_cgi, "dir=" + base_name + "&file=" + url_path + "&mime=application/xml");
}

function getPositionDataResult(httpRequest, name) {
    try {
        if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
            //document.getElementById('sStatus').innerHTML = "読み込み中...";
        } else if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
                if (nmea_pattern.test(name.toLowerCase()) || accel_csv_pattern.test(name.toLowerCase())) {
                    var text = httpRequest.responseText;
                    map_route(text, name);
                } else {
                    var data = httpRequest.responseXML;
                    map_route(data, name);
                }
            } else {
                alert("ERROR: " + httpRequest.status);
            }
        }
    } catch(e) {
        alert("get position ERROR: " + e.description);
    }
}

function rangeChanged(elem) {
    var range_start = parseInt(document.getElementsByName('range_start')[0].value);
    var range_end = parseInt(document.getElementsByName('range_end')[0].value);

    if (range_end < range_start) {
        document.getElementsByName('range_end')[0].value = range_start;
        range_end = range_start;
    }
    if (range_start > range_end) {
        document.getElementsByName('range_start')[0].value = range_end;
        range_start = range_end;
    }

    var start = Math.floor(positions.length * range_start / 1000);
    var end   = Math.floor(positions.length * range_end / 1000);

    reloadMap(start, end);
}

function paintTimeRangeBgSpeed(canvas) {
    const ctx = canvas.getContext("2d");
    const step = 3;
    const graphY_offset = 20;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<canvas.width; i+=step) {
        const get_pos = Math.floor(positions.length * ((i + step / 2) / canvas.width));
        const p = positions[get_pos];
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

function clearTimeRangeBgSpeed(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

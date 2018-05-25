var map;
var geocoder;
var panorama;
var startMarker = null;
var endMarker = null;
var eventMarkers = new Array();
var poly = null;
var positions;

var pre_lat;
var pre_lng;
var distance;
var lat_min, lng_min, lat_max, lng_max;

const stroke_color = "#0000ff";
var nmea_pattern = /\.(nmea)$/;
var accel_csv_pattern = /\.(accel.csv)$/;

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
  if (poly != null) {
    poly.setMap(null);
    poly = null;
  }
  if (startMarker != null) {
    startMarker.setMap(null);
    startMarker = null;
  }
  if (endMarker != null) {
    endMarker.setMap(null);
    endMarker = null;
  }

  document.getElementById("distance_text").innerHTML = "--  km"; 
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
  var invalid_count = 0;
  var skip_idx = Math.floor((end_range - start_range)/10000) + 1;

  distance = 0;
  pre_lat = 0;
  pre_lng = 0;
  clearEventMarker();
  for (var i=start_range; i<end_range; i+=skip_idx) {
      var p = positions[i];
      var latlng = get_latlng(p.latitude, p.longitude);
      if (latlng != null) {
        route.push(latlng);
        if (p.behavior && p.behavior !== 0) {
            createEventMarker(p.latitude, p.longitude, p.behavior);
        }
      } else {
        invalid_count++;
      }
  }

  var start_index = 0;
  var end_index = route.length - 1;

  if (route.length === 0) {
    alert('有効な位置を示すサンプルがありません');
    return;
  }
  map_clear();

  paintTimeRangeBgSpeed(document.getElementById('range_start_background'));
  paintTimeRangeBgSpeed(document.getElementById('range_end_background'));

  document.getElementById("distance_text").innerHTML = distance.toFixed(3) + " km"; 
  document.getElementById("sample_count").innerHTML  = String(end_range - start_range);
  document.getElementById("point_count").innerHTML  = String(route.length);
  document.getElementById("skip_sample").innerHTML  = String(skip_idx - 1);
  document.getElementById("invalid_sample_count").innerHTML  = String(invalid_count);

  geocoder.geocode({'location': route[start_index]}, putStartGeoCode);
  geocoder.geocode({'location': route[end_index]}, putEndGeoCode);
  document.getElementById('start_datetime').innerHTML = positions[start_range].datetime ? positions[start_range].datetime : "不明";
  document.getElementById('end_datetime').innerHTML = positions[end_range - 1].datetime ? positions[end_range - 1].datetime : "不明";

  var StartMarkerOptions = {
    position: route[start_index],
    icon: '%htdocs_root%/car.png',
    map: map,
    title: "Start Point"
  };
  startMarker = new google.maps.Marker(StartMarkerOptions);

  var EndPointOptions = {
    position: route[end_index],
    icon: '%htdocs_root%/goal.png',
    map: map,
    title: "End Point"
  };
  endMarker = new google.maps.Marker(EndPointOptions);


  panorama.setPosition(route[start_index]);  // street viewは開始位置にする

  var polyOptions = {
    path: route,
    strokeColor: stroke_color,
    strokeOpacity: 0.5,
    strokeWeight: 5
  }
  poly = new google.maps.Polyline(polyOptions);
  poly.setMap(map);
}

// マップの中央を奇跡が全て見える位置に合わせる
function centeringMap() {
  map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));
  map.setZoom(parseInt(getMapScale()));
}

function createEventMarker(latitude, longitude, event) {
  var title, label;
  switch (event) {
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
    position: new google.maps.LatLng(latitude, longitude),
    map: map,
    title: title,
    label: label,
    animation: google.maps.Animation.DROP,
  };

  eventMarkers.push(new google.maps.Marker(markerOptions));
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
    const step = 5;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<canvas.width; i+=step) {
        var get_pos = Math.floor(positions.length * ((i + step / 2) / canvas.width));
        var p = positions[get_pos];
        var color = "#0000b1";
        if (p.speed > 80) {
            color = "#cf0000";
        } else if (p.speed > 60) {
            color = "#cfcf00";
        } else if (p.speed > 40) {
            color = "#00cf00";
        }
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(i, 0, step, canvas.height);
        ctx.stroke();
    }

    ctx.closePath();
}

var map;
var geocoder;
var panorama;
var startMarker = null;
var endMarker = null;
var poly = null;

var pre_lat;
var pre_lng;
var distance;
var lat_min, lng_min, lat_max, lng_max;

var nmea_pattern = /\.(nmea)$/;

function drawMap(get_file_cgi, base_name, url_path, name) {
  map_init();
  getPositionData(get_file_cgi, base_name, url_path, name);
}

function map_init() {
  var central = new google.maps.LatLng(35.6580939,139.7413553);  // 日本緯度経度原点
  var mapOptions = {
    zoom: 10,
    center: central,
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

function map_route(data) {
  var route = [];
  var sp, ep, latlng;
  var invalid_count = 0;

  resetLatLngMinMax();
  try {
    distance = 0;
    pre_lat = 0;
    pre_lng = 0;

    if (nmea_pattern.test(name.toLowerCase())) {
      // nmeaデータ
      sp = 0;
      while((ep = data.indexOf("\n", sp)) != -1) {
        var line = data.substring(sp, ep);
        latlng = get_latlng(line); // TODO: lat, lng
        if (latlng != null) {
          route.push(latlng);
        } else {
          invalid_count++;
        }
        sp = ep + 1;
      }
      if (sp < data.length) {  // 最後の行(改行で終わっていない)
        var line = data.substring(sp);
        //console.log(line);
        latlng = get_latlng(line);
        if (latlng != null) {
          route.push(latlng);
        } else {
          invalid_count++;
        }
      }
    } else {
        alert("XMLデータを読み込みました");
    }
  } catch(e) {
    alert(e.message);
    return;
  }

  // 経路描画

  map_clear();

  document.getElementById("distance_text").innerHTML = distance.toFixed(3) + " km"; 
  document.getElementById("sample_count").innerHTML  = route.length;
  document.getElementById("invalid_sample_count").innerHTML  = invalid_count;

  geocoder.geocode({'location': route[0]}, putStartGeoCode);
  geocoder.geocode({'location': route[route.length-1]}, putEndGeoCode);

  var StartMarkerOptions = {
    position: route[0],
    icon: '%htdocs_root%/car.png',
    map: map,
    title: "Start Point"
  };
  startMarker = new google.maps.Marker(StartMarkerOptions);

  var EndPointOptions = {
    position: route[route.length - 1],
    icon: '%htdocs_root%/goal.png',
    map: map,
    title: "End Point"
  };
  endMarker = new google.maps.Marker(EndPointOptions);

  // マップの中央を奇跡が全て見える位置に合わせる
  map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));
  map.setZoom(parseInt(getMapScale()));

  panorama.setPosition(route[0]);  // street viewは開始位置にする

  var polyOptions = {
    path: route,
    strokeColor: document.f1.fm_color.value,
    strokeOpacity: 0.5,
    strokeWeight: 5
  }
  poly = new google.maps.Polyline(polyOptions);
  poly.setMap(map);
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
                if (nmea_pattern.test(name.toLowerCase())) {
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
        alert("ERROR: " + e.description);
    }
}

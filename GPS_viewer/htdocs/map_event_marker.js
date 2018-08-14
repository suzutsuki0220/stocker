var eventMarkers = new Array();

function createEventMarker(positions, index) {
  var title, label;
  var p = positions[index];
  switch (p.behavior) {
    case 1:
      title = config.title.event[0];
      label = "B";
      break;
    case 2:
      title = config.title.event[1];
      label = "T";
      break;
    case 4:
      title = config.title.event[2];
      label = "L";
      break;
    case 8:
      title = config.title.event[3];
      label = "R";
      break;
  }

  var markerOptions = {
    position: new google.maps.LatLng(p.latitude, p.longitude),
    icon: CAUTION_MARKER_ICON,
    map: map,
    title: title,
    label: label,
    animation: google.maps.Animation.DROP,
  };
  var marker = new google.maps.Marker(markerOptions);
  const canvasXY_id = uuid();
  const canvasS_id  = uuid();

  var addMarkerInfo = function(marker, positions, index) {
    var showInfoWindow = function(event) {
      var windowOptions = new Object;
      windowOptions.content = makeEventInfoContents(positions, index, canvasXY_id, canvasS_id);
      var infoWindow = new google.maps.InfoWindow(windowOptions);
      infoWindow.open(marker.getMap(), marker);
      infoWindow.addListener('domready', function() {plotEventInfoGraph(positions, index, canvasXY_id, canvasS_id)});
    };
    google.maps.event.addListener(marker, 'click', showInfoWindow);
  };
  addMarkerInfo(marker, positions, index);
  eventMarkers.push(marker);
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

function makeEventInfoContents(positions, index, canvasXY_id, canvasS_id) {
  var p = positions[index];
  var diff_p = getPositionDifference(positions, index + 12, 12);  // 位置情報は加速度より遅れるので先のサンプルで比較する

  const title = makeEventTitle(p.behavior);
  const level = p.level ? " (level: " + p.level + ")" : "";

  var altitude_diff_str = "";
  if (isNaN(diff_p.altitude) === false) {
    altitude_diff_str = new String(Math.floor(diff_p.altitude * 100) / 100) + "m ";
    if (diff_p.altitude < -0.1) {
      altitude_diff_str += "↓";
    } else if (diff_p.altitude > 0.1) {
      altitude_diff_str += "↑";
    } else {
      altitude_diff_str += "→";
    }
  }

  var speed_str = "----- km/h";
  if (isNaN(p.speed) === false) {
    speed_str = new String(Math.floor(p.speed * 100) / 100) + " km/h";

    if (isNaN(diff_p.speed) === false) {
      var speed_after = p.speed + diff_p.speed;

      if (diff_p.speed < -1.0) {
        speed_str += " ⇒ " + new String(Math.floor(speed_after * 100) / 100) + "km/h";
        speed_str += " <span style=\"color: red\">↓</span>";
      } else if (diff_p.speed > 1.0) {
        speed_str += " ⇒ " + new String(Math.floor(speed_after * 100) / 100) + "km/h";
        speed_str += " <span style=\"color: blue\">↑</span>";
      } else {
        speed_str += " →";
      }
    }
  }

  var contents;
  contents  = '<div style="color: #202020">';
  contents += '<div style="float: left; width: 95px; height: 95px; margin-right: 5px">';
  contents += '<a href="javascript:setPanoramaPosition(new google.maps.LatLng(' + p.latitude + ',' + p.longitude + '),' + diff_p.azimuth + ')">';
  contents += '<img src="' + makeStreetviewImgUrl(p.latitude, p.longitude, diff_p.azimuth) + '">';
  contents += '</a></div><div style="height: 95px">';
  contents += '<b>' + title + level + "</b><br>";
  contents += "発生時刻: " + p.datetime + "<br>";
  contents += "進行方向: " + diff_p.direction + "<br>";
  contents += "高低差: " + altitude_diff_str + "<br>";
  contents += "速度: " + speed_str;
  contents += '</div>';
  contents += '<canvas id="' + canvasXY_id + '" style="width: 100%; height: 90px"></canvas>';
  contents += '<canvas id="' + canvasS_id + '" style="width: 100%; height: 90px"></canvas>';
  contents += '</div>';

  return contents;
}

function plotEventInfoGraph(positions, index, canvasXY_id, canvasS_id) {
  const LINE_COLOR = "#383838";

  var accel_property = {
    "config": {
      "useVal": "no",
      "titleColor": LINE_COLOR,
      "xColor": LINE_COLOR,
      "yColor": LINE_COLOR,
      "yScaleColor": LINE_COLOR,
      "yScaleFont": "500 8px 'Arial'",
      "axisXWidth": 1,
      "axisXLen": 4,
      "axisYWidth": 0,
      "axisYLen": 0,
      "paddingTop": 20,
      "paddingBottom": 10,
      "paddingLeft": 40,
      "paddingRight": 5,
      "bg": "#ffffff",
      "type": "line",
      "title": "加速度 XY",
      "titleFont": "400 12px 'Arial'",
      "titleY": 15,
      "width": 350,
      "height": 90,
      "minY": -0.5,
      "maxY": 0.5,
      "colorSet": ["#FF9114", "#00A8A2"],
    },
    "data": [
      ["時間"], ["X"], ["Y"]
    ]
  };

  var speed_property = {
    "config": {
      "useVal": "no",
      "titleColor": LINE_COLOR,
      "xColor": LINE_COLOR,
      "yColor": LINE_COLOR,
      "yScaleColor": LINE_COLOR,
      "yScaleFont": "300 8px 'Arial'",
      "axisXWidth": 1,
      "axisXLen": 3,
      "axisYWidth": 0,
      "axisYLen": 0,
      "paddingTop": 20,
      "paddingBottom": 10,
      "paddingLeft": 40,
      "paddingRight": 5,
      "bg": "#ffffff",
      "type": "line",
      "title": "速度 (km/h)",
      "titleFont": "300 12px 'Arial'",
      "titleY": 15,
      "width": 350,
      "height": 90,
      "minY": 0,
      "maxY": 120,
      "colorSet": ["#2066F0"]
    },
    "data": [
      ["時間"], ["km/h"]
    ]
  };

  const EVENT_GRAPH_RANGE = 30;
  const i_start = index >= EVENT_GRAPH_RANGE ? index - EVENT_GRAPH_RANGE : 0;
  const i_end   = positions.length >= index + EVENT_GRAPH_RANGE ? index + EVENT_GRAPH_RANGE : positions.length;

  var n = 1;  // 0はグラフ凡例
  for (var i=i_start; i<i_end; i++) {
    var p = positions[i];
    if (!isNaN(p.speed)) {
      speed_property["data"][1][n] = p.speed;

      if (speed_property["config"]["minY"] > p.speed) {
        speed_property["config"]["minY"] = p.speed;
      }
      if (speed_property["config"]["maxY"] < p.speed) {
        speed_property["config"]["maxY"] = p.speed;
      }
    } else {
      speed_property["data"][1][n] = i !== 0 ? speed_property["data"][1][n-1] : 0;
    }

    accel_property["data"][1][n] = p.est_x;
    accel_property["data"][2][n] = p.est_y;

    if (accel_property["config"]["minY"] > p.est_x) {
      accel_property["config"]["minY"] = p.est_x;
    }
    if (accel_property["config"]["minY"] > p.est_y) {
      accel_property["config"]["minY"] = p.est_y;
    }
    if (accel_property["config"]["maxY"] < p.est_x) {
      accel_property["config"]["maxY"] = p.est_x;
    }
    if (accel_property["config"]["maxY"] < p.est_y) {
      accel_property["config"]["maxY"] = p.est_y;
    }

    n++;
  }

  ccchart.init(canvasXY_id, accel_property);
  ccchart.init(canvasS_id, speed_property);
}

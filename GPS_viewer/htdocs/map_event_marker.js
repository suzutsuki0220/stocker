var eventMarkers = new Array();

function createEventMarker(positions, index) {
  var title, label;
  var p = positions[index];
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

  var addMarkerInfo = function(marker, positions, index) {
    var showInfoWindow = function(event) {
      var windowOptions = new Object;
      windowOptions.content = makeEventInfoContents(positions, index);
      var infoWindow = new google.maps.InfoWindow(windowOptions);
      infoWindow.open(marker.getMap(), marker);
      infoWindow.addListener('domready', function() {plotEventInfoGraph(positions, index)});
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

function makeEventInfoContents(positions, index) {
  var title = "";
  var p = positions[index];
  const titles = ["Braking", "Throttle", "Cornering(left)", "Cornering(right)"];
  for (var i=0; i<4; i++) {
    const case_bit = 1 << i;
    if ((p.behavior & case_bit) === case_bit) {
      if (title.length !== 0) {
        title += " / ";
      }
      title += titles[i];
    }
  }
  if (title.length === 0) {
    title = "--";
  }

  var level = p.level ? " (level: " + p.level + ")" : "";

  var contents;
  contents  = '<div style="color: #202020">';
  contents += '<div style="float: left; width: 95px; height: 95px; margin-right: 5px">';
  contents += '<img src="' + makeStreetviewImgUrl(p.latitude, p.longitude, 10) + '">';
  contents += '</div><div style="height: 95px">';
  contents += '<b>' + title + level + "</b><br>";
  contents += "発生時刻: " + p.datetime + "<br>";
  contents += "速度: " + String(Math.floor(p.speed * 100) / 100) + " km/h";
  contents += '</div>';
  contents += '<canvas id="mark_event_accelXY" style="width: 100%; height: 90px"></canvas>';
  contents += '<canvas id="mark_event_speed" style="width: 100%; height: 90px"></canvas>';
  contents += '</div>';

  return contents;
}

function plotEventInfoGraph(positions, index) {
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

  ccchart.init('mark_event_accelXY', accel_property);
  ccchart.init('mark_event_speed', speed_property);
}

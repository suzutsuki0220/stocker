ccchart.base({config: {
    "useVal": "no",
    "axisXWidth": 2,
    "axisXLen": 10,
    "axisYWidth": 0,
    "axisYLen": 0,
    "paddingTop": 50,
    "paddingBottom": 30,
    "paddingLeft": 50,
    "paddingRight": 50,
    "bg": "#455054",
}});

var accelerationXY_graph_property = {
  "config": {
    "type": "line",
    "title": "加速度 XY",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "width": 1000,
    "height": 280,
    "minY": -0.6,
    "maxY": 0.6,
    "colorSet": ["#FF9114", "#00A8A2", "#3CB000", "#0036C0","#C328FF","#FF34C0"],
    "xLines": [
        {"val": 0.25, "color":"#ffffff"},
        {"val": -0.25, "color":"#ffffff"},
    ],
  },
  "data": [
    ["時間"], ["X"], ["Y"]
  ]
};

var gyro_graph_property = {
  "config": {
    "type": "line",
    "title": "Gyro",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "width": 1000,
    "height": 280,
    "minY": -30.0,
    "maxY": 30.0,
    "colorSet": ["#FF9114", "#00A8A2", "#3CB000", "#0036C0","#C328FF","#FF34C0"],
  },
  "data": [
    ["時間"], ["X"], ["Y"], ["Z"]
  ]
};

var speed_graph_property = {
  "config": {
    "type": "line",
    "title": "速度",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "axisXLen": 8,
    "width": 1000,
    "height": 220,
    "minY": 0,
    "maxY": 120,
    "colorSet": ["#2066F0","#C328FF","#FF34C0"],
  },
  "data": [
    ["時間"], ["km/h"]
  ]
};

var accelerationZ_graph_property = {
  "config": {
    "type": "line",
    "title": "加速度 Z",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "width": 1000,
    "height": 280,
    "minY": -1.5,
    "maxY": 0,
    "colorSet": ["#3CB000", "#0036C0","#C328FF","#FF34C0"],
  },
  "data": [
    ["時間"], ["Z"]
  ]
};

var altitude_graph_property = {
  "config": {
    "type": "line",
    "title": "高度",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "axisXLen": 8,
    "width": 1000,
    "height": 220,
    "minY": 0,
    "maxY": 100,
    "colorSet": ["#93B028","#1056E0","#FF34C0"],
  },
  "data": [
    ["時間"], ["m"]
  ]
};

function showGraph(positions, skip_draw) {
    if (!positions) {
        alert("グラフに表示可能なデータがありません");
        return;
    }
    var range = getPositionStartEndFromRangeController(positions);
    if (range.length < 10) {
        alert("開始位置と終了位置の間隔が狭すぎるためにグラフを表示できません");
        return;
    }

    if (document.getElementById('graph_field').style.display === "" || document.getElementById('graph_field').style.display === "none") {
        document.getElementById('info_field').style.display = "none";
        document.getElementById('graph_field').style.display = "inline";
        document.getElementById('graph_field').style.width = "55%";
        document.getElementById('graph_field').style.height = "95%";
        document.getElementById('map_canvas').style.width = "45%";
        document.getElementById('panorama_canvas').style.width = "50%";
        showXYaccelerationCanvas();
        if (skip_draw === false) {
            plotAcceleration(positions, range.start, range.end);
        }
    } else {
        hideGraph();
    }
    //map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));  // 本来の位置とズレるので放置
}

function hideGraph() {
    document.getElementById('graph_field').style.display = "none";
    document.getElementById('info_field').style.display = "inline";
    document.getElementById('graph_field').style.width = "0px";
    document.getElementById('graph_field').style.height = "0px";
    document.getElementById('map_canvas').style.width = "100%";
    document.getElementById('panorama_canvas').style.width = "100%";
    hideXYaccelerationCanvas();
}

function plotAcceleration(positions, start, end) {
    var checkCentralZ = function(positions, start, end, skip) {
      var ret = false;
      var total = 0;
      var count = 0;
      var ave;

      for (var i=start; i<end; i+=skip) {
        total += positions[i].est_z;
        count++;
      }
      ave = total / count;
      if (ave > -0.5 && ave < 0.5) {
        ret = true;
      }

      return ret;
    };

    var pushSpeedData = function(data_index, p) {
      if (!isNaN(p.speed)) {
        speed_graph_property["data"][1][data_index] = p.speed;
      } else {
        if (data_index === 0) {
          speed_graph_property["data"][1][data_index] = 0;
        } else {
          speed_graph_property["data"][1][data_index] = speed_graph_property["data"][1][data_index - 1];
        }
      }
    };

    var pushAltitudeData = function(data_index, p) {
      if (!isNaN(p.altitude)) {
        altitude_graph_property["data"][1][data_index] = p.altitude;
        if (p.altitude > altitude_graph_property["config"]["maxY"]) {
          altitude_graph_property["config"]["maxY"] = p.altitude;
        }
        if (p.altitude < altitude_graph_property["config"]["minY"]) {
          altitude_graph_property["config"]["minY"] = p.altitude;
        }
      } else {
        if (data_index === 0) {
          altitude_graph_property["data"][1][data_index] = 0;
        } else {
          altitude_graph_property["data"][1][data_index] = altitude_graph_property["data"][1][data_index - 1];
        }
      }
    };

    if (document.getElementById('graph_field').style.display === "" || document.getElementById('graph_field').style.display === "none") {
        return;
    }

    var graph_behavior = new graphBehavior();
    var skip = Math.floor((end - start)/5000) + 1;
    var fix_central_z = checkCentralZ(positions, start, end, skip);

    clearAccelerationGraphData();
    var data_index = 1;
    for (var i=start; i<end; i+=skip) {
        var p = positions[i];
        accelerationXY_graph_property["data"][1][data_index] = p.est_x;
        accelerationXY_graph_property["data"][2][data_index] = p.est_y;
        accelerationZ_graph_property["data"][1][data_index] = fix_central_z === true ? p.est_z - 1.0 : p.est_z;
        gyro_graph_property["data"][1][data_index] = p.gyro_x;
        gyro_graph_property["data"][2][data_index] = p.gyro_y;
        gyro_graph_property["data"][3][data_index] = p.gyro_z;
        graph_behavior.push(p);
        pushSpeedData(data_index, p);
        pushAltitudeData(data_index, p);
        pushXYaccelerationData(data_index, p);
        data_index++;
    }

    ccchart.init('graph_accelXY', accelerationXY_graph_property);
    ccchart.init('graph_accelZ', accelerationZ_graph_property);
    ccchart.init('graph_gyro', gyro_graph_property);
    ccchart.init('graph_altitude', altitude_graph_property);
    ccchart.init('graph_speed', speed_graph_property);
    graph_behavior.plot();
    plotXYacceleration();
}

function clearAccelerationGraphData() {
    accelerationXY_graph_property["data"][1].splice(1, accelerationXY_graph_property["data"][1].length - 1);
    accelerationXY_graph_property["data"][2].splice(1, accelerationXY_graph_property["data"][2].length - 1);
    accelerationZ_graph_property["data"][1].splice(1, accelerationZ_graph_property["data"][1].length - 1);
    gyro_graph_property["data"][1].splice(1, gyro_graph_property["data"][1].length - 1);
    gyro_graph_property["data"][2].splice(1, gyro_graph_property["data"][2].length - 1);
    gyro_graph_property["data"][3].splice(1, gyro_graph_property["data"][3].length - 1);
    speed_graph_property["data"][1].splice(1, speed_graph_property["data"][1].length - 1);
    altitude_graph_property["config"]["maxY"] = 100;
    altitude_graph_property["data"][1].splice(1, altitude_graph_property["data"][1].length - 1);
    clearXYaccelerationData();
}

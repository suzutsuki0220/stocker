ccchart.base({config: {
    "type": "line",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "width": 1000,
    "height": 280,
    "minY": 0,
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
    "title": "加速度 XY",
    "minY": -0.6,
    "maxY": 0.6,
    "colorSet": ["#FF9114", "#00A8A2", "#3CB000"],
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
    "title": "Gyro",
    "minY": -30.0,
    "maxY": 30.0,
    "colorSet": ["#FF9114", "#00A8A2", "#3CB000"],
  },
  "data": [
    ["時間"], ["X"], ["Y"], ["Z"]
  ]
};

var speed_graph_property = {
  "config": {
    "title": "速度",
    "axisXLen": 8,
    "height": 220,
    "maxY": 120,
    "colorSet": ["#2066F0"],
  },
  "data": [
    ["時間"], ["km/h"]
  ]
};

var accelerationZ_graph_property = {
  "config": {
    "title": "加速度 Z",
    "minY": -1.5,
    "maxY": 0,
    "colorSet": ["#3CB000"],
  },
  "data": [
    ["時間"], ["Z"]
  ]
};

var altitude_graph_property = {
  "config": {
    "title": "高度",
    "axisXLen": 8,
    "height": 220,
    "maxY": 100,
    "colorSet": ["#93B028"],
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
        document.getElementById('range_field').style.width = "45%";
        document.getElementById('panorama_canvas').style.width = "50%";
        map_range_slider.onResizeWork();
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
    document.getElementById('range_field').style.width = "100%";
    document.getElementById('panorama_canvas').style.width = "100%";
    map_range_slider.onResizeWork();
    hideXYaccelerationCanvas();
}

function plotAcceleration(positions, start, end) {
    var checkCentralZ = function(positions, start, end, skip) {
      var ret = false;
      var total = 0;
      var count = 0;
      var ave;

      for (var i=start; i<end; i+=skip) {
        total += positions[i].est.z;
        count++;
      }
      ave = total / count;
      if (ave > -0.5 && ave < 0.5) {
        ret = true;
      }

      return ret;
    };

    var pushIntermitData = function(property, data_index, value) {
      if (isNaN(value) === false) {
        property["data"][1][data_index] = value;
        if (value > property["config"]["maxY"]) {
          property["config"]["maxY"] = value;
        }
        if (value < property["config"]["minY"]) {
          property["config"]["minY"] = value;
        }
      } else {
        if (data_index === 0) {
          property["data"][1][data_index] = 0;
        } else {
          property["data"][1][data_index] = property["data"][1][data_index - 1];
        }
      }
    };

    if (document.getElementById('graph_field').style.display === "" || document.getElementById('graph_field').style.display === "none") {
        return;
    }

    var graph_behavior = new graphBehavior();
    var skip = Math.floor((end - start)/5000) + 1;
    const z_central = checkCentralZ(positions, start, end, skip) === true ? -1.0 : 0;

    clearAccelerationGraphData();
    var data_index = 1;
    for (var i=start; i<end; i+=skip) {
        var p = positions[i];
        accelerationXY_graph_property["data"][1][data_index] = p.est ? replaceNanToZero(p.est.x) : 0;
        accelerationXY_graph_property["data"][2][data_index] = p.est ? replaceNanToZero(p.est.y) : 0;
        accelerationZ_graph_property["data"][1][data_index]  = p.est ? replaceNanToZero(p.est.z) + z_central : 0;
        gyro_graph_property["data"][1][data_index] = p.gyro ? replaceNanToZero(p.gyro.x) : 0;
        gyro_graph_property["data"][2][data_index] = p.gyro ? replaceNanToZero(p.gyro.y) : 0;
        gyro_graph_property["data"][3][data_index] = p.gyro ? replaceNanToZero(p.gyro.z) : 0;
        graph_behavior.push(p);
        pushIntermitData(speed_graph_property, data_index, p.speed);
        pushIntermitData(altitude_graph_property, data_index, p.altitude);
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

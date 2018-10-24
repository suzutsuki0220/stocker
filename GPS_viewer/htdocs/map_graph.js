var mapGraph = new Object();

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

mapGraph.accelerationXY_property = {
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

mapGraph.gyro_property = {
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

mapGraph.speed_property = {
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

mapGraph.accelerationZ_property = {
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

mapGraph.altitude_property = {
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

mapGraph.isVisible = function() {
    var ret = false;
    if (document.getElementById('graph_field').style.display === "inline") {
        ret = true;
    }

    return ret;
};

mapGraph.toggleView = function(positions, skip_draw) {
    if (!positions) {
        alert("グラフに表示可能なデータがありません");
        return;
    }
    var range = getPositionStartEndFromRangeController(positions);
    if (range.length < 10) {
        alert("開始位置と終了位置の間隔が狭すぎるためにグラフを表示できません");
        return;
    }

    if (mapGraph.isVisible() === false) {
        mapGraph.show(positions, skip_draw);
        if (skip_draw === false) {
            mapGraph.plot(positions, range.start, range.end);
        }
    } else {
        mapGraph.hide();
    }
};

mapGraph.show = function() {
    document.getElementById('info_field').style.display = "none";
    document.getElementById('graph_field').style.display = "inline";
    document.getElementById('graph_field').style.width = "55%";
    document.getElementById('graph_field').style.height = "95%";
    document.getElementById('map_canvas').style.width = "45%";
    document.getElementById('range_field').style.width = "45%";
    document.getElementById('panorama_canvas').style.width = "50%";
    map_range_slider.onResizeWork();
    showXYaccelerationCanvas();
    //map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));  // 本来の位置とズレるので放置
};

mapGraph.hide = function() {
    document.getElementById('graph_field').style.display = "none";
    document.getElementById('info_field').style.display = "inline";
    document.getElementById('graph_field').style.width = "0px";
    document.getElementById('graph_field').style.height = "0px";
    document.getElementById('map_canvas').style.width = "100%";
    document.getElementById('range_field').style.width = "100%";
    document.getElementById('panorama_canvas').style.width = "100%";
    map_range_slider.onResizeWork();
    hideXYaccelerationCanvas();
};

mapGraph._checkCentralZ = function(positions, start, end, skip) {
    var ret = 0;
    var total = 0;
    var count = 0;

    for (var i=start; i<end; i+=skip) {
        if (positions[i].est) {
            total += positions[i].est.z;
            count++;
        }
    }
    const ave = count !== 0 ? total / count : 0;
    if (Math.abs(ave) < 0.5) {
        ret = -1.0;
    }

    return ret;
};

mapGraph._pushIntermitData = function(property, data_index, value) {
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

mapGraph.plot = function(positions, start, end) {
    if (mapGraph.isVisible() === false) {
        return;
    }

    var graph_behavior = new graphBehavior(document.getElementById('graph_behavior'));
    var skip = Math.floor((end - start)/5000) + 1;
    const z_central = mapGraph._checkCentralZ(positions, start, end, skip);

    mapGraph.clearData();
    var data_index = 1;
    for (var i=start; i<end; i+=skip) {
        var p = positions[i];
        mapGraph.accelerationXY_property["data"][1][data_index] = p.est ? replaceNanToZero(p.est.x) : 0;
        mapGraph.accelerationXY_property["data"][2][data_index] = p.est ? replaceNanToZero(p.est.y) : 0;
        mapGraph.accelerationZ_property["data"][1][data_index]  = p.est ? replaceNanToZero(p.est.z) + z_central : 0;
        mapGraph.gyro_property["data"][1][data_index] = p.gyro ? replaceNanToZero(p.gyro.x) : 0;
        mapGraph.gyro_property["data"][2][data_index] = p.gyro ? replaceNanToZero(p.gyro.y) : 0;
        mapGraph.gyro_property["data"][3][data_index] = p.gyro ? replaceNanToZero(p.gyro.z) : 0;
        graph_behavior.push(p);
        mapGraph._pushIntermitData(mapGraph.speed_property, data_index, p.speed);
        mapGraph._pushIntermitData(mapGraph.altitude_property, data_index, p.coordinate.altitude);
        pushXYaccelerationData(data_index, p);
        data_index++;
    }

    ccchart.init('graph_accelXY', mapGraph.accelerationXY_property);
    ccchart.init('graph_accelZ', mapGraph.accelerationZ_property);
    ccchart.init('graph_gyro', mapGraph.gyro_property);
    ccchart.init('graph_altitude', mapGraph.altitude_property);
    ccchart.init('graph_speed', mapGraph.speed_property);
    graph_behavior.plot();
    plotXYacceleration();
};

mapGraph.clearData = function() {
    mapGraph.accelerationXY_property["data"][1].splice(1, mapGraph.accelerationXY_property["data"][1].length - 1);
    mapGraph.accelerationXY_property["data"][2].splice(1, mapGraph.accelerationXY_property["data"][2].length - 1);
    mapGraph.accelerationZ_property["data"][1].splice(1, mapGraph.accelerationZ_property["data"][1].length - 1);
    mapGraph.gyro_property["data"][1].splice(1, mapGraph.gyro_property["data"][1].length - 1);
    mapGraph.gyro_property["data"][2].splice(1, mapGraph.gyro_property["data"][2].length - 1);
    mapGraph.gyro_property["data"][3].splice(1, mapGraph.gyro_property["data"][3].length - 1);
    mapGraph.speed_property["data"][1].splice(1, mapGraph.speed_property["data"][1].length - 1);
    mapGraph.altitude_property["config"]["maxY"] = 100;
    mapGraph.altitude_property["data"][1].splice(1, mapGraph.altitude_property["data"][1].length - 1);
    clearXYaccelerationData();
};

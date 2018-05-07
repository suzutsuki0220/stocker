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
    "title": "Speed",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "width": 1000,
    "height": 280,
    "minY": 0,
    //"maxY": 200,
    "colorSet": ["#1056E0","#C328FF","#FF34C0"],
  },
  "data": [
    ["時間"], ["speed"]
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

var event_graph_property = {
  "config": {
    "type": "line",
    "title": "Behavior",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "axisXLen": 8,
    "width": 1000,
    "height": 280,
    "minY": 0,
    "maxY": 8,
    "colorSet": ["#3CB000", "#0036C0","#C328FF","#FF34C0"],
  },
  "data": [
    ["時間"], ["event"]
  ]
};

var accelerationXY_gforce_property = {
  "config": {
    "type": "scatter",
    "axisYWidth": 2,
    "axisYLen": 10,
    "title": "加速度 XY分布",
    "titleFont": "400 20px 'Arial'",
    "titleY": 30,
    "paddingTop": 50,
    "paddingBottom": 50,
    "paddingLeft": 50,
    "paddingRight": 30,
    //"width": 500,
    //"height": 500,
    "minY": -0.6,
    "maxY": 0.6,
    "minX": -0.6,
    "maxX": 0.6,
    "colorSet": ["#FF9114", "#00A8A2", "#3CB000", "#0036C0","#C328FF","#FF34C0"],
    "useMarker": "maru",
    "xLines": [
        {"val": 0, "color":"#ffffff"},
    ],
  },
  "data": [
    ["時間"], ["Y"], ["X"]
  ]
};

function showGraph(positions) {
    if (document.getElementById('graph_field').style.display === "" || document.getElementById('graph_field').style.display === "none") {
        document.getElementById('info_field').style.display = "none";
        document.getElementById('graph_field').style.display = "inline";
        document.getElementById('graph_field').style.width = "55%";
        document.getElementById('graph_field').style.height = "95%";
        document.getElementById('map_canvas').style.width = "45%";
        document.getElementById('panorama_canvas').style.width = "50%";
        document.getElementById('gforce_accelXY').style.display = "inline";
        plotAcceleration(positions);
    } else {
        document.getElementById('graph_field').style.display = "none";
        document.getElementById('info_field').style.display = "inline";
        document.getElementById('graph_field').style.width = "0px";
        document.getElementById('graph_field').style.height = "0px";
        document.getElementById('map_canvas').style.width = "100%";
        document.getElementById('panorama_canvas').style.width = "100%";
        document.getElementById('gforce_accelXY').style.display = "none";
    }
    map.panTo(getCenterLocation(lat_min, lng_min, lat_max, lng_max));
}

function plotAcceleration(positions) {
    var range_start = parseInt(document.getElementsByName('range_start')[0].value);
    var range_end = parseInt(document.getElementsByName('range_end')[0].value);
    var start = Math.floor(positions.length * range_start / 1000);
    var end   = Math.floor(positions.length * range_end / 1000);

    var fix_central_z = checkCentralZ(positions);

    clearAccelerationGraphData();
    var data_index = 1;
    for (var i=start; i<end; i++) {
        var p = positions[i];
        accelerationXY_graph_property["data"][1][data_index] = p.est_x;
        accelerationXY_graph_property["data"][2][data_index] = p.est_y;
        accelerationZ_graph_property["data"][1][data_index] = fix_central_z === true ? p.est_z - 1.0 : p.est_z;
        accelerationXY_gforce_property["data"][1][data_index] = p.est_y * -1.0;
        accelerationXY_gforce_property["data"][2][data_index] = p.est_x;
        gyro_graph_property["data"][1][data_index] = p.gyro_x;
        gyro_graph_property["data"][2][data_index] = p.gyro_y;
        gyro_graph_property["data"][3][data_index] = p.gyro_z;
        speed_graph_property["data"][1][data_index] = p.speed;
        event_graph_property["data"][1][data_index] = p.behavior;
        data_index++;
    }

    ccchart.init('graph_accelXY', accelerationXY_graph_property);
    ccchart.init('graph_accelZ', accelerationZ_graph_property);
    ccchart.init('graph_gyro', gyro_graph_property);
    ccchart.init('graph_event', event_graph_property);
    ccchart.init('graph_speed', speed_graph_property);
    ccchart.init('gforce_accelXY', accelerationXY_gforce_property);
}

function clearAccelerationGraphData() {
    accelerationXY_graph_property["data"][1].splice(1, accelerationXY_graph_property["data"][1].length - 1);
    accelerationXY_graph_property["data"][2].splice(1, accelerationXY_graph_property["data"][2].length - 1);
    accelerationZ_graph_property["data"][1].splice(1, accelerationZ_graph_property["data"][1].length - 1);
    accelerationXY_gforce_property["data"][1].splice(1, accelerationXY_gforce_property["data"][1].length - 1);
    accelerationXY_gforce_property["data"][2].splice(1, accelerationXY_gforce_property["data"][2].length - 1);
    gyro_graph_property["data"][1].splice(1, gyro_graph_property["data"][1].length - 1);
    gyro_graph_property["data"][2].splice(1, gyro_graph_property["data"][2].length - 1);
    gyro_graph_property["data"][3].splice(1, gyro_graph_property["data"][3].length - 1);
    speed_graph_property["data"][1].splice(1, speed_graph_property["data"][1].length - 1);
    event_graph_property["data"][1].splice(1, event_graph_property["data"][1].length - 1);
}

function checkCentralZ(positions) {
    var ret = false;
    var total = 0;
    var ave;

    for (var i=0; i<positions.length; i++) {
        total += positions[i].est_z;
    }

    ave = total / positions.length;
    if (ave > -0.5 && ave < 0.5) {
        ret = true;
    }

    return ret;
}

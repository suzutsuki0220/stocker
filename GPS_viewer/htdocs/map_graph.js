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
    "title": "補正加速度 XY",
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
    "title": "補正加速度 Z",
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
    "title": "補正加速度 XY分布",
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

function showGraph(position) {
    if (document.getElementById('graph_field').style.display === "" || document.getElementById('graph_field').style.display === "none") {
        document.getElementById('info_field').style.display = "none";
        document.getElementById('graph_field').style.display = "inline";
        document.getElementById('graph_field').style.width = "55%";
        document.getElementById('graph_field').style.height = "95%";
        document.getElementById('map_canvas').style.width = "45%";
        document.getElementById('panorama_canvas').style.width = "50%";
        document.getElementById('gforce_accelXY').style.display = "inline";
        plotAcceleration(position);
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

function plotAcceleration(position) {
    for (var i=0; i<position.length; i++) {
        var p = position[i];
        accelerationXY_graph_property["data"][1][i+1] = p.est_x;
        accelerationXY_graph_property["data"][2][i+1] = p.est_y;
        accelerationZ_graph_property["data"][1][i+1] = p.est_z;
        accelerationXY_gforce_property["data"][1][i+1] = p.est_y * -1.0;
        accelerationXY_gforce_property["data"][2][i+1] = p.est_x;
        gyro_graph_property["data"][1][i+1] = p.gyro_x;
        gyro_graph_property["data"][2][i+1] = p.gyro_y;
        gyro_graph_property["data"][3][i+1] = p.gyro_z;
        speed_graph_property["data"][1][i+1] = p.speed;
        event_graph_property["data"][1][i+1] = p.behavior;
    }

    ccchart.init('graph_accelXY', accelerationXY_graph_property);
    ccchart.init('graph_accelZ', accelerationZ_graph_property);
    ccchart.init('graph_gyro', gyro_graph_property);
    ccchart.init('graph_event', event_graph_property);
    ccchart.init('graph_speed', speed_graph_property);
    ccchart.init('gforce_accelXY', accelerationXY_gforce_property);
}


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

function showXYaccelerationCanvas() {
    document.getElementById('gforce_accelXY').style.display = "inline";
}

function hideXYaccelerationCanvas() {
    document.getElementById('gforce_accelXY').style.display = "none";
}

function clearXYaccelerationData() {
    accelerationXY_gforce_property["data"][1].splice(1, accelerationXY_gforce_property["data"][1].length - 1);
    accelerationXY_gforce_property["data"][2].splice(1, accelerationXY_gforce_property["data"][2].length - 1);
}

function pushXYaccelerationData(data_index, p) {
    accelerationXY_gforce_property["data"][1][data_index] = p.est_y * -1.0;
    accelerationXY_gforce_property["data"][2][data_index] = p.est_x;
}

function plotXYacceleration() {
    ccchart.init('gforce_accelXY', accelerationXY_gforce_property);
}

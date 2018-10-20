var mapEventMarker = function(opt) {
    this.eventMarkers = new Array();
    this.ins_map = opt.map;
};

mapEventMarker.prototype.create = function(positions, index) {
    var p = positions[index];

    var tl = this._getMarkerLabelByBehavior(p.behavior);
    var markerOptions = {
        position: new google.maps.LatLng(p.latitude, p.longitude),
        icon: CAUTION_MARKER_ICON,
        map: this.ins_map,
        title: tl.title,
        label: tl.label,
        animation: google.maps.Animation.DROP,
    };
    var marker = new google.maps.Marker(markerOptions);

    this.__addToMap(marker, positions, index);
    this.eventMarkers.push(marker);
};

mapEventMarker.prototype.clear = function() {
    while(this.eventMarkers.length !== 0) {
        var poped = this.eventMarkers.pop();
        if (poped) {
            poped.setMap(null);
            poped = null;
        }
    }
};

mapEventMarker.prototype.__makeEventInfoContents = function(positions, index, canvasXY_id, canvasS_id) {
    var p = positions[index];
    var diff_p = getPositionDifference(positions, index + 12, 12);  // 位置情報は加速度より遅れるので先のサンプルで比較する

    const title = makeEventTitle(p.behavior);
    const level = p.level ? " (level: " + p.level + ")" : "";

    var speed_str = makeSpeedText(p.speed, NaN);
    if (isNaN(p.speed) === false && isNaN(diff_p.speed) === false) {
        if (Math.abs(diff_p.speed) > 1.0) {
            const speed_after = p.speed + diff_p.speed;
            speed_str += " ⇒ " + makeSpeedText(speed_after, diff_p.speed);
        } else {
            speed_str += " →";
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
    contents += "高低差: " + makeAltitudeDiffText(diff_p.altitude) + "<br>";
    contents += "速度: " + speed_str;
    contents += '</div>';
    contents += '<canvas id="' + canvasXY_id + '" style="width: 100%; height: 90px"></canvas>';
    contents += '<canvas id="' + canvasS_id + '" style="width: 100%; height: 90px"></canvas>';
    contents += '</div>';

    return contents;
}

mapEventMarker.prototype.plotEventInfoGraph = function(positions, index, canvasXY_id, canvasS_id) {
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
        var minmax;
        var p = positions[i];
        if (!isNaN(p.speed)) {
            speed_property["data"][1][n] = p.speed;

            minmax = this.__compareMinMax(speed_property["config"]["minY"], speed_property["config"]["maxY"], p.speed);
            speed_property["config"]["minY"] = minmax.min;
            speed_property["config"]["maxY"] = minmax.max;
        } else {
            speed_property["data"][1][n] = i !== 0 ? speed_property["data"][1][n-1] : 0;
        }

        accel_property["data"][1][n] = p.est.x;
        accel_property["data"][2][n] = p.est.y;

        minmax = this.__compareMinMax(accel_property["config"]["minY"], accel_property["config"]["maxY"], p.est.x);
        accel_property["config"]["minY"] = minmax.min;
        accel_property["config"]["maxY"] = minmax.max;

        minmax = this.__compareMinMax(accel_property["config"]["minY"], accel_property["config"]["maxY"], p.est.y);
        accel_property["config"]["minY"] = minmax.min;
        accel_property["config"]["maxY"] = minmax.max;

        n++;
    }

    ccchart.init(canvasXY_id, accel_property);
    ccchart.init(canvasS_id, speed_property);
};

mapEventMarker.prototype.__compareMinMax = function(min, max, value) {
    var ret = {min: min, max: max};

    if (min > value) {
        ret.min = value;
    }
    if (max < value) {
        ret.max = value;
    }

    return ret;
};

mapEventMarker.prototype.__addToMap = function(marker, positions, index) {
    var self = this;
    const canvasXY_id = uuid();
    const canvasS_id  = uuid();

    var showInfoWindow = function(event) {
        var windowOptions = new Object();
        windowOptions.content = self.__makeEventInfoContents(positions, index, canvasXY_id, canvasS_id);
        var infoWindow = new google.maps.InfoWindow(windowOptions);
        infoWindow.open(marker.getMap(), marker);
        infoWindow.addListener('domready', function() {self.plotEventInfoGraph(positions, index, canvasXY_id, canvasS_id)});
    };
    google.maps.event.addListener(marker, 'click', showInfoWindow);
};

mapEventMarker.prototype._getMarkerLabelByBehavior = function(behavior) {
    var title = "";
    var label = "";

    switch (behavior) {
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

    return {title: title, label: label};
};

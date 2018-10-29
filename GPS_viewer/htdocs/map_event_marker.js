var mapEventMarker = function(opt) {
    this.eventMarkers = new Array();
    this.ins_map = opt.map;
    this.EVENT_GRAPH_RANGE = 30;
    this.border_color = "#383838";
    this.graph_speed_max = 120;
    this.graph_speed_min = 0;
    this.graph_accel_max = 0.5;
    this.graph_accel_min = -0.5;

    this.accel_property;
    this.speed_property;
};

mapEventMarker.prototype.setup = function() {
    this.accel_property = {
      "config": {
        "useVal": "no",
        "titleColor": this.border_color,
        "xColor": this.border_color,
        "yColor": this.border_color,
        "yScaleColor": this.border_color,
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
        "minY": this.graph_accel_min,
        "maxY": this.graph_accel_max,
        "colorSet": ["#FF9114", "#00A8A2"],
      },
      "data": [
        ["時間"], ["X"], ["Y"]
      ]
    };

    this.speed_property = {
      "config": {
        "useVal": "no",
        "titleColor": this.border_color,
        "xColor": this.border_color,
        "yColor": this.border_color,
        "yScaleColor": this.border_color,
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
        "minY": this.graph_speed_min,
        "maxY": this.graph_speed_max,
        "colorSet": ["#2066F0"]
      },
      "data": [
        ["時間"], ["km/h"]
      ]
    };
}

mapEventMarker.prototype.create = function(tracks, index) {
    var p = tracks[index];

    var tl = this._getMarkerLabelByBehavior(p.behavior);
    var markerOptions = {
        position: new google.maps.LatLng(p.coordinate.latitude, p.coordinate.longitude),
        icon: CAUTION_MARKER_ICON,
        map: this.ins_map,
        title: tl.title,
        label: tl.label,
        animation: google.maps.Animation.DROP,
    };
    var marker = new google.maps.Marker(markerOptions);

    this.__addToMap(marker, tracks, index);
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

mapEventMarker.prototype.__makeEventInfoContents = function(tracks, index, canvasXY_id, canvasS_id) {
    var p = tracks[index];
    var diff_p = getPositionDifference(tracks, index + 12, 12);  // 位置情報は加速度より遅れるので先のサンプルで比較する

    const title = makeEventTitle(p.behavior);
    const level = p.level ? " (level: " + p.level + ")" : "";

    var contents;
    contents  = '<div style="color: #202020">';
    contents += '<div style="float: left; width: 95px; height: 95px; margin-right: 5px">';
    contents += '<a href="javascript:map_googlemaps.setPanoramaPosition(new google.maps.LatLng(' + p.coordinate.latitude + ',' + p.coordinate.longitude + '),' + diff_p.azimuth + ')">';
    contents += '<img src="' + map_googlemaps.makeStreetviewImgUrl(p.coordinate, diff_p.azimuth) + '">';
    contents += '</a></div><div style="height: 95px">';
    contents += '<b>' + title + level + "</b><br>";
    contents += "発生時刻: " + p.datetime + "<br>";
    contents += "進行方向: " + diff_p.direction + "<br>";
    contents += "高低差: " + makeAltitudeDiffText(diff_p.altitude) + "<br>";
    contents += "速度: " + makeSpeedText(p.speed, NaN) + this._makeEventAfterSpeedText(p, diff_p) + "<br>";
    contents += '</div>';
    contents += '<canvas id="' + canvasXY_id + '" style="width: 100%; height: 90px"></canvas>';
    contents += '<canvas id="' + canvasS_id + '" style="width: 100%; height: 90px"></canvas>';
    contents += '</div>';

    return contents;
}

mapEventMarker.prototype.plotEventInfoGraph = function(tracks, index, canvasXY_id, canvasS_id) {
    const i_start = index >= this.EVENT_GRAPH_RANGE ? index - this.EVENT_GRAPH_RANGE : 0;
    const i_end   = tracks.length >= index + this.EVENT_GRAPH_RANGE ? index + this.EVENT_GRAPH_RANGE : tracks.length;

    this.setup();

    var n = 1;  // 0はグラフ凡例
    for (var i=i_start; i<i_end; i++) {
        var minmax;
        var p = tracks[i];
        if (!isNaN(p.speed)) {
            this.speed_property["data"][1][n] = normalize(p.speed, this.graph_speed_min, this.graph_speed_max);
        } else {
            this.speed_property["data"][1][n] = i !== 0 ? this.speed_property["data"][1][n-1] : 0;
        }

        this.accel_property["data"][1][n] = normalize(p.est.x, this.graph_accel_min, this.graph_accel_max);
        this.accel_property["data"][2][n] = normalize(p.est.y, this.graph_accel_min, this.graph_accel_max);

        n++;
    }

    ccchart.init(canvasXY_id, this.accel_property);
    ccchart.init(canvasS_id, this.speed_property);
};

mapEventMarker.prototype.__addToMap = function(marker, tracks, index) {
    var self = this;
    const canvasXY_id = uuid();
    const canvasS_id  = uuid();

    var showInfoWindow = function(event) {
        var windowOptions = new Object();
        windowOptions.content = self.__makeEventInfoContents(tracks, index, canvasXY_id, canvasS_id);
        var infoWindow = new google.maps.InfoWindow(windowOptions);
        infoWindow.open(marker.getMap(), marker);
        infoWindow.addListener('domready', function() {self.plotEventInfoGraph(tracks, index, canvasXY_id, canvasS_id)});
    };
    google.maps.event.addListener(marker, 'click', showInfoWindow);
};

mapEventMarker.prototype._makeEventAfterSpeedText = function(p, diff_p) {
    var speed_str = "";

    if (isNaN(p.speed) === false && isNaN(diff_p.speed) === false) {
        if (Math.abs(diff_p.speed) > 1.0) {
            const speed_after = p.speed + diff_p.speed;
            speed_str = " ⇒ " + makeSpeedText(speed_after, diff_p.speed);
        } else {
            speed_str = " →";
        }
    }

    return speed_str;
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

var mapGoogleMaps = function(map) {
    this.map_ins = map;
    this.panorama = null;
    this.init_position = new google.maps.LatLng(35.6580939,139.7413553);  // 日本緯度経度原点
    this.startMarker = null;
    this.endMarker = null;
    this.poly_route = new Array();
    this.polylines = new Array();
    this.polyline_clicked_info = null;  // 地図上の線をクリックした時に表示される開始・終了の選択吹出し

    this.panorama_options = {
      position: this.init_position,  // 初期位置
      pov: {
        heading: 180,
        pitch: -5
      },
      motionTracking: false
    };
};

mapGoogleMaps.prototype.getLatLng = function(coordinate) {
    if (isValidLatLng(coordinate) === false) {
        return null;
    }

    return new google.maps.LatLng(coordinate.latitude, coordinate.longitude);
};

mapGoogleMaps.prototype.setStartEndMarker = function(start_latlng, end_latlng) {
    const StartMarkerOptions = {
        position: start_latlng,
        icon: START_MARKER_ICON,
        map: this.map_ins,
        title: "Start Point"
    };
    this.startMarker = new google.maps.Marker(StartMarkerOptions);

    const EndMarkerOptions = {
        position: end_latlng,
        icon: END_MARKER_ICON,
        map: this.map_ins,
        title: "End Point"
    };
    this.endMarker = new google.maps.Marker(EndMarkerOptions);
};

mapGoogleMaps.prototype.clearStartEndMarker = function() {
    if (this.startMarker != null) {
        this.startMarker.setMap(null);
        this.startMarker = null;
    }
    if (this.endMarker != null) {
        this.endMarker.setMap(null);
        this.endMarker = null;
    }
};

mapGoogleMaps.prototype.initPanorama = function(doc_elem) {
    this.panorama = new google.maps.StreetViewPanorama(doc_elem, this.panorama_options);
    map.setStreetView(this.panorama);
};

mapGoogleMaps.prototype.setPanoramaPosition = function(gm_latlng, heading) {
    var self = this;
    var panorama_setter = function(panoramaData) {
        var pov = new Object();
        pov.pitch   = 10;
        pov.heading = !isNaN(heading) ? heading : 180;

        self.panorama.setPosition(panoramaData.location.latLng);
        self.panorama.setPov(pov);
    };

    this.getNearRoad(gm_latlng, panorama_setter);
};

mapGoogleMaps.prototype.getNearRoad = function(gm_latlng, setter_func) {
    var get_callback = function(panoramaData, status) {
        switch (status) {
        case google.maps.StreetViewStatus.OK:
            setter_func(panoramaData);
            break;
        case google.maps.StreetViewStatus.UNKNOWN_ERROR:
            showMapError("StreetViewのデータ取得に失敗しました");
            break;
        case google.maps.StreetViewStatus.ZERO_RESULTS:
            showMapWarning("道路以外の場所からルートが始まっている可能性があります");
            break;
        }
    };

    var svs = new google.maps.StreetViewService;
    svs.getPanorama({
        location: gm_latlng,
        preference: google.maps.StreetViewPreference.NEAREST,
        radius: 100,  // メートル
        source: google.maps.StreetViewSource.OUTDOOR
    }, get_callback);
};

mapGoogleMaps.prototype.pushPolyLinePath = function(latlng) {
    this.poly_route.push(latlng);
};

mapGoogleMaps.prototype.clearPolyLinePath = function() {
    this.poly_route = [];
};

mapGoogleMaps.prototype.plotPolyLine = function(color) {
    var polyOptions = {
        path: this.poly_route,
        strokeColor: color,
        strokeOpacity: 0.75,
        strokeWeight: 5
    };
    var poly = new google.maps.Polyline(polyOptions);
    poly.setMap(this.map_ins);
    poly.addListener("click", this.polyLineClickEvent);

    this.polylines.push(poly);
    this.clearPolyLinePath();  // pushした座標をクリア
};

mapGoogleMaps.prototype.clearPolyLine = function() {
    while ((poly = this.polylines.pop()) !== undefined) {
        google.maps.event.clearListeners(poly, "click");
        poly.setMap(null);
    }
};

mapGoogleMaps.prototype.closePolyLineInfo = function() {
    if (this.polyline_clicked_info !== null) {
        this.polyline_clicked_info.close();
        this.polyline_clicked_info = null;
    }
};

mapGoogleMaps.prototype.polyLineClickEvent = function(e) {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // 航空写真表示では位置がずれてしまうことがあったので、地図表示で選択させたい
    if (this.map_ins.getMapTypeId() !== google.maps.MapTypeId.ROADMAP) {
        if (window.confirm("範囲選択のために地図表示に切り替えます")) {
            this.map_ins.setMapTypeId(google.maps.MapTypeId.ROADMAP)
        }
        return;
    }

    const info_content = "<div style=\"color: #202020\">経路の範囲</div><br><a href=\"javascript:setStartEndRangeByPolylineClicked('range_start_pos', " + lat + ", " + lng + ")\" class=\"button\">開始位置に指定</a>&nbsp;<a href=\"javascript:setStartEndRangeByPolylineClicked('range_end_pos', " + lat + ", " + lng + ")\" class=\"button\">終了位置に指定</a>";

    this.closePolyLineInfo();
    this.polyline_clicked_info = new google.maps.InfoWindow();
    this.polyline_clicked_info.setPosition(e.latLng);
    this.polyline_clicked_info.setContent(info_content);
    this.polyline_clicked_info.open(this.map_ins);
};

// マップの中央を奇跡が全て見える位置に合わせる
mapGoogleMaps.prototype.centeringMap = function(center, scale) {
    const latlng = new google.maps.LatLng(center.latitude, center.longitude);
    this.map_ins.panTo(latlng);
    this.map_ins.setZoom(scale);
}

mapGoogleMaps.prototype.makeStreetviewImgUrl = function(coordinate, heading) {
    const url_base = "https://maps.googleapis.com/maps/api/streetview";
    var parameters = "size=96x96&fov=90&heading=" + heading + "&pitch=10&location=" + coordinate.latitude + "," + coordinate.longitude;
    if (config.apiKey.googlemap) {
        parameters += "&key=" + config.apiKey.googlemap;
    }

    return url_base + "?" + parameters;
};

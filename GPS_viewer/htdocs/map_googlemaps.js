var mapGoogleMaps = function() {
    this.panorama = null;
    this.init_position = new google.maps.LatLng(35.6580939,139.7413553);  // 日本緯度経度原点
    this.startMarker = null;
    this.endMarker = null;

    this.panorama_options = {
      position: this.init_position,  // 初期位置
      pov: {
        heading: 180,
        pitch: -5
      },
      motionTracking: false
    };
};

mapGoogleMaps.prototype.setStartEndMarker = function(map_ins, start_latlng, end_latlng) {
    const StartMarkerOptions = {
        position: start_latlng,
        icon: START_MARKER_ICON,
        map: map_ins,
        title: "Start Point"
    };
    this.startMarker = new google.maps.Marker(StartMarkerOptions);

    const EndMarkerOptions = {
        position: end_latlng,
        icon: END_MARKER_ICON,
        map: map_ins,
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

var mapPlaybackRoute = function(m) {
    this.ins_map = m;  // GoogleMapインスタンス
    this.marker = null;
    this.playing = false;
    this.pos_index = 0;
    this.distance_from_last_streetview = 0;
    this.behavior_after_samples = 0;
    this.last_lat = NaN;
    this.last_lng = NaN;

    this.info = null;
    this.info_opened = false;
};

mapPlaybackRoute.prototype._showInfoWindow = function(map, latlng, message) {
    if (!latlng || !message) {
        return;
    }

    this.info = this.info || new google.maps.InfoWindow();
    this.info.setPosition(latlng);
    this.info.setContent('<div style="color: #202020">' + message + '</div>');
    if (this.info_opened === false) {
        this.info.open(map);
        this.info_opened = true;
    }
};

mapPlaybackRoute.prototype._hideInfoWindow = function() {
    if (this.info) {
        this.info.close();
        this.info = null;
    }
    this.info_opened = false;
};

mapPlaybackRoute.prototype.isPlaying = function() {
    return this.playing;
}

mapPlaybackRoute.prototype.start = function(tracks, start_index, end_index) {
    var self = this;

    var moveMarker = function() {
        var p = tracks[self.pos_index];
        if (p) {
            var latlng = self.marker.getPosition();
            if (isValidLatLng(p.coordinate) === true) {
                latlng = new google.maps.LatLng(p.coordinate.latitude, p.coordinate.longitude);
                self.marker.setPosition(latlng);
            }
            self._showEventBalloon(p, latlng);
            self._refresh(tracks, latlng);

            self.pos_index++;
            if (self.pos_index < end_index) {
                const next_wait = self._getPlaybackNextWait(p.datetime, tracks[self.pos_index].datetime);
                setTimeout(moveMarker, next_wait);
            } else {
                self.hidePlaybackInfo();
                self._showInfoWindow(map, latlng, "走行終了");
                map_range_slider.setPlaybackPositionVisible(false);
                self.playing = false;
            }
        } else {
            self.playing = false;
        }
    };

    if (!tracks || this.playing === true) {
        this.stop(); // かり
        return;
    }
    this.playing = true;

    this._init(tracks, start_index, end_index);
    moveMarker();
};

mapPlaybackRoute.prototype.stop = function() {
    this.pos_index = tracks.length || 0;
    this.hidePlaybackInfo();
    map_range_slider.setPlaybackPositionVisible(false);
    this._hideInfoWindow();

    if (this.playing === true) {
        this.marker.setVisible(false);
        this.marker = null;
        this.playing = false;
    }
};

mapPlaybackRoute.prototype.showPlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'inline';
};

mapPlaybackRoute.prototype.hidePlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'none';
};

mapPlaybackRoute.prototype.outputPlaybackInfo = function(p, diff_p) {
    const gps_status_mes = ["不明", "良好", "低下", "悪い"];
    var content = "【再生中】<br>";
    content += p.datetime + "<br>";
    if (isValidLatLng(p.coordinate) === true) {
        var gps_level = getPositionLevel(p.horizontal_accuracy, p.vertical_accuracy);
        content += "GPS感度: " + gps_status_mes[gps_level] + "<br>";
        content += "進行方向: " + diff_p.direction + "<br>";

        if (gps_level === 0 || gps_level === 1) {
            content += "高低差: " + makeAltitudeDiffText(diff_p.altitude) + "<br>";
        } else {
            content += "高低差: GPS感度低下のため無効<br>";
        }

        content += "速度: " + makeSpeedText(p.speed, diff_p.speed) + "<br>";
    } else {
        content += "無効な位置情報のため更新されません";
    }
    document.getElementById('playback_status').innerHTML = content;
};

mapPlaybackRoute.prototype._setupView = function(tracks, start_index, end_index) {
    // マップの表示を変える (好み)
    this.ins_map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
    if (this.ins_map.getZoom() < 17) {
        this.ins_map.setZoom(17);
    }

    this.marker = this.marker || new mapCarMarker(this.ins_map);
    this.marker.setVisible(true);

    this._setCenterToFirstPosition(tracks, start_index, end_index);
    map_range_slider.setPlaybackPositionVisible(true);

    this.showPlaybackInfo();
};

mapPlaybackRoute.prototype._setCenterToFirstPosition = function(tracks, start_index, end_index) {
    for (var i=start_index; i<end_index; i++) {
        const p = tracks[i];
        if (p && isValidLatLng(p.coordinate) === true) {
            const latlng = new google.maps.LatLng(p.coordinate.latitude, p.coordinate.longitude);
            this.ins_map.setCenter(latlng);
            break;
        }
    }
};

mapPlaybackRoute.prototype._init = function(tracks, start_index, end_index) {
    this.distance_from_last_streetview = 0;
    this.behavior_after_samples = 0;
    this.last_lat = NaN;
    this.last_lng = NaN;

    this.pos_index = start_index;
    this._setupView(tracks, start_index, end_index);
};

mapPlaybackRoute.prototype._refresh = function(tracks, latlng) {
    const p = tracks[this.pos_index];
    const diff_p = getPositionDifference(tracks, this.pos_index, 10)
    this.outputPlaybackInfo(p, diff_p);
    this._followStreetview(p, diff_p, latlng);
    this.ins_map.setCenter(latlng);

    const past_pos = this.pos_index > 100 ? this.pos_index - 100 : 0;
    mapGraph.plot(tracks, past_pos, this.pos_index);

    map_range_slider.setPlaybackPosition(Math.floor((this.pos_index / tracks.length) * 1000));

    this.last_lat = p.coordinate.latitude;
    this.last_lng = p.coordinate.longitude;
};

mapPlaybackRoute.prototype._followStreetview = function(p, diff_p, latlng) {
    if (getPositionLevel(p.horizontal_accuracy, p.vertical_accuracy) > 1) { // GPS低下or悪い
        return;
    }

    this.distance_from_last_streetview += getDistHubeny(p.coordinate, {latitude: this.last_lat, longitude: this.last_lng}, WGS84);
    if (isNaN(diff_p.azimuth) === false) {
        if (this.distance_from_last_streetview > 60 || (p.speed && p.speed < 1.0 && this.distance_from_last_streetview > 10)) {
            // 60m離れるか、速度0になった位置で更新
            map_googlemaps.setPanoramaPosition(latlng, diff_p.azimuth);
            this.distance_from_last_streetview = 0;
        }
    }
};

mapPlaybackRoute.prototype._showEventBalloon = function(p, latlng) {
    if (p.scene && p.scene === "stop") {
        this._showInfoWindow(this.ins_map, latlng, config.title.scene.stop);
        this.behavior_after_samples = 0;
    } else if (p.behavior && p.behavior !== 0) {
        this._showInfoWindow(this.ins_map, latlng, makeEventTitle(p.behavior));
        this.behavior_after_samples = 30;
    } else {
        if (this.behavior_after_samples === 0) {
            this._hideInfoWindow();
        } else {
            this.info.setPosition(latlng);
            this.behavior_after_samples--;
        }
    }
};

mapPlaybackRoute.prototype._getPlaybackNextWait = function(start_datetime, end_datetime) {
    var next_wait = 100;
    const s = getDateFromDatetimeString(start_datetime);
    const e = getDateFromDatetimeString(end_datetime);

    if (isNaN(s) === false && isNaN(e) === false) {
        const pb_speed_elem = document.getElementById('playback_speed');
        if (pb_speed_elem && pb_speed_elem.value) {
            next_wait = (e - s) / pb_speed_elem.value;
        } else {
            next_wait = e - s;
        }
    }

    return next_wait;
};

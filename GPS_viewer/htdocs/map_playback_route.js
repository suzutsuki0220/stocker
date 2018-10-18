var mapPlaybackRoute = function(m) {
    this.ins_map = m;  // GoogleMapインスタンス
    this.marker = null;
    this.playing = false;
    this.pos_index = 0;
    this.distance_from_last_streetview = 0;
    this.last_lat = NaN;
    this.last_lng = NaN;

    this.info = null;
    this.info_opened = false;
};

mapPlaybackRoute.prototype._showInfoWindow = function(map, latlng, message) {
    if (!latlng || !message) {
        return;
    }

    if (this.info === null) {
        this.info = new google.maps.InfoWindow();
    }
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

mapPlaybackRoute.prototype.start = function(positions, start_index, end_index) {
    this.pos_index = start_index;
    var self = this;
    var behavior_after_samples = 0;
    this.last_lat = NaN;
    this.last_lng = NaN;

    var showEventBalloon = function(p, latlng, map) {
        if (p.scene && p.scene === "stop") {
            self._showInfoWindow(map, latlng, config.title.scene.stop);
            behavior_after_samples = 0;
        } else if (p.behavior && p.behavior !== 0) {
            self._showInfoWindow(map, latlng, makeEventTitle(p.behavior));
            behavior_after_samples = 30;
        } else {
            if (behavior_after_samples === 0) {
                self._hideInfoWindow();
            } else {
                self.info.setPosition(latlng);
                behavior_after_samples--;
            }
        }
    };

    var moveMarker = function(marker, map) {
        var p = positions[self.pos_index];
        if (p) {
            var latlng;
            if (isValidLatLng(p.latitude, p.longitude) === true) {
                latlng = new google.maps.LatLng(p.latitude, p.longitude);
                marker.setPosition(latlng);
                map.setCenter(latlng);
            } else {
                latlng = marker.getPosition();
            }
            showEventBalloon(p, latlng, map);

            var diff_p = getPositionDifference(positions, self.pos_index, 10)
            self.outputPlaybackInfo(p, diff_p);
            self._followStreetview(p, diff_p, latlng);

            const past_pos = self.pos_index > 100 ? self.pos_index - 100 : 0;
            plotAcceleration(positions, past_pos, self.pos_index);

            self.pos_index++;
            if (self.pos_index < end_index) {
                const next_wait = self._getPlaybackNextWait(p.datetime, positions[self.pos_index].datetime);
                map_range_slider.setPlaybackPosition(Math.floor((self.pos_index / positions.length) * 1000));
                setTimeout(function(){moveMarker(marker, map);}, next_wait);
            } else {
                self.hidePlaybackInfo();
                self._showInfoWindow(map, latlng, "走行終了");
                map_range_slider.setPlaybackPositionVisible(false);
                self.playing = false;
            }

            self.last_lat = p.latitude;
            self.last_lng = p.longitude;
        } else {
            self.playing = false;
        }
    };

    var getFirstPosition = function(positions, start_index, end_index) {
        for (var i=start_index; i<end_index; i++) {
            const p = positions[i];
            if (isValidLatLng(p.latitude, p.longitude) === true) {
                return new google.maps.LatLng(p.latitude, p.longitude);
            }
        }
        return null;
    };

    if (this.playing === true) {
        this.stop(); // かり
        return;
    }

    if (positions) {
        // マップの表示を変える (好み)
        this.ins_map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
        if (this.ins_map.getZoom() < 17) {
            this.ins_map.setZoom(17);
        }

        if (this.marker === null) {
            this.marker = new mapCarMarker(this.ins_map);
        }

        const start_latlng = getFirstPosition(positions, start_index, end_index);
        if (start_latlng !== null) {
            map.setCenter(start_latlng);
        }

        map_range_slider.setPlaybackPositionVisible(true);
        moveMarker(this.marker, this.ins_map);
        this.showPlaybackInfo();
        this.marker.setVisible(true);
        this.playing = true;
    }
};

mapPlaybackRoute.prototype.stop = function() {
    this.pos_index = positions.length;
    this.hidePlaybackInfo();
    map_range_slider.setPlaybackPositionVisible(false);
    this._hideInfoWindow();

    if (this.playing === false) {
        return;
    }

    this.marker.setVisible(false);
    this.marker = null;
    this.playing = false;
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
    if (isValidLatLng(p.latitude, p.longitude) === true) {
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

mapPlaybackRoute.prototype._followStreetview = function(p, diff_p, latlng) {
    if (getPositionLevel(p.horizontal_accuracy, p.vertical_accuracy) > 1) { // GPS低下or悪い
        return;
    }

    this.distance_from_last_streetview += getDistHubeny(p.latitude, p.longitude, this.last_lat, this.last_lng, WGS84);
    if (isNaN(diff_p.azimuth) === false) {
        if (this.distance_from_last_streetview > 60 || (p.speed && p.speed < 1.0 && this.distance_from_last_streetview > 10)) {
            // 60m離れるか、速度0になった位置で更新
            setPanoramaPosition(latlng, diff_p.azimuth);
            this.distance_from_last_streetview = 0;
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

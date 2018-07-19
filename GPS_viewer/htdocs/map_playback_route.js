var mapPlaybackRoute = function(m) {
    this.ins_map = m;  // GoogleMapインスタンス
    this.marker = null;
    this.started = false;
};

mapPlaybackRoute.prototype.start = function(positions, index) {
    var pos_index = index;
    var info = null;
    var info_opened = false;
    var showInfoWindow = function(map, latlng, message) {
        if (info === null) {
            info = new google.maps.InfoWindow();
        }
        info.setPosition(latlng);
        info.setContent('<div style="color: #202020">' + message + '</div>');
        if (info_opened === false) {
            info.open(map);
            info_opened = true;
        }
    };
    var hideInfoWindow = function() {
        if (info) {
            info.close();
            info = null;
        }
        info_opened = false;
    };
    var moveMarker = function(marker, map) {
        var p = positions[pos_index];
        if (p) {
            var latlng = new google.maps.LatLng(p.latitude, p.longitude);

            marker.setPosition(latlng);
            map.panTo(latlng);
            if (p.scene && p.scene === "stop") {
                showInfoWindow(map, latlng, "停止中");
            } else {
                hideInfoWindow();
            }

            pos_index++;
            if (pos_index < positions.length) {
                setTimeout(function(){moveMarker(marker, map);}, 100);
            } else {
                showInfoWindow(map, latlng, "走行終了");
                this.started = false;
            }
        } else {
            this.started = false;
        }
    };

    if (this.started === true) {
        this.stop(); // かり
        return;
    }

    // マップの表示を変える (好み)
    this.ins_map.setMapTypeId('satellite');
    this.ins_map.setZoom(17);

    if (this.marker === null) {
        this.marker = new mapCarMarker(this.ins_map);
    }

    moveMarker(this.marker, this.ins_map);
    this.marker.setVisible(true);
    this.started = true;
};

mapPlaybackRoute.prototype.stop = function() {
    pos_index = positions.length;

    if (this.started === false) {
        return;
    }

    this.marker.setVisible(false);
    this.marker = null;
    this.started = false;
}

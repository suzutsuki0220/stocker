var mapCarMarker = function(m) {
    this.ins_map = m;
    this.ins_car_mark = null;
    this.marker_position = null;
};

/* 位置を移動する */
mapCarMarker.prototype.setPosition = function(latlng) {
    this.marker_position = latlng;

    if (this.ins_car_mark !== null) {
        this.ins_car_mark.setPosition(this.marker_position);
    }
};

mapCarMarker.prototype.getPosition = function() {
    if (this.ins_car_mark === null) {
        return null;
    }
    return this.ins_car_mark.getPosition();
};

mapCarMarker.prototype.setVisible = function(sw) {
    if (sw === true) {
        if (this.ins_car_mark === null) {
            var latlng = this.marker_position;
            if (this.marker_position === null) {
                latlng = this.ins_map.getCenter();
            }
            const markerImage = {
                url: CAR_MARKER_ICON,
                size: new google.maps.Size(48,48),  // マーカー画像サイズ
                origin: new google.maps.Point(0,0),
                anchor: new google.maps.Point(24,24),
            };
            const options = {
                icon: markerImage,
                map: this.ins_map,
                position: latlng,
            };
            this.ins_car_mark = new google.maps.Marker(options);
        }
    } else {
        this.ins_car_mark.setMap(null);
        this.ins_car_mark = null;
    }
};

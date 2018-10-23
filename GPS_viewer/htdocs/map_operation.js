var mapOperation = function() {
    this.lat_max = 0;
    this.lat_min = 0;
    this.lng_max = 0;
    this.lng_min = 0;
};

mapOperation.prototype.resetLatLngMinMax = function() {
    this.lat_min = 0;
    this.lng_min = 0;
    this.lat_max = 0;
    this.lng_max = 0;
}

mapOperation.prototype.setLatLngMinMax = function(lat, lng) {
    if (this.lat_min === 0 || this.lat_min > lat) {
        this.lat_min = lat;
    }
    if (this.lat_max === 0 || this.lat_max < lat) {
        this.lat_max = lat;
    }
    if (this.lng_min === 0 || this.lng_min > lng) {
        this.lng_min = lng;
    }
    if (this.lng_max === 0 || this.lng_max < lng) {
        this.lng_max = lng;
    }
}
mapOperation.prototype.getMapScale = function() {
    var distance = Math.sqrt(Math.pow(this.lat_max - this.lat_min, 2) + Math.pow(this.lng_max - this.lng_min, 2));

    const operand = [
        {distance: 0.0001, ret_val: 19},
        {distance: 0.001,  ret_val: 18},
        {distance: 0.002,  ret_val: 17},
        {distance: 0.01,   ret_val: 15},
        {distance: 0.1,    ret_val: 12},
        {distance: 0.2,    ret_val: 11},
        {distance: 0.7,    ret_val: 10},
        {distance: 1.2,    ret_val:  8},
        {distance: 5.0,    ret_val:  7},
        {distance: 15,     ret_val:  4}
    ];

    var ret = 3;
    for (var i=0; i<operand.length; i++) {
        if (distance < operand[i].distance) {
            ret = operand[i].ret_val;
            break;
        }
    }

    return ret;
};

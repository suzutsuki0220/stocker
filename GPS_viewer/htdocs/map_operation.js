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
};

mapOperation.prototype.setLatLngMinMax = function(coordinate) {
    if (this.lat_min === 0 || this.lat_min > coordinate.latitude) {
        this.lat_min = coordinate.latitude;
    }
    if (this.lat_max === 0 || this.lat_max < coordinate.latitude) {
        this.lat_max = coordinate.latitude;
    }
    if (this.lng_min === 0 || this.lng_min > coordinate.longitude) {
        this.lng_min = coordinate.longitude;
    }
    if (this.lng_max === 0 || this.lng_max < coordinate.longitude) {
        this.lng_max = coordinate.longitude;
    }
};

mapOperation.prototype.getCenterLatlng = function() {
    var ave_coord = new Object();
    ave_coord.latitude  = (map_operation.lat_min + map_operation.lat_max) / 2;
    ave_coord.longitude = (map_operation.lng_min + map_operation.lng_max) / 2;

    return ave_coord;
};

// 緯度経度の最小値、最大値から全体が見渡せるスケールを返す
mapOperation.prototype.getCentralScale = function() {
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

var mapOperation = function() {
    this.lat = new Object();
    this.lng = new Object();
};

mapOperation.prototype.resetLatLngMinMax = function() {
    this.lat.min = NaN;
    this.lng.min = NaN;
    this.lat.max = NaN;
    this.lng.max = NaN;
};

mapOperation.prototype.setLatLngMinMax = function(coordinate) {
    var setMinMax = function(value, obj) {
        obj.min = isNaN(obj.min) ? value : (obj.min > value ? value : obj.min);
        obj.max = isNaN(obj.max) ? value : (obj.max < value ? value : obj.max);
    };

    setMinMax(coordinate.latitude, this.lat);
    setMinMax(coordinate.longitude, this.lng);
};

mapOperation.prototype.getCenterLatlng = function() {
    var ave_coord = new Object();
    ave_coord.latitude  = (this.lat.min + this.lat.max) / 2;
    ave_coord.longitude = (this.lng.min + this.lng.max) / 2;

    return ave_coord;
};

// 緯度経度の最小値、最大値から全体が見渡せるスケールを返す
mapOperation.prototype.getCentralScale = function() {
    const distance = Math.sqrt(Math.pow(this.lat.max - this.lat.min, 2) + Math.pow(this.lng.max - this.lng.min, 2));

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

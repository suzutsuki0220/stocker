// 正規表現パターン
var gpsNmea = function() {
    this.position = new Array();
    this.re_degree = /(\d+)(\d\d\.\d+)/;

    this.sentence_parser = [
        {pattern: /^\$G[PN]RMC/, func: this._getRMC},  // essential gps pvt (position, velocity, time) data
        {pattern: /^\$G[PN]GGA/, func: this._getGGA},  // essential fix data
        {pattern: /^\$G[PN]GSA/, func: this._getGSA},  // accuracy
        {pattern: /^\$G[PN]VTG/, func: this._getVTG},  // Track made good, speed
        {pattern: /^\$GSENSOR/ , func: this._getGSENSOR}  // G-sensor (DriveRecorder proprietary format)
    ];

    this._speed = NaN;
    this._gsensor = null;
    this._altitude = NaN;
    this._h_accuracy = NaN;
    this._v_accuracy = NaN;
};

gpsNmea.prototype.get = function(data) {
    var self = this;
    var parseNmeaLine = function(nmea) {
        var checksum = "";
        const checksum_pos = nmea.indexOf('*');
        if (checksum_pos > 0) {
            checksum = nmea.substring(checksum_pos + 1);  // TODO: checksum判定は未実装
            nmea = nmea.substring(0, checksum_pos);
        }

        for (var i=0; i<self.sentence_parser.length; i++) {
            if (self.sentence_parser[i].pattern.test(nmea)) {
                self.sentence_parser[i].func(self, nmea);
            }
        }
    };

    gpsCommon.parseEachLines(data, parseNmeaLine);
};

gpsNmea.prototype._getRMC = function(self, sentence) {
    var col = sentence.split(",");
    if (!col || col.length <= 10) {
        return;
    }

    const time_str = col[1];
    const date_str = col[9];

    if (col[2] === "A") {  // sentence status OK
        var position = new Object();
        position.datetime  = self._makeNmeaDateTime(date_str, time_str);
        position.latitude  = self._getDegree(col[3], col[4] === "S");
        position.longitude = self._getDegree(col[5], col[6] === "W");
        self._addHoldData(position);
        self._clearHoldData();

        gpsCommon.positions.push(position);
    }
};

gpsNmea.prototype._getVTG = function(self, sentence) {
    var col = sentence.split(",");
    if (col && col.length > 8) {
        if (col[8].substring(0, 1) === "K") {
            self._speed = parseFloat(col[7]);
        }
    }
};

gpsNmea.prototype._getGSA = function(self, sentence) {
    var col = sentence.split(",");
    if (col && col.length > 6) {
        self._h_accuracy = parseFloat(col[col.length - 2]);
        self._v_accuracy = parseFloat(col[col.length - 1]);
    }
};

gpsNmea.prototype._getGGA = function(self, sentence) {
    var col = sentence.split(",");
    if (col && col.length > 9) {
        if (col[10] === 'M') {
            self._altitude = parseFloat(col[9]);
        }
    }
};

gpsNmea.prototype._getGSENSOR = function(self, sentence) {
    var col = sentence.split(",");
    if (col && col.length === 4) {
        self._gsensor = gpsCommon.getXYZvalue(col, 0);
    }
};

gpsNmea.prototype._addHoldData = function(obj) {
    if (isNaN(this._speed) === false) {
        obj.speed = this._speed;
    }

    if (isNaN(this._altitude) === false) {
        obj.altitude = this._altitude;
    }

    if (this._gsensor) {
        obj.est = this._gsensor;
    } 

    if (isNaN(this._h_accuracy) === false) {
        obj.horizontal_accuracy = this._h_accuracy;
    }

    if (isNaN(this._v_accuracy) === false) {
        obj.vertical_accuracy = this._v_accuracy;
    }
};

gpsNmea.prototype._clearHoldData = function() {
    this._speed = NaN;
    this._altitude = NaN;
    delete this._gsensor;
    this._gsensor = null;
    this._h_accuracy = NaN;
    this._v_accuracy = NaN;
};

gpsNmea.prototype._getDegree = function(fraction, minus) {
    var ret = 0;

    if (fraction) {
        const d = parseFloat(fraction.replace(this.re_degree, "$1"));
        const m = parseFloat(fraction.replace(this.re_degree, "$2"));
        ret = minus ? (d + m / 60) * -1.0 : (d + m / 60);
    }

    return ret;
};

gpsNmea.prototype._makeNmeaDateTime = function(date_str, time_str) {
    var year   = "20" + date_str.substring(4, 6);
    var month  = date_str.substring(2, 4);
    var day    = date_str.substring(0, 2);
    var hour   = time_str.substring(0, 2);
    var minute = time_str.substring(2, 4);
    var second = time_str.substring(4);
    if (second.indexOf(".") < 0) {
        second = second + ".000";
    }

    // ex. 2018/04/14 03:48:29.002
    return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
};

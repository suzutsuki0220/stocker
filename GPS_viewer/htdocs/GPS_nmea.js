// 正規表現パターン
var gpsNmea = function() {
    this.position = new Array();
    this.re_degree = /(\d+)(\d\d\.\d+)/;
    this.re_rmc = /^\$G[PN]RMC/;  // essential gps pvt (position, velocity, time) data
    this.re_gga = /^\$G[PN]GGA/;  // essential fix data
    this.re_gsa = /^\$G[PN]GSA/;  // accuracy
    this.re_vtg = /^\$G[PN]VTG/;  // Track made good, speed
    this.re_gsensor = /^\$GSENSOR/;  // G-sensor (DriveRecorder proprietary format)

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

        if (self.re_rmc.test(nmea)) {
            self._getRMC(nmea);
        } else if (self.re_vtg.test(nmea)) {
            self._getVTG(nmea);
        } else if (self.re_gsa.test(nmea)) {
            self._getGSA(nmea);
        } else if (self.re_gga.test(nmea)) {
            self._getGGA(nmea);
        } else if (self.re_gsensor.test(nmea)) {
            self._getGSENSOR(nmea);
        }
    };

    gpsCommon.parseEachLines(data, parseNmeaLine);
};

gpsNmea.prototype._getRMC = function(sentence) {
    var col = sentence.split(",");
    if (!col || col.length <= 10) {
        return;
    }

    const time_str = col[1];
    const date_str = col[9];

    if (col[2] === "A") {  // sentence status OK
        var position = new Object();
        position.datetime  = this._makeNmeaDateTime(date_str, time_str);
        position.latitude  = this._getDegree(col[3], col[4] === "S");
        position.longitude = this._getDegree(col[5], col[6] === "W");
        this._addHoldData(position);

        gpsCommon.positions.push(position);
    }
};

gpsNmea.prototype._getVTG = function(sentence) {
    var col = sentence.split(",");
    if (col && col.length > 8) {
        if (col[8].substring(0, 1) === "K") {
            this._speed = parseFloat(col[7]);
        }
    }
};

gpsNmea.prototype._getGSA = function(sentence) {
    var col = sentence.split(",");
    if (col && col.length > 6) {
        _h_accuracy = parseFloat(col[col.length - 2]);
        _v_accuracy = parseFloat(col[col.length - 1]);
    }
};

gpsNmea.prototype._getGGA = function(sentence) {
    var col = sentence.split(",");
    if (col && col.length > 9) {
        if (col[10] === 'M') {
          _altitude = parseFloat(col[9]);
        }
    }
};

gpsNmea.prototype._getGSENSOR = function(sentence) {
    var col = sentence.split(",");
    if (col && col.length === 4) {
        this._gsensor = gpsCommon.getXYZvalue(col, 0);
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

    this._clearHoldData();
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

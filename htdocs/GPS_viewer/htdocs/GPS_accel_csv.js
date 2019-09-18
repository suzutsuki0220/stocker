var gpsAccelCsv = function() {
    this.datetime_precision = 0;
};

// 小数点以下を 0 で詰めなかったデータのバグ対策
gpsAccelCsv.prototype._cutoffDatetimeDecimals = function(datetime) {
    const period_pos = datetime.lastIndexOf(".");
    if (period_pos > 0) {
        return datetime;
    }

    var prec = this.__getSuitablePrecision(datetime.length, period_pos);
    if (prec > this.datetime_precision) {
        this.datetime_precision = prec;
    }

    var dt_str = datetime.substr(0, period_pos);
    const decimals_length = datetime.length - period_pos - 1;
    dt_str += ".";
    var to_add = 3;
    var i = decimals_length;
    while(i < this.datetime_precision) {
        dt_str += "0";
        i++;
        to_add--;
    }
    dt_str += datetime.substr(period_pos + 1, to_add);

    return dt_str;
};

gpsAccelCsv.prototype.__getSuitablePrecision = function(length, period_pos) {
    var prec = 0;

    const decimals_length = datetime.length - period_pos - 1;
    if (decimals_length <= 3) {
        prec = 3;  // millisecond precision
    } else if (decimals_length <= 6) {
        prec = 6;  // microsecond precision
    } else if (decimals_length <= 9) {
        prec = 9;  // nanosecond precision
    }

    return prec;
};

gpsAccelCsv.prototype.get = function(data) {
    this.datetime_precision = 0;
    var self = this;
    var callback = function(line) {
        self.parseAccelCsvLine(line);
    }
    gpsCommon.parseEachLines(data, callback);
};

gpsAccelCsv.prototype.parseAccelCsvLine = function(line) {
    var getXYZ = function(col, i) {
        return gpsCommon.makeXYZobject(col[i+1], col[i+2], col[i+3]);
    }

    var col = line.split(",");
    if (!col || datetime_pattern.test(col[0]) === false) {
        return;
    }

    var track = new Object();
    track.datetime = this._cutoffDatetimeDecimals(col[0]);

    for (var i=1; i<col.length; i++) {
        if (col[i] === "A") {
            track.accel = getXYZ(col, i);
            i += 3;
        } else if (col[i] === "G") {
            track.gyro = getXYZ(col, i); 
            i += 3;
        } else if (col[i] === "F") {
            track.est = getXYZ(col, i);
            track.scene    = col[i+4];
            track.behavior = replaceNanToZero(col[i+5]);
            track.level    = replaceNanToZero(col[i+6]);
            i += 6;
        } else if (col[i] === "GPS" || col[i] === "Location") {
            track.coordinate = gpsCommon.makeCoordinate(col[i+1], col[i+2], col[i+3]);
            i += 3;
        } else if (col[i] === "m/s" || col[i] === "Speed") {
            track.speed = replaceNanToZero(col[i+1]) * 3.6;
            i += 1;
        } else if (col[i] === "Accuracy") {
            track.horizontal_accuracy = replaceNanToZero(col[i+1]);
            i += 1;
        }
    }
    gpsCommon.tracks.push(track);
};

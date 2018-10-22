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
    var col = line.split(",");
    if (!col) {
        return;
    }

    if (datetime_pattern.test(col[0]) === false) {
        return;
    }

    var position = new Object();
    position.datetime = this._cutoffDatetimeDecimals(col[0]);

    for (var i=1; i<col.length; i++) {
        if (col[i] === "A") {
            position.accel = gpsCommon.getXYZvalue(col, i);
            i += 3;
        } else if (col[i] === "G") {
            position.gyro = gpsCommon.getXYZvalue(col, i); 
            i += 3;
        } else if (col[i] === "F") {
            position.est = gpsCommon.getXYZvalue(col ,i);
            position.scene    = col[i+4];
            position.behavior = col[i+5] ? parseInt(col[i+5].trim()) : 0;
            position.level    = col[i+6] ? parseInt(col[i+6].trim()) : 0;
            i += 6;
        } else if (col[i] === "GPS" || col[i] === "Location") {
            position.latitude  = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
            position.longitude = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
            position.altitude  = col[i+3] ? parseFloat(col[i+3].trim()) : 0;
            i += 3;
        } else if (col[i] === "m/s" || col[i] === "Speed") {
            position.speed = col[i+1] ? parseFloat(col[i+1].trim()) * 3.6 : 0;
            i += 1;
        } else if (col[i] === "Accuracy") {
            position.horizontal_accuracy = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
            i += 1;
        }
    }
    gpsCommon.positions.push(position);
};

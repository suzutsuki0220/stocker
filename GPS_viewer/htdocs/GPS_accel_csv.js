var datetime_precision;

function getPositionAccelCsv(data) {
    var position = [];
    var sp, ep;

    datetime_precision = 0;
    sp = 0;
    while((ep = data.indexOf("\n", sp)) != -1) {
        var line = data.substring(sp, ep);
        var p = parseAccelCsvLine(line);
        if (p != null) {
          position.push(p);
        }
        sp = ep + 1;
    }
    if (sp < data.length) {  // 最後の行(改行で終わっていない)
        var line = data.substring(sp);
        var p = parseAccelCsvLine(line);
        if (p != null) {
          position.push(p);
        }
    }

    return position;
}

function parseAccelCsvLine(line) {
    // 小数点以下を 0 で詰めなかったデータのバグ対策
    var cutoffDatetimeDecimals = function(datetime) {
        var prec = 0;
        const period_pos = datetime.lastIndexOf(".");
        if (period_pos > 0) {
            const decimals_length = datetime.length - period_pos - 1;
            if (decimals_length <= 3) {
                prec = 3;  // millisecond precision
            } else if (decimals_length <= 6) {
                prec = 6;  // microsecond precision
            } else if (decimals_length <= 9) {
                prec = 9;  // nanosecond precision
            }
        }
        if (prec > datetime_precision) {
            datetime_precision = prec;
        }
        if (period_pos > 0) {
            var i, to_add;
            var dt_str = datetime.substr(0, period_pos);
            const decimals_length = datetime.length - period_pos - 1;
            dt_str += ".";
            to_add = 3;
            i = decimals_length;
            while(i < datetime_precision) {
                dt_str += "0";
                i++;
                to_add--;
            }
            dt_str += datetime.substr(period_pos + 1, to_add);
            return dt_str;
        }
        return datetime;
    };
    var getXYZvalue = function(col, i) {
        var ret = new Object();
        ret.x = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
        ret.y = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
        ret.z = col[i+3] ? parseFloat(col[i+3].trim()) : 0;

        return ret;
    };

    var col = line.split(",");
    if (col) {
        var position = new Object();

        position.datetime = col[0];
        if (datetime_pattern.test(position.datetime) === false) {
            return null;
        }
        position.datetime = cutoffDatetimeDecimals(position.datetime);

        for (var i=1; i<col.length; i++) {
            if (col[i] === "A") {
                position.accel = getXYZvalue(col, i);
                i += 3;
            } else if (col[i] === "G") {
                position.gyro = getXYZvalue(col, i); 
                i += 3;
            } else if (col[i] === "F") {
                position.est = getXYZvalue(col ,i);
                position.scene = col[i+4];
                position.behavior = col[i+5] ? parseInt(col[i+5].trim()) : 0;
                position.level = col[i+6] ? parseInt(col[i+6].trim()) : 0;
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

        return position;
    }

    return null;
}

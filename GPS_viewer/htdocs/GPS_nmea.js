// 正規表現パターン
var re_degree = /(\d+)(\d\d\.\d+)/;
var re_rmc = /^\$G[PN]RMC/;  // essential gps pvt (position, velocity, time) data
var re_gga = /^\$G[PN]GGA/;  // essential fix data
var re_gsa = /^\$G[PN]GSA/;  // accuracy
var re_vtg = /^\$G[PN]VTG/;  // Track made good, speed
var re_gsensor = /^\$GSENSOR/;  // G-sensor (DriveRecorder proprietary format)

var _speed = NaN;
var _accelX = NaN;
var _accelY = NaN;
var _accelZ = NaN;
var _altitude = NaN;
var _h_accuracy = NaN;
var _v_accuracy = NaN;

function getPositionEmea(data) {
    var position = [];
    var sp, ep;

    sp = 0;
    while((ep = data.indexOf("\n", sp)) != -1) {
        var line = data.substring(sp, ep);
        var p = parseNmeaLine(line);
        if (p != null) {
            addHoldData(p);
            position.push(p);
        }
        sp = ep + 1;
    }
    if (sp < data.length) {  // 最後の行(改行で終わっていない)
        var line = data.substring(sp);
        var p = parseNmeaLine(line);
        if (p != null) {
            addHoldData(p);
            position.push(p);
        }
    }

    return position;
}

function parseNmeaLine(nmea) {
    var checksum = "";
    var checksum_pos = nmea.indexOf('*');
    if (checksum_pos > 0) {
        checksum = nmea.substring(checksum_pos + 1);
        nmea = nmea.substring(0, checksum_pos);
    }

    if (re_rmc.test(nmea)) {
        return getRMC(nmea);
    } else if (re_vtg.test(nmea)) {
        getVTG(nmea);
    } else if (re_gsa.test(nmea)) {
        getGSA(nmea);
    } else if (re_gga.test(nmea)) {
        getGGA(nmea);
    } else if (re_gsensor.test(nmea)) {
        getGSENSOR(nmea);
    }

    return null;
}

function getRMC(sentence)
{
    var status = false;
    var date_str, time_str;
    var col = sentence.split(",");
    if (col && col.length > 10) {
        var position = new Object();
        time_str = col[1];
        date_str = col[9];

        if (col[2] === "A") {
            status = true;
        }
        position.latitude  = col[3] ? getDegree(col[3]) : 0;
        if (col[4] === "S") {
            position.latitude = position.latitude * -1.0;
        }
        position.longitude = col[5] ? getDegree(col[5]) : 0;
        if (col[6] === "W") {
            position.longitude = position.longitude * -1.0;
        }

        if (status === true) {
            position.datetime = makeNmeaDateTime(date_str, time_str);
            return position;
        } else {
            return null;
        }
    }
}

function getVTG(sentence)
{
    var col = sentence.split(",");
    if (col && col.length > 8) {
        if (col[8].substring(0, 1) === "K") {
            _speed = parseFloat(col[7]);
        }
    }
}

function getGSA(sentence)
{
    var col = sentence.split(",");
    if (col && col.length > 6) {
        _h_accuracy = parseFloat(col[col.length - 2]);
        _v_accuracy = parseFloat(col[col.length - 1]);
    }
}

function getGGA(sentence)
{
    var col = sentence.split(",");
    if (col && col.length > 9) {
        if (col[10] === 'M') {
          _altitude = parseFloat(col[9]);
        }
    }
}

function getGSENSOR(sentence)
{
    var col = sentence.split(",");
    if (col && col.length === 4) {
        _accelX = parseFloat(col[1]);
        _accelY = parseFloat(col[2]);
        _accelZ = parseFloat(col[3]);
    }
}

function addHoldData(obj) {
    if (isNaN(_speed) === false) {
        obj.speed = _speed;
    }

    if (isNaN(_altitude) === false) {
        obj.altitude = _altitude;
    }

    if (isNaN(_accelX) === false) {
        obj.est_x = _accelX;
    } 

    if (isNaN(_accelY) === false) {
        obj.est_y = _accelY;
    } 

    if (isNaN(_accelZ) === false) {
        obj.est_z = _accelZ;
    } 

    if (isNaN(_h_accuracy) === false) {
        obj.horizontal_accuracy = _h_accuracy;
    }

    if (isNaN(_v_accuracy) === false) {
        obj.vertical_accuracy = _v_accuracy;
    }

    clearHoldData();
}

function clearHoldData() {
    _speed = NaN;
    _altitude = NaN;
    _accelX = NaN;
    _accelY = NaN;
    _accelZ = NaN;
    _h_accuracy = NaN;
    _v_accuracy = NaN;
}

function getDegree(fraction) {
    var d = parseFloat(fraction.replace(re_degree, "$1"));
    var m = parseFloat(fraction.replace(re_degree, "$2"));

    return d + m / 60;
}

function makeNmeaDateTime(date_str, time_str) {
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
}

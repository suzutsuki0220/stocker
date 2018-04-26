// 正規表現パターン
var re_degree = /(\d+)(\d\d\.\d+)/;
var re_rmc = /^\$G[PN]RMC/;
var re_gga = /^\$G[PN]GGA/;

function getPositionEmea(data) {
    var position = [];
    var sp, ep;

    sp = 0;
    while((ep = data.indexOf("\n", sp)) != -1) {
        var line = data.substring(sp, ep);
        var p = parseNmeaLine(line);
        if (p != null) {
            position.push(p);
        }
        sp = ep + 1;
    }
    if (sp < data.length) {  // 最後の行(改行で終わっていない)
        var line = data.substring(sp);
        var p = parseNmeaLine(line);
        if (p != null) {
            position.push(p);
        }
    }

    return position;
}

function parseNmeaLine(nmea) {
    var status = false;

    if (re_rmc.test(nmea)) {
      var col = nmea.split(",");
      if (col) {
          var position = new Object();
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
              return position;
          } else {
              return null;
          }
      }
    }

    return null;
}

function getDegree(fraction) {
    var d = parseFloat(fraction.replace(re_degree, "$1"));
    var m = parseFloat(fraction.replace(re_degree, "$2"));

    return d + m / 60;
}


function getPositionAccelCsv(data) {
    var position = [];
    var sp, ep;

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
    var col = line.split(",");
    if (col) {
        var position = new Object();

        position.datetime = col[0];
        for (var i=1; i<col.length; i++) {
            if (col[i] === "A") {
                position.accel_x = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
                position.accel_y = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
                position.accel_z = col[i+3] ? parseFloat(col[i+3].trim()) : 0;
                i += 3;
            } else if (col[i] === "G") {
                position.gyro_x = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
                position.gyro_y = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
                position.gyro_z = col[i+3] ? parseFloat(col[i+3].trim()) : 0;
                i += 3;
            } else if (col[i] === "F") {
                position.est_x = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
                position.est_y = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
                position.est_z = col[i+3] ? parseFloat(col[i+3].trim()) : 0;
                position.scene = col[i+4];
                position.behavior = col[i+5] ? parseInt(col[i+5].trim()) : 0;
                position.level = col[i+6] ? parseInt(col[i+6].trim()) : 0;
                i += 6;
            } else if (col[i] === "GPS") {
                position.latitude  = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
                position.longitude = col[i+2] ? parseFloat(col[i+2].trim()) : 0;
                i += 2;
            } else if (col[i] === "m/s") {
                position.speed = col[i+1] ? parseFloat(col[i+1].trim()) : 0;
                i += 1;
            }
        }

        return position;
    }

    return null;
}


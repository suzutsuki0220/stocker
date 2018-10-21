var gpsCommon = new Object();

gpsCommon.positions = new Array();
gpsCommon.nmea_name_pattern = /\.(nmea)$/;
gpsCommon.accel_csv_name_pattern = /\.(accel.csv)$/;

gpsCommon.getPosition = function(text_data, name) {
    gpsCommon.positions = [];
    if (gpsCommon.nmea_name_pattern.test(name.toLowerCase())) {
        // nmeaデータ
        var parser = new gpsNmea();
        parser.get(text_data);
    } else if (gpsCommon.accel_csv_name_pattern.test(name.toLowerCase())) {
        var parser = new gpsAccelCsv();
        parser.get(text_data);
    } else {
        // KML and GPX
        var parser = new DOMParser();
        var xml = parser.parseFromString(text_data, "application/xml");
        getPositionXml(xml);
    }

    return gpsCommon.positions;
};

gpsCommon.parseEachLines = function(data, parse_func) {
    var sp, ep;

    sp = 0;
    while((ep = data.indexOf("\n", sp)) != -1) {
        const line = data.substring(sp, ep);
        parse_func(line);
        sp = ep + 1;
    }
    if (sp < data.length) {  // 最後の行(改行で終わっていない)
        const line = data.substring(sp);
        parse_func(line);
    }
};

gpsCommon.getXYZvalue = function(col, i) {
    var ret = new Object();
    ret.x = col[i+1] ? replaceNanToZero(col[i+1].trim()) : 0;
    ret.y = col[i+2] ? replaceNanToZero(col[i+2].trim()) : 0;
    ret.z = col[i+3] ? replaceNanToZero(col[i+3].trim()) : 0;

    return ret;
};

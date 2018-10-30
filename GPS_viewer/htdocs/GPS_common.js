var gpsCommon = new Object();

gpsCommon.tracks = new Array();
gpsCommon.nmea_name_pattern = /\.(nmea)$/;
gpsCommon.accel_csv_name_pattern = /\.(accel.csv)$/;

gpsCommon.getPosition = function(text_data, name) {
    gpsCommon.tracks = [];
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

    return gpsCommon.tracks;
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

gpsCommon.makeXYZobject = function(x, y, z) {
    return {x: replaceNanToZero(x), y: replaceNanToZero(y), z: replaceNanToZero(z)};
};

gpsCommon.makeCoordinate = function(lat, lng, alt) {
    return {latitude: replaceNanToZero(lat), longitude: replaceNanToZero(lng), altitude: replaceNanToZero(alt)}
};

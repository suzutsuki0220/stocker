function getPositionXml(data) {
    var getFirstFindChild = function(elem, name) {
        if (elem == null || elem.childNodes == null) {
            return null;
        }

        for (var i=0; i<elem.childNodes.length; i++) {
            if (elem.childNodes.item(i).nodeName === name) {
                return elem.childNodes.item(i);
            }
        }

        return null;
    };
    var getFirstChildData = function(elem) {
        var ret = "";
        if (elem && elem.length > 0) {
            ret = elem.item(0).firstChild.data;
        }

        return ret;
    }

    const gpx_time_pattern = /(\d{4})[-\/](\d\d)[-\/](\d\d)T(\d\d):(\d\d):([\d\.]+)(.*)/;
    var convertGpxTime = function(timestr) {
        var dt_match = timestr.match(gpx_time_pattern);
        if (dt_match === null) {
            return timestr;
        }

        const year   = dt_match[1];
        const month  = dt_match[2];
        const day    = dt_match[3];
        const hour   = dt_match[4];
        const minute = dt_match[5];
        const second = dt_match[6];

        // ex. 2018/04/14 03:48:29.002
        return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
    };

    var sp, ep;

    const kml_elem = data.getElementsByTagName("kml");
    if (kml_elem != null && kml_elem.length != 0) {
        const coordinates_elem = kml_elem.item(0).getElementsByTagName("coordinates");
        if (coordinates_elem != null && coordinates_elem.length != 0) {
            const coordinates = coordinates_elem.item(0).firstChild.data;

            sp = 0;
            while((ep = coordinates.indexOf("\n", sp)) != -1) {
                var line = coordinates.substring(sp, ep);
                var p = parseCoordinateLine(line);
                if (p != null) {
                    gpsCommon.positions.push(p);
                }
                sp = ep + 1;
            }
            if (sp < coordinates.length) {  // 最後の行(改行で終わっていない)
                var line = coordinates.substring(sp);
                var p = parseCoordinateLine(line);
                if (p != null) {
                    gpsCommon.positions.push(p);
                }
            }
        }
    } else {
        const gpx_elem = data.getElementsByTagName("gpx");
        if (gpx_elem != null && gpx_elem.length != 0) {
            const trk_elem = getFirstFindChild(gpx_elem.item(0), "trk");
            if (trk_elem != null && trk_elem.length != 0) {
                const trkseg_elem = getFirstFindChild(trk_elem, "trkseg");
                if (trkseg_elem != null && trkseg_elem.children.length != 0) {
                    for (var i=0; i<trkseg_elem.children.length; i++) {
                        const trkpt_elem = trkseg_elem.children.item(i);
                        if (trkpt_elem.nodeName === "trkpt") {
                            var p = new Object();
                            p.latitude  = parseFloat(trkpt_elem.getAttribute('lat'));
                            p.longitude = parseFloat(trkpt_elem.getAttribute('lon'));
                            p.datetime = convertGpxTime(getFirstChildData(trkpt_elem.getElementsByTagName("time")));
                            p.speed = parseFloat(getFirstChildData(trkpt_elem.getElementsByTagName("speed"))) * 3.6;
                            p.altitude = parseFloat(getFirstChildData(trkpt_elem.getElementsByTagName("ele")));
                            gpsCommon.positions.push(p);
                        }
                    }
                }
            }
        }
    }
}

function parseCoordinateLine(line) {
    var col = line.split(",");
    if (!col) {
        return null;
    }

    const coordinate = gpsCommon.makeCoordinate(
                            replaceNanToZero(col[1]),
                            replaceNanToZero(col[0]),
                            replaceNanToZero(col[2])
                       );

    return isValidLatLng(coordinate) === true ? coordinate : null;
}

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
            gpsCommon.parseEachLines(coordinates, parseCoordinateLine);
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
                            p.coordinate = gpsCommon.makeCoordinate(
                                               parseFloat(trkpt_elem.getAttribute('lat')),
                                               parseFloat(trkpt_elem.getAttribute('lon')),
                                               parseFloat(getFirstChildData(trkpt_elem.getElementsByTagName("ele")))
                                           );
                            p.datetime = convertGpxTime(getFirstChildData(trkpt_elem.getElementsByTagName("time")));
                            p.speed = parseFloat(getFirstChildData(trkpt_elem.getElementsByTagName("speed"))) * 3.6;
                            gpsCommon.tracks.push(p);
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
        return;
    }

    var p = new Object();
    p.coordinate = gpsCommon.makeCoordinate(
                       replaceNanToZero(col[1]),
                       replaceNanToZero(col[0]),
                       replaceNanToZero(col[2])
                   );

    if (isValidLatLng(p.coordinate) === true) {
        gpsCommon.tracks.push(p);
    }
}

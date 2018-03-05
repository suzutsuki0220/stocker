function getPositionXml(data) {
    var position = [];
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
                    position.push(p);
                }
                sp = ep + 1;
            }
            if (sp < coordinates.length) {  // 最後の行(改行で終わっていない)
                var line = coordinates.substring(sp);
                var p = parseCoordinateLine(line);
                if (p != null) {
                    position.push(p);
                }
            }
        }
    } else {
        const gpx_elem = data.getElementsByTagName("gpx");
        if (gpx_elem != null && gpx_elem.length != 0) {
            const trkpt_elem = gpx_elem.item(0).getElementsByTagName("trkpt");
            if (trkpt_elem != null && trkpt_elem.length != 0) {
                for (var i=0; i<trkpt_elem.length; i++) {
                    var p = new Object();
                    p.latitude  = parseFloat(trkpt_elem.item(i).getAttribute('lat'));
                    p.longitude = parseFloat(trkpt_elem.item(i).getAttribute('lon'));

                    var ele_elem = trkpt_elem.item(i).getElementsByTagName("ele");
                    if (ele_elem != null && ele_elem.length != 0) {
                        p.altitude = parseFloat(ele_elem.item(0).firstChild.data);
                    }
                    position.push(p);
                }
            }
        }
    }

    return position;

}

function parseCoordinateLine(line) {
    var col = line.split(",");
    if (col) {
        var position = new Object();
        position.latitude  = col[1] ? parseFloat(col[1].trim()) : 0;
        position.longitude = col[0] ? parseFloat(col[0].trim()) : 0;
        position.altitude  = col[2] ? parseFloat(col[2].trim()) : 0;

        if (position.latitude != 0 && position.longitude != 0) {
            return position;
        }
    }

    return null;
}


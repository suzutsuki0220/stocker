/* 緯度経度計算に関するfunctions */

function isValidLatLng(coordinate) {
    if (!coordinate || !coordinate.latitude || !coordinate.longitude) {
        return false;
    }

    if (Math.abs(coordinate.latitude) > 90 || Math.abs(coordinate.longitude) > 180) {
        return false;
    }

    return true;
}

/**
 * GPS位置情報の精度を求める(主観的な値)
 *
 * 0: 精度情報なし  1: 良好  2: 低下  3: 悪い
**/
function getPositionQuality(horizontal_accuracy, vertical_accuracy) {
    var max_accuracy = NaN;
    var ret = 0;

    if (horizontal_accuracy) { // not 0 / NaN / null
        max_accuracy = horizontal_accuracy;
    }
    if (vertical_accuracy && max_accuracy < vertical_accuracy) {
        max_accuracy = vertical_accuracy;
    }
    if (isNaN(max_accuracy) === false) {
        if (max_accuracy >= 30) {  // fail
            ret = 3;
        } else if (max_accuracy > 10) {  // decline
            ret = 2;
        } else {  // <= 10  OK
            ret = 1;
        }
    }

    return ret;
}

function isNearLatLng(latlng1, latlng2, prec) {
    const precision = (typeof prec !== 'undefined') ? prec : 0.000001;
    const latitude_diff  = Math.abs(latlng2.latitude - latlng1.latitude);
    const longitude_diff = Math.abs(latlng2.longitude - latlng1.longitude);

    return (latitude_diff < precision &&  longitude_diff < precision);
}

/**
 * 2点の緯度経度から方位角を求める
**/
function getAzimuth(latlng1, latlng2) {
    var getRadian = function(deg) {
        return deg * (Math.PI / 180);
    };
    var getDegree = function(rad) {
        return rad * (180 / Math.PI)
    }

    var theta, azimuth;

    if (isNearLatLng(latlng1, latlng2)) {
        // 位置の変化が数センチ規模 (約1m未満)
        return NaN;
    }

    var dx = getRadian(latlng2.longitude) - getRadian(latlng1.longitude);
    var y1 = getRadian(latlng1.latitude);
    var y2 = getRadian(latlng2.latitude);

    theta = Math.atan2(Math.sin(dx), (Math.cos(y1) * Math.tan(y2) - Math.sin(y1) * Math.cos(dx)));
    if (theta >= 0) {
        azimuth = getDegree(theta);
    } else {
        azimuth = getDegree(theta + 2 * Math.PI);
    }

    return azimuth;
}

function getDirectionString(azimuth) {
    const direction_table = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
    var direction_str = "----";

    const angle_offset = 22;
    const angle_step = 360 / direction_table.length;

    if (isNaN(azimuth) === false) {
        for (var i = 0; i < direction_table.length; i++) {
            var angle = angle_step * i - angle_offset;

            if (angle >= 0) {
                if (azimuth >= angle && azimuth < angle + angle_step) {
                    direction_str = direction_table[i];
                    break;
                }
            } else {
                if (azimuth < angle + angle_step || azimuth > angle + 360) {
                    direction_str = direction_table[i]
                    break;
                }
            } 
        }
    }

    return direction_str;
}

// 高低差 mの数値と上下矢印 の文字列を返す
function makeAltitudeDiffText(altitude_diff) {
    var str = "";

    if (isNaN(altitude_diff) === false) {
        str = new String(Math.floor(altitude_diff * 100) / 100) + "m ";
        if (altitude_diff < -0.1) {
            str += "↓";
        } else if (altitude_diff > 0.1) {
            str += "↑";
        } else {
            str += "→";
        }
    }

    return str;
}

function makeSpeedText(speed_kmh, speed_diff) {
    var str = "----- km/h";

    if (isNaN(speed_kmh) === false) {
        str = new String(Math.floor(speed_kmh * 100) / 100) + "km/h";

        if (isNaN(speed_diff) === false) {
            if (speed_diff < -1.0) {
                str += " <span style=\"color: red\">↓</span>";
            } else if (speed_diff > 1.0) {
                str += " <span style=\"color: blue\">↑</span>";
            } else {
                str += " →";
            }
        }
    }

    return str;
}

/* 緯度経度計算に関するfunctions */

function isValidLatLng(lat, lng) {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return false;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * GPS位置情報の精度を求める(主観的な値)
 *
 * 0: 精度情報なし  1: 良好  2: 低下  3: 悪い
**/
function getPositionLevel(horizontal_accuracy, vertical_accuracy) {
    var max_accuracy = NaN;
    var ret = 0;

    if (isNaN(horizontal_accuracy) === false && horizontal_accuracy !== 0) {
        max_accuracy = horizontal_accuracy;
    }
    if (isNaN(vertical_accuracy) === false && vertical_accuracy !== 0) {
        if (max_accuracy < vertical_accuracy) {
            max_accuracy = vertical_accuracy;
        }
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

function isNearLatLng(lat1, lng1, lat2, lng2) {
    if (Math.abs(lat2 - lat1) < 0.000001 && Math.abs(lng2 - lng1) < 0.000001) {
        // 位置の変化が数センチ規模 (約1m未満)
        return true;
    }
    return false;
}

/**
 * 2点の緯度経度から方位角を求める
**/
function getAzimuth(lat1, lng1, lat2, lng2) {
    var getRadian = function(deg) {
        return deg * (Math.PI / 180);
    };
    var getDegree = function(rad) {
        return rad * (180 / Math.PI)
    }

    var theta, azimuth;

    if (isNearLatLng(lat1, lng1, lat2, lng2)) {
        // 位置の変化が数センチ規模 (約1m未満)
        return NaN;
    }

    var dx = getRadian(lng2) - getRadian(lng1);
    var y1 = getRadian(lat1);
    var y2 = getRadian(lat2);

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

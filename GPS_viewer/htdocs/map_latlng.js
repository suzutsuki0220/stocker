/* 緯度経度計算に関するfunctions */

function isValidLatLng(lat, lng) {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return false;
  }

  return true;
}

/**
 * GPS位置情報の精度を求める(主観的な値)
 *
 * 0: 精度情報なし  1: 良好  2: 低下  3: 悪い
**/
function getPositionLevel(p) {
    var max_accuracy = NaN;
    var ret = 0;

    if (isNaN(p.horizontal_accuracy) === false && p.horizontal_accuracy !== 0) {
        max_accuracy = p.horizontal_accuracy;
    }
    if (isNaN(p.vertical_accuracy) === false && p.vertical_accuracy !== 0) {
        if (max_accuracy < p.vertical_accuracy) {
            max_accuracy = p.vertical_accuracy;
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

/**
 * 2点の緯度経度から方位角を求める
**/
function getAzimuth(lat1, lng1, lat2, lng2) {
  // 北を０度で右回りの角度０～３６０度
  var Y = Math.cos(lng2 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
  var X = Math.cos(lng1 * Math.PI / 180) * Math.sin(lng2 * Math.PI / 180) - Math.sin(lng1 * Math.PI / 180) * Math.cos(lng2 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
  var dirE0 = 180 * Math.atan2(Y, X) / Math.PI; // 東向きが０度の方向
  if (dirE0 < 0) {
    dirE0 = dirE0 + 360; //0～360 にする。
  }
  var dirN0 = (dirE0 + 90) % 360; //(dirE0+90)÷360の余りを出力 北向きが０度の方向
  return dirN0;
}

/**
 * 2点間の距離を取得 (簡易算出)
 * 第五引数に設定するキー（unit）で単位別で取得できる
**/
function getDistance(lat1, lon1, lat2, lon2, unit) {
    var theta = lon1 - lon2;
    var dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) +  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
    if (dist > 1) {
        dist = Math.acos(1);
    } else if (dist < -1) {
        dist = Math.acos(-1);
    } else {
        dist = Math.acos(dist);
    }
    dist = rad2deg(dist);

    var miles = dist * 60 * 1.1515;
    switch (unit) {
        case 'K': // キロメートル
            return (miles * 1.609344);
        case 'N': // ノット
            return (miles * 0.8684);
        case 'M': // マイル
        default:
            return miles;
    }
}

function rad2deg(radian) {
    return radian * (180 / Math.PI);
}

function deg2rad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * ヒュベニの公式を使った距離の算出
 * 参考: http://yamadarake.jp/trdi/report000001.html
**/
const BESSEL_A = 6377397.155;
const BESSEL_E2 = 0.00667436061028297;
const BESSEL_MNUM = 6334832.10663254;

const GRS80_A = 6378137.000;
const GRS80_E2 = 0.00669438002301188;
const GRS80_MNUM = 6335439.32708317;

const WGS84_A = 6378137.000;
const WGS84_E2 = 0.00669437999019758;
const WGS84_MNUM = 6335439.32729246;

const BESSEL = 0;
const GRS80  = 1;
const WGS84  = 2;

function calcDistHubeny(lat1, lng1, lat2, lng2, a, e2, mnum) {
    var my = deg2rad((lat1 + lat2) / 2.0);
    var dy = deg2rad(lat1 - lat2);
    var dx = deg2rad(lng1 - lng2);

    var sin = Math.sin(my);
    var w = Math.sqrt(1.0 - e2 * sin * sin);
    var m = mnum / (w * w * w);
    var n = a / w;
	
    var dym = dy * m;
    var dxncos = dx * n * Math.cos(my);

    return Math.sqrt(dym * dym + dxncos * dxncos);
}

function getDistHubeny(lat1, lng1, lat2, lng2, type) {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
        return 0;
    }

    switch(type){
    case BESSEL:
        return calcDistHubeny(lat1, lng1, lat2, lng2, BESSEL_A, BESSEL_E2, BESSEL_MNUM);
    case WGS84:
        return calcDistHubeny(lat1, lng1, lat2, lng2, WGS84_A, WGS84_E2, WGS84_MNUM);
    default:
        return calcDistHubeny(lat1, lng1, lat2, lng2, GRS80_A, GRS80_E2, GRS80_MNUM);
    }
}

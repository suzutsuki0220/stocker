/**
 * 2点間の距離を取得 (簡易算出)
 * 第五引数に設定するキー（unit）で単位別で取得できる
**/
function getDistance(latlng1, latlng2, unit) {
    var theta = latlng1.lng - latlng2.lng;
    var dist = Math.sin(deg2rad(laglng1.lat)) * Math.sin(deg2rad(latlng2.lat)) +  Math.cos(deg2rad(latlng1.lat)) * Math.cos(deg2rad(latlng2.lat)) * Math.cos(deg2rad(theta));
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
const A = [
    6377397.155,  // BESSEL_A
    6378137.000,  // GRS80_A
    6378137.000   // WGS84_A
];

const E2 = [
    0.00667436061028297,  // BESSEL_E2
    0.00669438002301188,  // GRS80_E2
    0.00669437999019758   // WGS84_E2
];

const MNUM = [
    6334832.10663254,  // BESSEL_MNUM
    6335439.32708317,  // GRS80_MNUM
    6335439.32729246   // WGS84_MNUM
];

const BESSEL = 0;
const GRS80  = 1;
const WGS84  = 2;

function getDistHubeny(latlng1, latlng2, type) {
    if (!latlng1.lat || !latlng1.lng || !latlng2.lat || !latlng2.lng) {
        return 0;
    }

    const my = deg2rad((latlng1.lat + latlng2.lat) / 2.0);
    const dy = deg2rad(latlng1.lat - latlng2.lat);
    const dx = deg2rad(latlng1.lng - latlng2.lng);

    const sin = Math.sin(my);
    const w = Math.sqrt(1.0 - E2[type] * sin * sin);
    const m = MNUM[type] / (w * w * w);
    const n = A[type] / w;

    const dym = dy * m;
    const dxncos = dx * n * Math.cos(my);

    return Math.sqrt(dym * dym + dxncos * dxncos);
}

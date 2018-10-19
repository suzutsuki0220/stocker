function replaceNanToZero(value) {
    var ret = 0;
    if (value) {
        ret = parseFloat(value);
        if (isNaN(ret) === true) {
            ret = 0;
        }
    }
    return ret;
}

// value を最小値から最大値の間に収めるように返す
function normalize(input, min, max) {
    if (isNaN(input) === true) {
        return 0;
    } else {
        if (input > max) {
            return max;
        }
        if (input < min) {
            return min;
        }
        return input;
    }
}

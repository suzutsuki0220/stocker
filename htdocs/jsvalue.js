function replaceNanToZero(value) {
    var ret = 0;
    if (value) {
        ret = parseFloat(value.trim ? value.trim() : value);
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

function setMinMax(value, obj) {
    obj.min = isNaN(obj.min) ? value : (obj.min > value ? value : obj.min);
    obj.max = isNaN(obj.max) ? value : (obj.max < value ? value : obj.max);
}

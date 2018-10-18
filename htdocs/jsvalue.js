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

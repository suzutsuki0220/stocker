var mapTrack = function() {
    this.track_index = new Array();
    this.scene_before;
};

mapTrack.prototype.clearIndex = function() {
    this.track_index = [];
    this.scene_before = "";
};

mapTrack.prototype.getTrackCount = function() {
    return this.track_index.length;
};

mapTrack.prototype.searchTrackIndex = function(positions) {
    for (var i=0; i<positions.length; i++) {
        const datetime = positions[i].datetime;
        const scene = positions[i].scene;
        if (scene) {
            if (this.scene_before !== scene) {
                if (scene === "driving") {
                    var ti = new Object();
                    ti.num = i;
                    ti.datetime = datetime;
                    this.track_index.push(ti);
                    //console.log(i + " : " + datetime);
                }
            }
            this.scene_before = scene;
        }
    }
};

mapTrack.prototype.getIndexNum = function(position_idx) {
    var idx = 0;

    for (; idx<this.track_index.length; idx++) {
        if (idx === 0) {
            if (this.track_index[idx].num > position_idx) {
                break;
            }
        } else {
            if (this.track_index[idx - 1] <= position_idx && this.track_index[idx].num > position_idx) {
                break;
            }
        }
    }

    return idx;
};

mapTrack.prototype.getTrackRange = function(positions, idx) {
    var track_range = new Object();

    if (idx === 0) {
        track_range.start = 0;
        track_range.end = this.track_index[idx].num;
    } else {
        track_range.start = this.track_index[idx - 1].num;

        if (idx >= this.track_index.length) {
            track_range.end = positions.length - 1;
        } else {
            track_range.end = this.track_index[idx].num;
        }
    }

    return track_range;
};

// 指定したdatetimeに入る範囲のTrackの長さを求める
mapTrack.prototype.getTrackDuration = function(positions, datetime_str) {
    const datetime = getDateFromDatetimeString(datetime_str);
    if (isNaN(datetime) === true) {
        return NaN;
    }

    var dt_range = NaN;
    for (var i=0; i<this.track_index.length; i++) {
        const dt_end = getDateFromDatetimeString(this.track_index[i].datetime);
        if (i === 0) {
            if (dt_end >= datetime) {
                dt_range = dt_end - getDateFromDatetimeString(positions[0].datetime);
                break;
            }
        } else {
            const dt_start = getDateFromDatetimeString(this.track_index[i - 1].datetime);
            if (dt_end >= datetime && datetime > dt_start) {
                dt_range = dt_end - dt_start;
                break;
            }
        }
    }
    if (isNaN(dt_range) === true) {
        const dt_start = getDateFromDatetimeString(this.track_index[this.track_index.length - 1].datetime);
        if (dt_start < datetime) {
            const last_datetime = positions[positions.length - 1].datetime;
            if (last_datetime) {
                dt_range = getDateFromDatetimeString(last_datetime) - dt_start;
            }
        }
    }

    return dt_range;
}

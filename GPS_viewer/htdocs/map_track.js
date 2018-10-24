var mapTrack = function() {
    this.track_index = new Array();
};

mapTrack.prototype.clearIndex = function() {
    this.track_index = [];
};

mapTrack.prototype.getTrackCount = function() {
    return this.track_index.length;
};

mapTrack.prototype.searchTrackIndex = function(tracks) {
    var scene_before = "";
    for (var i=0; i<tracks.length; i++) {
        if (scene_before !== tracks[i].scene && tracks[i].scene === "driving") {
            var ti = new Object();
            ti.num = i;
            ti.datetime = getDateFromDatetimeString(tracks[i].datetime);
            this.track_index.push(ti);
            //console.log(i + " : " + ti.datetime);
        }
        scene_before = tracks[i].scene;
    }
};

mapTrack.prototype.getIndexNum = function(position_idx) {
    if (this.track_index[0].num > position_idx) { // case of idx=0
        return 0;
    }

    var idx;
    for (idx = 1; idx<this.track_index.length; idx++) {
        if (this.track_index[idx - 1].num <= position_idx && this.track_index[idx].num > position_idx) {
            break;
        }
    }

    return idx;
};

mapTrack.prototype.getTrackRange = function(tracks, idx) {
    var track_range = new Object();

    if (idx === 0) {
        track_range.start = 0;
        track_range.end = this.track_index[idx].num;
    } else {
        track_range.start = this.track_index[idx - 1].num;

        if (idx >= this.track_index.length) {
            track_range.end = tracks.length - 1;
        } else {
            track_range.end = this.track_index[idx].num;
        }
    }

    return track_range;
};

// 指定したdatetimeに入る範囲のTrackの長さを求める
mapTrack.prototype.getTrackDuration = function(tracks, datetime_str) {
    const datetime = getDateFromDatetimeString(datetime_str);
    if (isNaN(datetime) === true) {
        return NaN;
    }

    var duration = NaN;
    for (var i=0; i<=this.track_index.length; i++) {
        const dt_start = i === 0 ? getDateFromDatetimeString(tracks[0].datetime) : this.track_index[i - 1].datetime;
        const dt_end   = i < this.track_index.length ? this.track_index[i].datetime : getDateFromDatetimeString(tracks[tracks.length - 1].datetime);

        if (dt_end >= datetime && datetime > dt_start) {
            duration = dt_end - dt_start;
            break;
        }
    }

    return duration;
}

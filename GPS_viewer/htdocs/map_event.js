var mapEvent = function() {
    this.no_match_title = "G検知";
};

mapEvent.prototype.makeTitle = function(behavior) {
    var title = "";

    for (var i=0; i<4; i++) {
        const case_bit = 1 << i;
        if (this.isMatchBehavior(behavior, case_bit) === true) {
            title += title ? " / " + config.title.event[i] : config.title.event[i];
        }
    }

    return title || this.no_match_title;

};

mapEvent.prototype.isMatchBehavior = function(data_behavior, flag_pattern) {
    return (data_behavior & flag_pattern) === flag_pattern;
};

var mapTrack = function() {
    this.track_index = new Array();
    this.scene_before;
};

mapTrack.prototype.clearIndex = function() {
    this.track_index = [];
    this.scene_before = "";
};

mapTrack.prototype.searchTrackIndex = function(positions) {
    for (var i=0; i<positions.length; i++) {
        const datetime = positions[i].datetime;
        const scene = positions[i].scene;
        if (scene) {
            if (this.scene_before !== scene) {
                if (scene === "driving") {
                    console.log(i + " : " + datetime);
                }
            }
            this.scene_before = scene;
        }
    }
};

var graphBehavior = function() {
    var canvas = document.getElementById('graph_behavior');
    var ctx = canvas.getContext('2d');

    canvas.width = 610;
    canvas.height = 40;

    this.behavior_types = 6;
    this.graph_px_offset_start = 30;
    this.graph_px_offset_end   = 30;
    this.background_color = "#333333";
    this.graph_data = new Array();

    const behavior_text = ["Er", "St", "B", "T", "L", "R"];
    const graph_Y_step = canvas.height / this.behavior_types;
    const graph_width  = canvas.width - this.graph_px_offset_start - this.graph_px_offset_start;
    const graph_height = Math.floor(graph_Y_step * 0.75);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);
    ctx.font = "9px 'Avenir','Corbel','Osaka','MS Pゴシック',sans-serif";
    for (var i=0; i<this.behavior_types; i++) {
        const startY = Math.floor(graph_Y_step * i);
        ctx.strokeStyle = "#cccccc";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(behavior_text[i], 10, startY + 7);
        ctx.stroke();

        ctx.strokeStyle = this.background_color;
        ctx.fillStyle = this.background_color;
        ctx.fillRect(this.graph_px_offset_start, startY, graph_width, graph_height);
        ctx.stroke();
    }
    ctx.closePath();
};

graphBehavior.prototype.push = function(position) {
    var e = new Object();
    e.scene    = position.scene;
    e.behavior = position.behavior;
    e.level    = position.level;
    this.graph_data.push(e);
};

graphBehavior.prototype.plot = function() {
    var getStrokeColor = function(level) {
        if (level) {
            switch(level) {
            case 3:
                return "#FF0000";
            case 2:
                return "#FFFF00";
            case 1:
                return "#3CB000";
            }
        }
        return "#2066F0";
    };
    var getLevelInRange = function(start_pos, end_pos, graph_data, behavior) {
        var start = Math.floor(graph_data.length * start_pos);
        var end   = Math.floor(graph_data.length * end_pos);
        var max_level = 0;

        for (var i=start; i<end; i++) {
            if (graph_data[i].behavior === behavior) {
                if (graph_data[i].level > max_level) {
                    max_level = graph_data[i].level;
                    if (max_level === 3) {
                        break;
                    }
                }
            }
        }

        return max_level;
    };
    var hasErrorInRange = function(start_pos, end_pos, graph_data) {
        var start = Math.floor(graph_data.length * start_pos);
        var end   = Math.floor(graph_data.length * end_pos);
        var error_count = 0;
        var level = 0;

        if (start !== end) {
            for (var i=start; i<end; i++) {
                if (graph_data[i].scene === "error") {
                    error_count++;
                }
            }

            var error_rate = error_count / (end - start);
            if (error_rate > 0.8) {
                level = 3;
            } else if (error_rate > 0.4) {
                level = 2;
            } else if (error_count !== 0) {
                level = 1;
            }
        }

        return level;
    };
    var hasStopInRange = function(start_pos, end_pos, graph_data) {
        var start = Math.floor(graph_data.length * start_pos);
        var end   = Math.floor(graph_data.length * end_pos);
        var error_count = 0;
        var level = 0;

        for (var i=start; i<end; i++) {
            if (graph_data[i].scene === "slight") {
                level = 99;  // else level
                break;
            } else if (graph_data[i].scene === "stop") {
                level = 1;
                break;
            }
        }

        return level;
    };

    var canvas = document.getElementById('graph_behavior');
    var ctx = canvas.getContext('2d');

    const step = 2;
    const graph_Y_step = canvas.height / this.behavior_types;
    const graph_width  = canvas.width - this.graph_px_offset_start - this.graph_px_offset_end;
    const graph_height = Math.floor(graph_Y_step * 0.75);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<graph_width; i+=step) {
        const x = this.graph_px_offset_start + i;

        for (var j=0; j<this.behavior_types; j++) {
            var level;
            if (j === 0) {
                level = hasErrorInRange(i/graph_width, (i+step)/graph_width, this.graph_data);
            } else if (j === 1) {
                level = hasStopInRange(i/graph_width, (i+step)/graph_width, this.graph_data);
            } else {
                var behavior = Math.pow(2, j - 2); // j-2: error, stopを除く
                level = getLevelInRange(i/graph_width, (i+step)/graph_width, this.graph_data, behavior);
            }
            if (level !== 0) {
                const y = Math.floor(graph_Y_step * j);
                ctx.strokeStyle = getStrokeColor(level);
                ctx.fillStyle = getStrokeColor(level);
                ctx.fillRect(x, y, step, graph_height);
                ctx.stroke();
            }
        }
    }

    ctx.closePath();
};

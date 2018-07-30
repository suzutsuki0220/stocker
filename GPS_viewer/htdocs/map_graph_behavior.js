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
    var getLevelInRange = function(start, end, graph_data, behavior) {
        var max_level = 0;

        for (var i=start; i<=end; i++) {
            if (graph_data[i]) {
                if ((graph_data[i].behavior & behavior) === behavior) {
                    if (isNaN(graph_data[i].level)) {
                        if (max_level === 0) {
                            max_level = 1;
                        }
                    } else {
                        if (graph_data[i].level > max_level) {
                            max_level = graph_data[i].level;
                            if (max_level === 3) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        return max_level;
    };
    var hasErrorInRange = function(start, end, graph_data) {
        var sample_count = 0;
        var error_count = 0;
        var level = 0;

        for (var i=start; i<=end; i++) {
            if (graph_data[i] && graph_data[i].scene) {
                sample_count++;
                if (graph_data[i].scene === "error") {
                    error_count++;
                }
            }
        }

        var error_rate = sample_count !== 0 ? error_count / sample_count : 0;
        if (error_rate > 0.8) {
            level = 3;
        } else if (error_rate > 0.4) {
            level = 2;
        } else if (error_count !== 0) {
            level = 1;
        }

        return level;
    };
    var hasStopInRange = function(start, end, graph_data) {
        var level = 0;

        for (var i=start; i<=end; i++) {
            if (graph_data[i] && graph_data[i].scene) {
                if (graph_data[i].scene === "slight") {
                    level = 99;  // else level
                    break;
                } else if (graph_data[i].scene === "stop") {
                    level = 1;
                    break;
                }
            }
        }

        return level;
    };

    if (this.graph_data.length === 0) {
        return;
    }

    var canvas = document.getElementById('graph_behavior');
    var ctx = canvas.getContext('2d');

    const graph_Y_step = canvas.height / this.behavior_types;
    const graph_width  = canvas.width - this.graph_px_offset_start - this.graph_px_offset_end;
    const graph_height = Math.floor(graph_Y_step * 0.75);

    var step = Math.floor(graph_width / this.graph_data.length);
    if (step < 2) {  // minimum
        step = 2;
    }

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);

    for (var i=0; i<graph_width; i+=step) {
        const x = this.graph_px_offset_start + i;
        const start_pos = i / graph_width;
        const end_pos   = (i+step) / graph_width;
        const start = Math.floor(this.graph_data.length * start_pos);
        const end   = Math.floor(this.graph_data.length * end_pos);

        for (var j=0; j<this.behavior_types; j++) {
            var level;
            if (j === 0) {
                level = hasErrorInRange(start, end, this.graph_data);
            } else if (j === 1) {
                level = hasStopInRange(start, end, this.graph_data);
            } else {
                var behavior = Math.pow(2, j - 2); // j-2: error, stopを除く
                level = getLevelInRange(start, end, this.graph_data, behavior);
            }
            if (level !== 0) {
                const y = Math.floor(graph_Y_step * j);
                const endX = i + step <= graph_width ? step : graph_width - i;
                ctx.strokeStyle = getStrokeColor(level);
                ctx.fillStyle = getStrokeColor(level);
                ctx.fillRect(x, y, endX, graph_height);
                ctx.stroke();
            }
        }
    }

    ctx.closePath();
};

var graphBehavior = function(canvas) {
    this.canvas = canvas;
    this.behavior_types = 6;
    this.graph_px_offset_start = 30;
    this.graph_px_offset_end   = 30;
    this.background_color = "#333333";
    this.graph_data = new Array();

    this.canvas.width = 610;
    this.canvas.height = 40;

    const behavior_text = ["Er", "St", "B", "T", "L", "R"];
    this.graph_Y_step = this.canvas.height / this.behavior_types;
    this.graph_width  = this.canvas.width - this.graph_px_offset_start - this.graph_px_offset_start;
    this.graph_height = Math.floor(this.graph_Y_step * 0.75);

    var ctx = this.__makeCanvasContext();
    for (var i=0; i<this.behavior_types; i++) {
        const startY = Math.floor(this.graph_Y_step * i);
        ctx.strokeStyle = "#cccccc";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(behavior_text[i], 10, startY + 7);
        ctx.stroke();

        ctx.strokeStyle = this.background_color;
        ctx.fillStyle = this.background_color;
        ctx.fillRect(this.graph_px_offset_start, startY, this.graph_width, this.graph_height);
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

graphBehavior.prototype.__makeCanvasContext = function() {
    var ctx = this.canvas.getContext('2d');

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);
    ctx.font = "9px 'Avenir','Corbel','Osaka','MS Pゴシック',sans-serif";

    return ctx;
};

graphBehavior.prototype.__isMatchBehavior = function(data, behavior) {
    var ret = false;

    if (data) {
        if ((data.behavior & behavior) === behavior) {
            ret = true;
        }
    }

    return ret;
};

graphBehavior.prototype.__getEventLevelInRange = function(start, end, behavior) {
    var max_level = 0;

    for (var i=start; i<=end; i++) {
        if (this.__isMatchBehavior(this.graph_data[i], behavior) === false) {
            continue;
        };

        const level = isNaN(this.graph_data[i].level) === true ? 1 : this.graph_data[i].level;
        if (level > max_level) {
            max_level = level;
            if (max_level === 3) {
                break;
            }
        }
    }

    return max_level;
};

graphBehavior.prototype.__hasStopInRange = function(start, end) {
    var level = 0;

    const cond = [
        {scene: "slight", level: 99},  // else level
        {scene: "stop",   level:  1}
    ];

    for (var i=start; i<=end; i++) {
        if (!this.graph_data[i] || !this.graph_data[i].scene) {
            continue;
        }

        for (var j=0; j<cond.length; j++) {
            if (this.graph_data[i].scene === cond[j].scene) {
                level = cond[j].level;
                break;
            }
        }
    }

    return level;
};

graphBehavior.prototype.__hasErrorInRange = function(start, end) {
    var sample_count = 0;
    var error_count = 0;
    var level = 0;

    const cond = [
        {error_rate: 0.8, level: 3},
        {error_rate: 0.4, level: 2},
        {error_rate: 0,   level: 1}
    ];

    for (var i=start; i<=end; i++) {
        if (!this.graph_data[i] || !this.graph_data[i].scene) {
            continue;
        }

        sample_count++;
        if (this.graph_data[i].scene === "error") {
            error_count++;
        }
    }

    const error_rate = sample_count !== 0 ? error_count / sample_count : 0;
    for (var i=0; i<cond.length; i++) {
        if (error_rate > cond[i].error_rate) {
            level = cond[i].level;
            break;
        }
    }

    return level;
};

graphBehavior.prototype.__getStrokeColor = function(level) {
    const colors = ["#2066F0", "#3CB000", "#FFFF00", "#FF0000"];
    var color_index = 0;
    if (isNaN(level) === false) {
        if (0 < level && level < colors.length) { // レベル1から3
            color_index = level;
        }
    }
    return colors[color_index];
};

graphBehavior.prototype._getLevel = function(start, end, row_num) {
    var level;

    if (row_num === 0) {
        level = this.__hasErrorInRange(start, end);
    } else if (row_num === 1) {
        level = this.__hasStopInRange(start, end);
    } else {
        const behavior = Math.pow(2, row_num - 2); // row_num-2: error, stopを除く
        level = this.__getEventLevelInRange(start, end, behavior);
    }

    return level;
};

graphBehavior.prototype.plot = function() {
    if (this.graph_data.length === 0) {
        return;
    }

    var ctx = this.__makeCanvasContext();
    const step = normalize(Math.floor(this.graph_width / this.graph_data.length), 2, this.graph_width);
    for (var i=0; i<this.graph_width; i+=step) {
        const x = this.graph_px_offset_start + i;
        const start_pos = i / this.graph_width;
        const end_pos   = (i+step) / this.graph_width;
        const start = Math.floor(this.graph_data.length * start_pos);
        const end   = Math.floor(this.graph_data.length * end_pos);

        for (var j=0; j<this.behavior_types; j++) {
            const level = this._getLevel(start, end, j);
            if (level !== 0) {
                const y = Math.floor(this.graph_Y_step * j);
                const endX = i + step <= this.graph_width ? step : this.graph_width - i;
                ctx.strokeStyle = this.__getStrokeColor(level);
                ctx.fillStyle = this.__getStrokeColor(level);
                ctx.fillRect(x, y, endX, this.graph_height);
                ctx.stroke();
            }
        }
    }
    ctx.closePath();
};

var mapRangeSlider = function() {
    this.drag_range_start = {
        isMouseDown : false,
        target : null,
        offsetx : 0,
        offsety : 0,
    };
    this.drag_range_end = {
        isMouseDown : false,
        target : null,
        offsetx : 0,
        offsety : 0,
    };
    this.start_value = 0;
    this.end_value = 0;
    this.after_changed_func = null;  // スライダーが移動された後に動かす処理
    this.range_start = null;  // rectエレメント
    this.range_end = null;    // rectエレメント
    this.base_area = null;    // svgエレメント
    this.playback_pos = null;    // svgエレメント
    this.mask_before_start = null;  // rectエレメント
    this.mask_after_end = null;  // rectエレメント
    this.stroke_elem = null;  // pathエレメント
};

// onLoad時にelementをセットする
mapRangeSlider.prototype.onLoadWork = function(args) {
    var draggable = function(element, drag) {
        var dragStartWork = function(e) {
            e.preventDefault();
            var rect = element.getBoundingClientRect();
            drag.offsetx = e.clientX - rect.left;
            drag.offsety = e.clientY - rect.top;
            drag.isMouseDown = true;
            return false;
        };
        //element.addEventListener('touchstart', dragStartWork);  // スマホ用。後回し
        element.addEventListener('mousedown', dragStartWork);
        drag.target = element;
    };

    this.after_changed_func = args.after_changed_func;
    this.range_start        = args.range_start;
    this.range_end          = args.range_end;
    this.base_area          = args.base_area;
    this.playback_pos       = args.playback_pos;
    this.mask_before_start  = args.mask_before_start;
    this.mask_after_end     = args.mask_after_end;
    this.stroke_elem        = args.stroke_elem;

    draggable(this.range_start, this.drag_range_start);
    draggable(this.range_end, this.drag_range_end);

    this.setRangePosition(0, 1000);
}

mapRangeSlider.prototype.onResizeWork = function() {
    var startEnd = this.getStartEndValue();
    this.setRangePosition(startEnd.start, startEnd.end);
}

mapRangeSlider.prototype.onMouseUpWork = function() {
    this.drag_range_start.isMouseDown = false;
    this.drag_range_end.isMouseDown = false;
};

mapRangeSlider.prototype.onMouseMoveWork = function(e) {
    var self = this;  // 局所化したfunction内ではthisの意味が変わるので、代わりにselfを使う
    var moveElement = function(e, drag) {
        drag.target.x.baseVal.value = e.clientX - drag.offsetx;
        //drag.target.y.baseVal.value = e.clientY - drag.offsety;

        const base_area_width = self.base_area.clientWidth;
        const e_line_width = parseInt(drag.target.getAttribute('width'), 10);
        // 最小値よりはみ出しを抑止
        if (drag.target.x.baseVal.value < 0) {
            drag.target.x.baseVal.value = 0;
        }
        // 最大値よりはみ出しを抑止
        if (drag.target.x.baseVal.value > base_area_width) {
            drag.target.x.baseVal.value = base_area_width - e_line_width;
        }
        normalizeRange();

        self._setStartEndValueByPosition();
        self._stretchMaskArea();
        if (self.after_changed_func !== null) {
            self.after_changed_func();
        }
    };
    var normalizeRange = function() {
        const base_area_width = self.base_area.clientWidth;
        const s_line_width  = parseInt(self.range_start.getAttribute('width'), 10);
        const e_line_width  = parseInt(self.range_end.getAttribute('width'), 10);
        const range_start_x = parseInt(self.range_start.getAttribute('x'), 10);
        const range_end_x   = parseInt(self.range_end.getAttribute('x'), 10);

        // start位置がendより右に行った場合はendも動かす
        if (range_start_x + s_line_width > range_end_x) {
            var to_move_x = range_start_x + s_line_width;
            if (to_move_x + e_line_width > base_area_width) {
                to_move_x = base_area_width - e_line_width;
            }
            self.range_end.setAttribute('x', to_move_x);
        }
        // end位置がstartより左に行った場合はstartも動かす
        if (range_end_x < range_start_x + s_line_width) {
            var to_move_x = range_end_x - s_line_width;
            if (to_move_x < 0) {
                to_move_x = 0;
            }
            self.range_start.setAttribute('x', to_move_x);
        }
    };

    if (this.drag_range_start.isMouseDown === true) {
        moveElement(e, this.drag_range_start);
    } else if(this.drag_range_end.isMouseDown === true) {
        moveElement(e, this.drag_range_end);
    }
};

mapRangeSlider.prototype._setStartEndValueByPosition = function() {
    const base_area_width = this.base_area.clientWidth;
    const s_line_width  = parseInt(this.range_start.getAttribute('width'), 10);
    const e_line_width  = parseInt(this.range_end.getAttribute('width'), 10);
    const range_start_x = parseInt(this.range_start.getAttribute('x'), 10);
    const range_end_x   = parseInt(this.range_end.getAttribute('x'), 10);

    this.start_value = Math.floor((range_start_x / (base_area_width - s_line_width)) * 1000);
    this.end_value   = Math.floor((range_end_x / (base_area_width - e_line_width)) * 1000);
}

mapRangeSlider.prototype._stretchMaskArea = function() {
    const base_area_width = this.base_area.clientWidth;
    const e_line_width  = parseInt(this.range_end.getAttribute('width'), 10);
    const range_start_x = parseInt(this.range_start.getAttribute('x'), 10);
    const range_end_x   = parseInt(this.range_end.getAttribute('x'), 10);

    this.mask_before_start.setAttribute('width', range_start_x);
    this.mask_after_end.setAttribute('x',  range_end_x + e_line_width);
    this.mask_after_end.setAttribute('width', base_area_width - range_end_x);
};

/**
 * 指定した値の位置にスライダーを移動する
 * start, end: 位置を 0～1000 で指定
**/
mapRangeSlider.prototype.setRangePosition = function(start, end) {
    if (isNaN(start) === true || isNaN(end) === true) {
        return;
    }

    const base_area_width = this.base_area.clientWidth;
    const e_line_width  = parseInt(this.range_end.getAttribute('width'), 10);
    const x_interval = base_area_width / 1000;

    this.start_value = start;
    this.end_value   = end;

    this.range_start.setAttribute('x', Math.floor(start * x_interval));
    this.range_end.setAttribute('x', Math.floor((end * x_interval) - e_line_width));

    this._stretchMaskArea();
}

mapRangeSlider.prototype.getStartEndValue = function() {
    var ret = new Object();
    ret.start = this.start_value;
    ret.end   = this.end_value;

    return ret;
};

mapRangeSlider.prototype.setStrokeData = function(data, min, max) {
    const base_area_width  = this.base_area.clientWidth;
    const base_area_height = this.base_area.clientHeight;
    const stroke_width = parseInt(this.stroke_elem.getAttribute('stroke-width'), 10);
    const zero_point_y = parseInt(this.range_start.getAttribute('y'), 10) + base_area_height - stroke_width;
    const y_interval = (base_area_height - (2 * stroke_width)) / (max - min);

    if (this.stroke_elem === null) {
        return;
    }

    var d = "";
    if (data.length !== 0) {
        d = "M";
        if (data.length === 1) {
            const point_y = Math.floor(zero_point_y - (y_interval * normalize(data[0], min, max)));
            d += "0," + zero_point_y + "," + base_area_width + "," + point_y;
        } else {
            for (var i=0; i<data.length; i++) {
                if (i !== 0) {
                    d += ",";
                }
                const point_x = Math.floor(base_area_width / (data.length - 1) * i);
                const point_y = Math.floor(zero_point_y - (y_interval * normalize(data[i], min, max)));
                d += point_x + "," + point_y;
            }
        }
    }
    this.stroke_elem.setAttribute('d', d);
};

mapRangeSlider.prototype.setPlaybackPositionVisible = function(sw) {
    const disp = sw === true ? 'inline' : 'none';

    this.playback_pos.setAttribute('display', disp);
}

mapRangeSlider.prototype.setPlaybackPosition = function(position) {
    const base_area_width  = this.base_area.clientWidth;
    const pos_width  = parseInt(this.playback_pos.getAttribute('width'), 10);
    const pos_x = Math.floor(position / 1000 * base_area_width);

    const x = normalize(Math.floor(pos_x - (pos_width / 2) + 0.5), 0, base_area_width);

    this.playback_pos.setAttribute('x', x);
}

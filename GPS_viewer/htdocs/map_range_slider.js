var mapRangeSlider = function() {
    this.offset_x = 0;
    this.offset_y = 0;
    this.start_value = 0;
    this.end_value = 0;
    this.drag_elem = null;
    this.after_changed_func = null;  // スライダーが移動された後に動かす処理
    this.range_start = null;  // rectエレメント
    this.range_end = null;    // rectエレメント
    this.base_area = null;    // svgエレメント
    this.playback_pos = null;    // svgエレメント
    this.mask_before_start = null;  // rectエレメント
    this.mask_after_end = null;  // rectエレメント
    this.stroke_elem = null;  // pathエレメント
};

mapRangeSlider.prototype.__addMoveStartEvent = function(elem) {
    elem.addEventListener("mousedown", e => this.onMouseDown(e), false);
    elem.addEventListener("touchstart",  e => this.onMouseDown(e), false);
}

mapRangeSlider.prototype.__addMoveUpEvent = function(elem) {
    elem.addEventListener("mousemove", e => this.onMouseMove(e), false);
    elem.addEventListener("touchmove", e => this.onMouseMove(e), false);
    elem.addEventListener("mouseup", e => this.onMouseUp(e), false);
    elem.addEventListener("touchend", e => this.onMouseUp(e), false);
};

// onLoad時にelementをセットする
mapRangeSlider.prototype.onLoad = function(args) {
    var self = this;
    var draggable = function(element) {
        self.__addMoveStartEvent(element);
        self.__addMoveUpEvent(element);
    };

    this.after_changed_func = args.after_changed_func;
    this.range_start        = args.range_start;
    this.range_end          = args.range_end;
    this.base_area          = args.base_area;
    this.playback_pos       = args.playback_pos;
    this.mask_before_start  = args.mask_before_start;
    this.mask_after_end     = args.mask_after_end;
    this.stroke_elem        = args.stroke_elem;

    this.drag_elem = null;
    this.__addMoveUpEvent(this.base_area);

    draggable(this.range_start);
    draggable(this.range_end);

    this.resetRangePosition();
};

mapRangeSlider.prototype.mousePointToSVGPoint = function(e) {
    const p = this.base_area.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const CTM = this.drag_elem.getScreenCTM();

    return p.matrixTransform(CTM.inverse());
};

mapRangeSlider.prototype.resetRangePosition = function() {
    this.setRangePosition(0, 1000);
};

mapRangeSlider.prototype.onResize = function(e) {
    var startEnd = this.getStartEndValue();
    this.setRangePosition(startEnd.start, startEnd.end);
};

mapRangeSlider.prototype.onMouseUp = function(e) {
    this.drag_elem = null;
};

mapRangeSlider.prototype.onMouseDown = function(e) {
    const event = (e.type === "mousedown") ? e : e.changedTouches[0];
    this.drag_elem = event.target;

    const p = this.mousePointToSVGPoint(event);
    this.offset_x = p.x - this.drag_elem.getAttribute('x');
    this.offset_y = p.y - this.drag_elem.getAttribute('y');

    event.preventDefault();
};

mapRangeSlider.prototype._normalizeRange = function() {
    const base_area_width = this.base_area.clientWidth;
    const s_line_width  = parseInt(this.range_start.getAttribute('width'), 10);
    const e_line_width  = parseInt(this.range_end.getAttribute('width'), 10);
    const range_start_x = parseInt(this.range_start.getAttribute('x'), 10);
    const range_end_x   = parseInt(this.range_end.getAttribute('x'), 10);

    // start位置がendより右に行った場合はendも動かす
    if (range_start_x + s_line_width > range_end_x) {
        const to_move_x = normalize(range_start_x + s_line_width, 0, base_area_width - e_line_width);
        this.range_end.setAttribute('x', to_move_x);
    }
    // end位置がstartより左に行った場合はstartも動かす
    if (range_end_x < range_start_x + s_line_width) {
        const to_move_x = normalize(range_end_x - s_line_width, 0, base_area_width - e_line_width);
        this.range_start.setAttribute('x', to_move_x);
    }
};

mapRangeSlider.prototype.onMouseMove = function(e) {
    if (!this.drag_elem) {
        return;
    }

    const event = (e.type === "mousemove") ? e : e.changedTouches[0];
    const p = this.mousePointToSVGPoint(event);

    const base_area_width = this.base_area.clientWidth;
    const e_line_width = parseInt(this.drag_elem.getAttribute('width'), 10);

    const x = normalize(p.x - this.offset_x, 0, base_area_width - e_line_width);
    //var y = p.y - this.offset_y;
    this.drag_elem.setAttribute('x', x);
    //this.drag_elem.setAttribute('y', y - this.offset_y);

    this._normalizeRange();

    this._setStartEndValueByPosition();
    this._stretchMaskArea();
    this.after_changed_func && this.after_changed_func();

    event.preventDefault();
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
    if (data.length === 1) {
        const point_y = Math.floor(zero_point_y - (y_interval * normalize(data[0], min, max)));
        d = "M0," + zero_point_y + "," + base_area_width + "," + point_y;
    } else {
        for (var i=0; i<data.length; i++) {
            const point_x = Math.floor(base_area_width / (data.length - 1) * i);
            const point_y = Math.floor(zero_point_y - (y_interval * normalize(data[i], min, max)));
            d += i === 0 ? "M" : ",";
            d += point_x + "," + point_y;
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

var mapInfoField = function() {
    this.distance_text_elem  = document.getElementById("distance_text"); 
    this.duration_text_elem  = document.getElementById("duration_text");
    this.sample_count_elem   = document.getElementById("sample_count");
    this.point_count_elem    = document.getElementById("point_count");
    this.skip_sample_elem    = document.getElementById("skip_sample");
    this.invalid_sample_count_elem = document.getElementById("invalid_sample_count");
    this.start_datetime_elem = document.getElementById("start_datetime");
    this.end_datetime_elem   = document.getElementById("end_datetime");
    this.start_address_elem  = document.getElementById("start_address");
    this.end_address_elem    = document.getElementById("end_address");
};

mapInfoField.prototype.clear = function() {
    this.distance_text_elem.innerHTML = "--  km"; 
    this.duration_text_elem.innerHTML = "---- 秒"; 
    this.sample_count_elem.innerHTML  = "0";
    this.invalid_sample_count_elem.innerHTML = "0";
    this.start_address_elem.innerHTML = "";
    this.end_address_elem.innerHTML   = "";
};

mapInfoField.prototype.setStartAddress = function(message) {
    this.start_address_elem.innerHTML = message;
};

mapInfoField.prototype.setEndAddress = function(message) {
    this.end_address_elem.innerHTML   = message;
};

mapInfoField.prototype.setCounter = function(count) {
    this.point_count_elem.innerHTML  = String(count.plot);
    this.sample_count_elem.innerHTML = String(count.total);
    this.skip_sample_elem.innerHTML  = String(count.skip);
    this.invalid_sample_count_elem.innerHTML = String(count.invalid);
};

mapInfoField.prototype.setDuration = function(datetime_start, datetime_end) {
    const s = getDateFromDatetimeString(datetime_start);
    const e = getDateFromDatetimeString(datetime_end);
    var duration_str = "----";

    if (isNaN(s) === false && isNaN(e) === false) {
        const duration = (e - s) / 1000;
        duration_str = duration.toFixed();
    }

    this.duration_text_elem.innerHTML = duration_str + " 秒"; 
};

mapInfoField.prototype.setDatetime = function(datetime_start, datetime_end) {
    this.start_datetime_elem.innerHTML = datetime_start ? datetime_start : "不明";
    this.end_datetime_elem.innerHTML   = datetime_end ? datetime_end : "不明";
};

mapInfoField.prototype.setDistance = function(distance) {
    this.distance_text_elem.innerHTML = distance.toFixed(3) + " km"; 
};

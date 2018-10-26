var mapInfoField = function() {
    this.distance_text_elem = document.getElementById("distance_text"); 
    this.duration_text_elem = document.getElementById("duration_text");
    this.sample_count_elem  = document.getElementById("sample_count");
    this.invalid_sample_count_elem = document.getElementById("invalid_sample_count");
    this.start_address_elem = document.getElementById("start_address");
    this.end_address_elem   = document.getElementById("end_address");
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

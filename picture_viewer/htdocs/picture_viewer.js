var load_flg = false;
var load_again = -1;
var filename = "";
var images = new Array();

function setFileName(name) {
    filename = name;
}

function getImageList(base_name, path) {
  try {
    getDirectoryList(base_name, path, 0, 0, getImageFiles);
  } catch(e) {
     alert("ERROR: " + e.description);
  }
}

function getImageFiles(data) {
  const contents = data.getElementsByTagName('contents').item(0);
  if (contents == null) {
    alert("ERROR: image files list is NULL");
    return;
  }

  const elements = contents.getElementsByTagName('element');
  if (elements == null) {
    alert("ERROR: mage list has no elements");
    return;
  }

  const image_pattern = /\.(jpg|jpeg)$/;  // 拡張子判定

  for (var i=0; i<elements.length; i++) {
    var name_elem = elements.item(i).getElementsByTagName('name');
    var path_elem = elements.item(i).getElementsByTagName('path');
    var num_elem = elements.item(i).getElementsByTagName('num');
    if (name_elem != null && path_elem != null) {
      var name = name_elem.item(0).firstChild.data;
      var path = path_elem.item(0).firstChild.data;
      var num  = num_elem != null ? num_elem.item(0).firstChild.data : 0;

      if (image_pattern.test(name.toLowerCase())) {
        var img = new Object();

        img.name = name;
        img.path = path;
        img.num  = num;
        images.push(img);
      }
    }
  }

  reloadImageList();
}

function reloadImageList() {
  var elm_num = 0;

  for (var i=0; i<images.length; i++) {
    const img = images[i];
    if (img.name === filename) {
      elm_num = i;
    }
  }

  renewControlField(elm_num);
}

function renewControlField(index) {
    var prev_link = "＜";
    var next_link = "＞";

    if (index != 0) {
        var num = index - 1;
        prev_link = "<a href=\"javascript:changeImage(" + num + ")\">＜</a>";
    }
    if (index < images.length -1) {
        var num = index + 1;
        next_link = "<a href=\"javascript:changeImage(" + num + ")\">＞</a>";
    }

    var disp_num = index + 1;
    document.getElementById('control_field').innerHTML = prev_link + "&nbsp;" + disp_num + "/" + images.length + "&nbsp;" + next_link;
}

function changeImage(index) {
    const img = images[index];

    if (load_flg === true) {
        load_again = index;
        return;
    }

    document.getElementById('filename_field').innerHTML = img.name;
    imageLoading(img.path);
    renewControlField(index);
}

function imageLoading(path) {
    if (document.ImageArea.addEventListener) {
      document.ImageArea.addEventListener("load", unsetLoading, false);
      document.ImageArea.addEventListener("error", unsetLoading, false);
      document.ImageArea.addEventListener("abort", unsetLoading, false);
    } else if (document.ImageArea.attachEvent) {
      document.ImageArea.attachEvent("onload", unsetLoading);
      document.ImageArea.attachEvent("onerror", unsetLoading);
      document.ImageArea.attachEvent("onabort", unsetLoading);
    }

    load_flg = true;
    document.getElementById('ImageArea').src = getPictureSrc(path);
    document.getElementById('loadingText').style.display = "block";
}

function unsetLoading() {
    if (document.ImageArea.removeEventListener) {
        document.ImageArea.removeEventListener("load", unsetLoading, false);
        document.ImageArea.removeEventListener("error", unsetLoading, false);
        document.ImageArea.removeEventListener("abort", unsetLoading, false);
    } else if (document.ImageArea.detachEvent) {
        document.ImageArea.detachEvent("onload", unsetLoading);
        document.ImageArea.detachEvent("onerror", unsetLoading);
        document.ImageArea.detachEvent("onabort", unsetLoading);
    }

    load_flg = false;
    document.getElementById('loadingText').style.display = "none";

    if (load_again != -1) {
        changeImage(load_again);
        load_again = -1;
    }
}


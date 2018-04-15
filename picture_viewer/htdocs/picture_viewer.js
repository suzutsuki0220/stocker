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

    document.getElementById('ExifLayer').style.display = "none";

    document.title = img.name;
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
    document.getElementById('InfoLink').href = getExifInfoHref(path);
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

function toggleExifLayer(exif_info_url, base_name, path) {
    if (document.getElementById('ExifLayer').style.display === "none") {
        var httpRequest = ajax_init();
        if (httpRequest) {
            var query = "mode=exif&dir=" + base_name + "&file=" + path;
            ajax_set_instance(httpRequest, function() { showExif(httpRequest) });
            ajax_post(httpRequest, exif_info_url, query);
            document.getElementById('ExifLayer').style.display = "block";
            document.getElementById('ExifLayer').innerHTML = "loading";
        } else {
            alert("EXIFの読み取りに失敗しました");
        }
    } else {
        document.getElementById('ExifLayer').style.display = "none";
    }
}

function showExif(httpRequest) {
    var content;

    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            var data = httpRequest.responseXML;

            content = `
<h3>EXIF情報</h3>
<table class="ExifTable">
<tr><th>EXIFバージョン</th><td>$exif_data->{'exif'}[0]->{'Exif_Version'}[0]</td></tr>
<tr><th>幅 x 高さ</th><td>$exif_data->{'exif'}[0]->{'Pixel_X_Dimension'}[0] x $exif_data->{'exif'}[0]->{'Pixel_Y_Dimension'}[0]</td></tr>
<tr><th>作成日時</th><td>$exif_data->{'exif'}[0]->{'Date_and_Time__Original_'}[0]</td></tr>
<tr><th>メーカー</th><td>$exif_data->{'exif'}[0]->{'Manufacturer'}[0]</td></tr>
<tr><th>モデル</th><td>$exif_data->{'exif'}[0]->{'Model'}[0]</td></tr>
<tr><th>絞り値</th><td>$exif_data->{'exif'}[0]->{'F-Number'}[0]</td></tr>
<tr><th>露出時間</th><td>$exif_data->{'exif'}[0]->{'Exposure_Time'}[0]</td></tr>
<tr><th>ISO感度</th><td>$exif_data->{'exif'}[0]->{'ISO_Speed_Ratings'}[0]</td></tr>
<tr><th>露出補正</th><td>$exif_data->{'exif'}[0]->{'Exposure_Bias'}[0]</td></tr>
<tr><th>焦点距離</th><td>$exif_data->{'exif'}[0]->{'Focal_Length'}[0]</td></tr>
</table>`;
        } else {
            content = "EXIFが含まれていません";
        }

        document.getElementById('ExifLayer').innerHTML = content;
    }
}

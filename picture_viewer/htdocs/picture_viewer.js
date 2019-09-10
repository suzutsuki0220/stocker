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

  for (var i=0; i<elements.length; i++) {
    var name_elem = elements.item(i).getElementsByTagName('name');
    var path_elem = elements.item(i).getElementsByTagName('path');
    var num_elem = elements.item(i).getElementsByTagName('num');
    if (name_elem != null && path_elem != null) {
      var name = name_elem.item(0).firstChild.data;
      var path = path_elem.item(0).firstChild.data;
      var num  = num_elem != null ? num_elem.item(0).firstChild.data : 0;

      if (stockerConfig.supportTypes.imagePattern.test(name.toLowerCase())) {
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
    document.getElementById('fileNameArea').innerHTML = img.name;
    imageLoading(img.path);
    renewControlField(index);
}

function getPictureSrc(path) {
    return stockerConfig.uri.picture_viewer.get_picture + "?file=" + path + "&dir=" + params.dir + "&size=640";
}

function getThumbnailSrc(path) {
    return stockerConfig.uri.thumbnail + "?file=" + path + "&dir=" + params.dir;
}

function getExifInfoHref(path) {
    return "javascript:toggleExifLayer('" + path + "')";
}

function imageLoading(path) {
    if (document.ImageArea.addEventListener) {
      document.ImageArea.addEventListener("load", onImageLoad, false);
      document.ImageArea.addEventListener("error", unsetLoading, false);
      document.ImageArea.addEventListener("abort", unsetLoading, false);
    } else if (document.ImageArea.attachEvent) {
      document.ImageArea.attachEvent("onload", onImageLoad);
      document.ImageArea.attachEvent("onerror", unsetLoading);
      document.ImageArea.attachEvent("onabort", unsetLoading);
    }

    load_flg = true;
    document.getElementById('ImageArea').src = getPictureSrc(path);
    document.getElementById('ThumbnailArea').src = getThumbnailSrc(path);
    document.getElementById('InfoLink').href = getExifInfoHref(path);
    document.getElementById('loadingText').style.display = "block";

    toggleImageLayer(false);
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

function onImageLoad() {
    const contentArea = document.getElementById('ContentArea');
    const area = document.getElementById('ImageArea');
    const imageSize = {width: area.naturalWidth, height: area.naturalHeight};
    const fitSize = jsUtils.image.getMaximumFitSize(imageSize, {width: contentArea.clientWidth, height: contentArea.clientHeight});
    area.style.width = fitSize.width;
    area.style.height = fitSize.height;
    toggleImageLayer(true);
    unsetLoading();
}

function toggleImageLayer(sw) {
    document.getElementById('ImageArea').style.display = sw ? "block" : "none";
    document.getElementById('ThumbnailArea').style.display = sw ? "none" : "block";
}

function toggleExifLayer(path) {
    if (document.getElementById('ExifLayer').style.display === "none") {
        document.getElementById('ExifLayer').style.display = "block";
        requestExifData(path);
    } else {
        document.getElementById('ExifLayer').style.display = "none";
    }
}

function requestExifData(path) {
    const ajax = jsUtils.ajax;
    ajax.init();
    ajax.setOnLoading(function(httpRequest) {
        document.getElementById('ExifLayer').innerHTML = "loading...";
    });
    ajax.setOnSuccess(function(httpRequest) {
        showExif(httpRequest)
    });
    ajax.setOnError(function(httpRequest) {
        document.getElementById('ExifLayer').innerHTML = "EXIFを読み取れませんでした";
    });

    const query = "mode=exif&dir=" + params.dir + "&file=" + path;
    ajax.post(stockerConfig.uri.picture_viewer.exif_info, query);
}

function showExif(httpRequest) {
    var exif = new Object();
    const xml = jsUtils.xml;
    const exif_info = xml.getFirstFoundChildNode(httpRequest.responseXML, "exif_info");
    const groups = xml.getChildNodes(exif_info, "group");

    for (var i=0; i<groups.length; i++) {
        const group_name = xml.getAttributes(groups[i]).name;
        if (group_name === "0") {
            const data = xml.getChildNodes(groups[i], "data");
            if (data) {
                for (var j=0; j<data.length; j++) {
                    const name = xml.getAttributes(data[j]).name;
                    if (name === "Manufacturer") {
                        exif.maker = data[j].textContent;
                    } else if (name === "Model") {
                        exif.model = data[j].textContent;
                    }
                }
            }
        } else if (group_name === "EXIF") {
            const data = xml.getChildNodes(groups[i], "data");
            if (data) {
                for (var j=0; j<data.length; j++) {
                    const name = xml.getAttributes(data[j]).name;
                    if (name === "Exif_Version") {
                        exif.version = data[j].textContent;
                    } else if (name === "Pixel_X_Dimension") {
                        exif.width = data[j].textContent;
                    } else if (name === "Pixel_Y_Dimension") {
                        exif.height = data[j].textContent;
                    } else if (name === "Date_and_Time__Original_") {
                        exif.created_at = data[j].textContent;
                    } else if (name === "F-Number") {
                        exif.f = data[j].textContent;
                    } else if (name === "Exposure_Time") {
                        exif.exposure_time = data[j].textContent;
                    } else if (name === "ISO_Speed_Ratings") {
                        exif.iso = data[j].textContent;
                    } else if (name === "Exposure_Bias") {
                        exif.exposure_bias = data[j].textContent;
                    } else if (name === "Focal_Length") {
                        exif.focal = data[j].textContent;
                    }
                }
            }
        }
    }

    const content = `
<h3>EXIF情報</h3>
<table class="ExifTable">
<tr><th>EXIFバージョン</th><td>${exif.version}</td></tr>
<tr><th>幅 x 高さ</th><td>${exif.width} x ${exif.height}</td></tr>
<tr><th>作成日時</th><td>${exif.created_at}</td></tr>
<tr><th>メーカー</th><td>${exif.maker}</td></tr>
<tr><th>モデル</th><td>${exif.model}</td></tr>
<tr><th>絞り値</th><td>${exif.f}</td></tr>
<tr><th>露出時間</th><td>${exif.exposure_time}</td></tr>
<tr><th>ISO感度</th><td>${exif.iso}</td></tr>
<tr><th>露出補正</th><td>${exif.exposure_bias}</td></tr>
<tr><th>焦点距離</th><td>${exif.focal}</td></tr>
</table>`;

    document.getElementById('ExifLayer').innerHTML = content;
}

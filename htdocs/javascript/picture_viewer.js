/* global jsUtils, stockerConfig */

var load_flg = false;
var load_again = -1;
var filename = "";
var images = new Array();

let params, rootDir, upPath;

window.addEventListener("load", function(event) {
    params = jsUtils.url.getRawParams();

    stocker.components.getFileProperties(params.dir, params.file, function(properties) {
        document.title = properties.name;
        document.getElementById('fileNameArea').textContent = properties.name;
        filename = properties.name;
        getImageList(params.dir, properties.up_path);

        rootDir = params.dir;
        upPath  = properties.up_path;

        setSrc({
            name: properties.name,
            path: params.file,
            video: stocker.supportTypes.browserPlayableMovie().test(properties.name) ? true : false
        });
    }, function(error) {
        console.warn(error);
    });
});

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
    if (name_elem != null && path_elem != null) {
      var name = name_elem.item(0).firstChild.data;
      var path = path_elem.item(0).firstChild.data;

      if (stocker.supportTypes.pattern.image.test(name) || stocker.supportTypes.browserPlayableMovie().test(name)) {
        var img = new Object();

        img.name = name;
        img.path = path;
        img.video = stocker.supportTypes.browserPlayableMovie().test(name) ? true : false;
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
    document.getElementById('prevButton').onclick = function() {
        changeImage(index - 1);
    };
    document.getElementById('nextButton').onclick = function() {
        changeImage(index + 1);
    };

    const disp_num = index + 1;
    document.getElementById('control_field').innerHTML = disp_num + "/" + images.length;
}

function changeImage(index) {
    if (index < 0 || images.length <= index) {
        return;
    }

    if (load_flg === true) {
        load_again = index;
        return;
    }

    setSrc(images[index]);
    renewControlField(index);
}

function setSrc(img) {
    document.getElementById('ExifLayer').style.display = "none";

    document.title = img.name;
    document.getElementById('fileNameArea').innerHTML = img.name;

    const path = img.path;
    const src = {
        picture: stockerConfig.uri.picture_viewer.get_picture + "?file=" + path + "&dir=" + params.dir + "&size=640",
        video: stockerConfig.uri.get_file + "?mime=video/mp4&file=" + path + "&dir=" + params.dir,
        poster: stockerConfig.uri.converter.movie_img + "?size=640&file=" + path + "&dir=" + params.dir,
        thumbnail: stockerConfig.uri.thumbnail + "?file=" + path + "&dir=" + params.dir,
        exif: "javascript:toggleExifLayer('" + path + "')"
    };

    if (img.video) {
        showVideoArea(src);
    } else {
        imageLoading(src);
    }
}

function showVideoArea(src) {
    load_flg = false;

    document.getElementById('VideoArea').style.display = "block";
    document.getElementById('ImageArea').style.display = "none";

    document.getElementById('VideoArea').src = src.video;
    document.getElementById('VideoArea').poster = src.poster;
    document.getElementById('VideoArea').type = "video/mp4";
}

function imageLoading(src) {
    document.getElementById('VideoArea').style.display = "none";
    document.getElementById('ImageArea').style.display = "block";

    document.ImageArea.addEventListener("load", onImageLoad, false);
    document.ImageArea.addEventListener("error", unsetLoading, false);
    document.ImageArea.addEventListener("abort", unsetLoading, false);

    load_flg = true;
    document.getElementById('ImageArea').src = src.picture;
    document.getElementById('ThumbnailArea').src = src.thumbnail;
    document.getElementById('InfoLink').href = src.exif;
    document.getElementById('loadingText').style.display = "block";

    toggleImageLayer(false);
}

function unsetLoading() {
    document.ImageArea.removeEventListener("load", onImageLoad, false);
    document.ImageArea.removeEventListener("error", unsetLoading, false);
    document.ImageArea.removeEventListener("abort", unsetLoading, false);

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
    area.style.width  = String(fitSize.width) + "px";
    area.style.height = String(fitSize.height) + "px";
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

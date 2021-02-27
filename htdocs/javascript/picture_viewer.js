/* global jsUtils, stocker */

var load_flg = false;
var load_again = -1;
var filename = "";
var images = new Array();

let params, rootDir, upPath;

window.addEventListener("load", function (event) {
    params = jsUtils.url.getRawParams();

    getDirectoryProperties(params.dir, params.file, NaN, NaN, function (data) {
        filename = data.properties.name;
        rootDir = data.properties.root;
        upPath = data.properties.up_path;

        try {
            getDirectoryProperties(rootDir, upPath, NaN, NaN, getImageFiles);
        } catch (e) {
            alert("ERROR: " + e.description);
        }

        setSrc({
            name: filename,
            path: params.file,
            video: stocker.supportTypes.browserPlayableMovie().test(filename) ? true : false
        });
    }, function (error) {
        console.warn(error);
    });
});

function getImageFiles(data) {
    const elements = data.elements;
    if (elements == null) {
        alert("ERROR: mage list has no elements");
        return;
    }

    elements.forEach(function (e) {
        const playable = stocker.supportTypes.browserPlayableMovie().test(e.name) ? true : false
        if (stocker.supportTypes.pattern.image.test(e.name) || playable) {
            images.push({
                name: e.name,
                path: e.path,
                video: playable
            });
        }
    });

    reloadImageList();
}

function reloadImageList() {
    var elm_num = 0;

    for (var i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.name === filename) {
            elm_num = i;
        }
    }

    renewControlField(elm_num);
}

function renewControlField(index) {
    document.getElementById('prevButton').onclick = function () {
        changeImage(index - 1);
    };
    document.getElementById('nextButton').onclick = function () {
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
    document.getElementById('fileNameArea').textContent = img.name;

    const path = img.path;
    const src = {
        vgaImage: stocker.uri.htdocs_root + "/api/v1/media/" + params.dir + "/" + path + "/vga",
        video: stocker.uri.htdocs_root + "/api/v1/storage/" + params.dir + "/" + path + "/raw",
        thumbnail: stocker.uri.htdocs_root + "/api/v1/media/" + params.dir + "/" + path + "/thumbnail",
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
    document.getElementById('VideoArea').poster = src.vgaImage;
    document.getElementById('VideoArea').type = "video/mp4";
}

function imageLoading(src) {
    document.getElementById('VideoArea').style.display = "none";
    document.getElementById('ImageArea').style.display = "block";

    document.ImageArea.addEventListener("load", onImageLoad, false);
    document.ImageArea.addEventListener("error", unsetLoading, false);
    document.ImageArea.addEventListener("abort", unsetLoading, false);

    load_flg = true;
    document.getElementById('ImageArea').src = src.vgaImage;
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
    const imageSize = { width: area.naturalWidth, height: area.naturalHeight };
    const fitSize = jsUtils.image.getMaximumFitSize(imageSize, { width: contentArea.clientWidth, height: contentArea.clientHeight });
    area.style.width = String(fitSize.width) + "px";
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
    document.getElementById('ExifLayer').innerHTML = "loading...";

    stocker.api.media.getExif(params.dir, path).then(showExif)
        .catch(function (error) {
            console.warn(error);
            document.getElementById('ExifLayer').innerHTML = "EXIFを読み取れませんでした";
        });
}

function showExif(json) {
    let exif = new Object();
    if (json['0']) {
        for (const data of json['0']) {
            if (data.name === "Manufacturer") {
                exif.maker = data.value;
            } else if (data.name === "Model") {
                exif.model = data.value;
            } else if (data.id === "0x0100") {
                exif.width = data.value;
            } else if (data.id === "0x0101") {
                exif.height = data.value;
            }
        }
    }
    if (json['EXIF']) {
        for (const data of json['EXIF']) {
            if (data.name === "Exif Version") {
                exif.version = data.value;
            } else if (!exif.width && data.name === "Pixel X Dimension") {
                exif.width = data.value;
            } else if (!exif.height && data.name === "Pixel Y Dimension") {
                exif.height = data.value;
            } else if (data.name === "Date and Time (Original)") {
                exif.created_at = data.value;
            } else if (data.name === "F-Number") {
                exif.f = data.value;
            } else if (data.name === "Exposure Time") {
                exif.exposure_time = data.value;
            } else if (data.name === "ISO Speed Ratings") {
                exif.iso = data.value;
            } else if (data.name === "Exposure Bias") {
                exif.exposure_bias = data.value;
            } else if (data.name === "Focal Length") {
                exif.focal = data.value;
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

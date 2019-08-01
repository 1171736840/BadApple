window.onload = function () {
    var mainHandle = getMainHandle(video, canvas);

    //是否在控制台输出
    writeToConsole.onchange = console.clear;

    //视频播放相关
    video.onplay = function () {
        playButton.innerText = "暂停";
        console.clear();
        mainHandle.run();
    }
    video.onpause = function () {
        mainHandle.sotp();
        playButton.innerText = "播放";
    }
    video.onended = video.onpause;
    playButton.onclick = function () {
        video.paused ? video.play() : video.pause();
    }

    //获取处理类型相关
    mainHandle.setHandleType(document.querySelectorAll("input[name='handleType']:checked")[0].id);
    document.querySelectorAll("input[name='handleType']").forEach(function (el) {
        el.onclick = function () {
            mainHandle.setHandleType(this.id);
        }
    });

    //选择上传图片时处理函数
    document.getElementById("file").onchange = function () {
        var reads = new FileReader();
        reads.readAsDataURL(this.files[0]);
        reads.onload = function () {
            mainHandle.handle.photo = getPhotoHandle(reads.result, canvas);
        };
    }
}

//主处理器，由主处理器进行总控制
function getMainHandle(video, canvas) {
    //上一帧数据，输出到控制台中用得到
    var prevFrameData = null;
    var play = false;
    var ctx = canvas.getContext('2d');
    var handleType = "";
    var infoHandle = getInfoHandle();

    //图片处理函数
    var handleFuncMap = {
        "color": getColorHandle(),
        "rainbow": getRainbowHandle(canvas),
        "photo": getPhotoHandle("img/photo.jpg", canvas),
    }

    var traceHandle = getTraceHandle();

    function run() {
        //记录时间帧数等信息
        infoHandle.record();
        //将视频当前帧绘制到canvas中
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (handleType !== "original") {
            //获取颜色数组
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);


            if (edge.checked) {
                edgeHandle(imageData)
            }


            //选择对应的处理函数进行处理
            handleFuncMap[handleType](imageData, infoHandle);

            if (trace.checked) {
                traceHandle(imageData, infoHandle);
            }
            //将处理后的数组放回到canvas中
            ctx.putImageData(imageData, 0, 0);
        }
        //是否输出到浏览器控制台中
        if (writeToConsole.checked) {
            writeToConsloe();
        }
        //是否继续处理下一帧
        if (play) {
            setTimeout(run, 0);
        }
    }

    //输出到浏览器控制台
    function writeToConsloe() {
        var frameData = canvas.toDataURL("image/png");
        if (prevFrameData !== frameData) {
            console.log("%c ", "font-size: 1px;padding: " + (canvas.height / 2) +
                "px " + (canvas.width / 2) + "px;background-image: url(" + frameData + ");background-size: contain;background-repeat: no-repeat;");
            prevFrameData = frameData;
        }
    }

    return {
        run() {
            play = true;
            run();
            infoHandle.run();
        },
        sotp() {
            infoHandle.stop();
            play = false;
        },
        handle: handleFuncMap,
        setHandleType(type) {
            handleType = type;
        }
    }
}

//帧数时间信息记录处理器
function getInfoHandle() {
    //上一帧到当前帧使用时长
    var useTime = 0;
    //当前帧时间
    var time = new Date().getTime();
    var play = false;

    //显示帧数信息
    function run() {
        useTimeEl.innerText = useTime;
        FPSEl.innerText = parseInt(1000 / useTime);
        if (play) {
            setTimeout(run, 100);
        }
    }

    return {
        run() {
            play = true;
            run();
        },
        record() {
            //计算帧数信息
            var newTime = new Date().getTime();
            useTime = newTime - time;
            time = newTime;
        },
        stop() {
            play = false;
        },
        getTime() { return time },
        getUseTime() { return useTime }
    }
}

//照片处理器
function getPhotoHandle(src, canvas) {
    var photoData = null;
    //根据图片路径获取图片数据
    !function () {
        var img = new Image();
        img.src = src;
        img.onload = function () {
            var can = document.createElement("canvas");
            var ct = can.getContext("2d");
            can.width = canvas.width;
            can.height = canvas.height;
            //计算图片绘制的位置
            var drawTop = 0, drawLeft = 0, drawHeight = can.height, drawWidth = can.width;
            if (img.width < img.height) {
                drawHeight = can.width / img.width * img.height;
                drawTop = 0 - (drawHeight - can.height) / 2;
            } else {
                drawWidth = can.height / img.height * img.width;
                drawLeft = 0 - (drawWidth - can.width) / 2;
            }
            //绘制img并获得对应的Data
            ct.drawImage(img, drawLeft, drawTop, drawWidth, drawHeight);
            photoData = ct.getImageData(0, 0, can.width, can.height);
        }
    }();

    return function (imageData, infoHandle, maskData) {
        var data = imageData.data;
        maskData = maskData || photoData;
        if (maskData) {
            for (var i = 0; i < data.length; i += 4) {  //这里 i 每次加 4 是因为这个颜色值是 R G B A 四个通道表示的
                data[i] = maskData.data[i] * (data[i] / 255);
                data[i + 1] = maskData.data[i + 1] * (data[i + 1] / 255);
                data[i + 2] = maskData.data[i + 2] * (data[i + 2] / 255);
            }
        }
    }
}

//彩色处理器
function getColorHandle() {
    var color = [255, 0, 0];
    return function (imageData, infoHandle) {
        //根据每帧所用时间来计算要增加或减少的颜色值
        var step = infoHandle.getUseTime() / 8;
        var data = imageData.data;
        addColor(color, step);
        for (var i = 0; i < data.length; i += 4) {  //这里 i 每次加 4 是因为这个颜色值是 R G B A 四个通道表示的
            data[i] = color[0] * (data[i] / 255);
            data[i + 1] = color[1] * (data[i + 1] / 255);
            data[i + 2] = color[2] * (data[i + 2] / 255);
        }
    }
}

//在原有颜色的基础上再增加一定的颜色
function addColor(color, step) {

    //如果一次增加太多会导致通道颜色值溢出，要用递归分多次处理
    if (step > 255) {
        addColor(color, step - 255);
        step = 255;
    }

    var r = color[0], g = color[1], b = color[2];

    if (r === 255 && g === 0) {
        b += step;
        if (b > 255) {  //将多余的颜色值算进下一次计算的颜色通道中
            r -= b - 255;
            b = 255;
        }
    } else if (b === 255 && g === 0) {
        r -= step;
        if (r < 0) {
            g = 0 - r;
            r = 0;
        }
    } else if (b === 255 && r === 0) {
        g += step;
        if (g > 255) {
            b -= g - 255;
            g = 255;
        }
    } else if (g === 255 && r === 0) {
        b -= step;
        if (b < 0) {
            r = 0 - b;
            b = 0;
        }
    } else if (g === 255 && b === 0) {
        r += step;
        if (r > 255) {
            g -= 255 - r;
            r = 255;
        }
    } else if (r === 255 && b === 0) {
        g -= step;
        if (g < 0) {
            b = 0 - g;
            g = 0;
        }
    }

    color[0] = r;
    color[1] = g;
    color[2] = b;
    return color;
}

//彩虹处理器
function getRainbowHandle(canvas) {
    var colorData = null;
    !function () {
        var step = 1536 / canvas.width;
        var color = [255, 0, 0];
        colorData = new Array(canvas.width * 4);
        for (var i = 0; i < colorData.length; i += 4) {
            addColor(color, step);
            colorData[i] = color[0];
            colorData[i + 1] = color[1];
            colorData[i + 2] = color[2];
        }
    }();

    var speed = 0;
    return function (imageData, infoHandle) {
        var data = imageData.data;
        speed += 4 * parseInt(infoHandle.getUseTime() / 8);  //彩虹移动速度
        var aisle = imageData.width * 4;    //X轴所有的像素的颜色的通道总数

        for (var i = 0, j = 0; i < data.length; i += 4) {  //这里 i 每次加 4 是因为这个颜色值是 R G B A 四个通道表示的
            j = (i % aisle + speed) % colorData.length;
            data[i] = colorData[j] * (data[i] / 255);
            data[i + 1] = colorData[j + 1] * (data[i + 1] / 255);
            data[i + 2] = colorData[j + 2] * (data[i + 2] / 255);
        }

    }
}

//边缘处理器
function edgeHandle(imageData) {
    var data = imageData.data;
    var width = imageData.width;
    var copy = data.slice();

    for (var i = 0; i < data.length; i += 4) {
        if (copy[i] > 128 && (copy[i - 4] < 128 || copy[i + 4] < 128 || copy[i - 4 * width] < 128 || copy[i + 4 * width] < 128)) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }
}

//痕迹处理器
function getTraceHandle() {
    var trace = null;   //上一帧数据

    return function (imageData, infoHandle) {
        if (trace === null) { trace = imageData.data; return; }

        var step = 0.9 - infoHandle.getUseTime() / 1000;
        if (step < 0) step = 0;
        var data = imageData.data;

        //遍历对比，如果背景为黑色，则显示上一帧数据，并进行淡化处理
        for (var i = 0; i < data.length; i += 4) {
            if (data[i] === 0.0 && data[i + 1] === 0.0 && data[i + 2] === 0.0) {
                if (trace[i] > 0) data[i] = trace[i] * step;
                if (trace[i + 1] > 0) data[i + 1] = trace[i + 1] * step;
                if (trace[i + 2] > 0) data[i + 2] = trace[i + 2] * step;
            }
        }

        trace = data;
    }
}
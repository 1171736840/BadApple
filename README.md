# BrowserConsoleVideo
用JavaScript在浏览器控制台中输出观看视频（BadApple!!）


###思路
原理很简单，就是获取视频的每一帧图像，然后Console中输出即可
观看地址：https://www.xuyanwu.cn/BadApple/
###代码
```html
<!DOCTYPE >
<html>
	<head>
		<meta charset="utf-8" />
		<title>Bad Apple!!</title>
	</head>
	<style>
		body {
			text-align: center;
		}
		
		#play-pause {
			width: 100%;
			max-width: 300px;
			height: 40px;
			margin: 20px;
			background-color: #fff;
			border: 1px solid #00c1de;
			color: #00c1de;
			cursor: pointer;
		}
		
		#play-pause:hover {
			background-color: #00c1de;
			color: #fff;
		}
	</style>

	<body>
		<video height="500" width="100%" id="video">
			<source src="vedio/Bad Apple.mp4"></source>
		</video>
		<div>
			<button id="play-pause" onclick="ChangeButtonText()">播放</button>
		</div>
		<div class="info">
			请按F12打开控制台Console标签页观看视频！
		</div>
		<script>
			var video = document.getElementById("video");
			var play = false;

			function ChangeButtonText() {
				if(video.paused) {
					document.getElementById("play-pause").innerText = "暂停";
					video.play();
					play = true;
					captureImage();
				} else {
					play = false;
					video.pause();
					document.getElementById("play-pause").innerText = "播放";
				}
			}

			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext('2d');
			var oldSrc = "";
			video.oncanplay = function() {
				canvas.width = video.height / video.videoHeight * video.videoWidth;
				canvas.height = video.height;
			}

			function captureImage() {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				var src = canvas.toDataURL("image/png");
				if(oldSrc !== src) {
					console.log("%c+", "font-size: 1px;padding: " + (canvas.height / 2) +
						"px " + (canvas.width / 2) + "px;background-image: url(" + src + ");background-size: contain;background-repeat: no-repeat;");
					oldSrc = src
				}
				if(play) {
					setTimeout(captureImage, 0);
				}
			};
		</script>
	</body>

</html>
```

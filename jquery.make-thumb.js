/*
kairyou, 2013-08-01

size选项: contain: 等比缩放并拉伸, 图片全部显示; cover: 等比缩放并拉伸, 图片完全覆盖容器; auto 图片不拉伸, 居中显示
fill: 图片小于缩略图尺寸时, 是否填充(false: 缩略图宽高自动缩放到适应图片, true: 缩略图尺寸不变)
stretch: 小图是否强制拉伸以适应缩略图的尺寸(size = auto/contain时)

注意: 添加图片水印不能使用跨域的图片
最好在 http开头的地址 下测试

http://localhost:8080/leon/html5-make-thumb/index.html
*/

(function(window, $, undefined) {
    'use strict';
    // caches
    $.support.filereader = !!(window.File && window.FileReader && window.FileList && window.Blob);
    var setting = {
        width: 0, // thumbnail width
        height: 0, //thumbnail height
        fill: false, // fill color when the image is smaller than thumbnails size.
        background: '#fff', // fill color‎
        type: 'image/jpeg', // mime-type for thumbnail ('image/jpeg' | 'image/png')
        size: 'contain', // CSS3 background-size: contain | cover | auto
        mark: {}, // watermark
        // text watermark.
        // mark = {padding: 5, height: 18, text: 'test', color: '#000', font: '400 18px Arial'} // font: normal, bold, italic
            // bgColor: '#ccc' (background color); bgPadding: 5 (padding)
        // image watermark. (Note: cross-domain is not allowed)
        // mark = {padding: 5, src: 'mark.png', width: 34, height: 45};
        stretch: false, // stretch image(small versions) to fill thumbnail (size = auto | contain)
        success: null, // call function after thumbnail has been created.
        error: null // error callback
    };
    var $body = $('body');
    var IMG_FILE = /image.*/; // var TEXT_FILE = /text.*/;

    $.fn.makeThumb = function(options) {
        var opts = {};
        $.extend(opts, setting, options);
        var $self = this;
        // console.log($self);
        // alert(navigator.userAgent);alert(window.FileReader); // android 2.3.7 don't support
        if (!$.support.filereader) return;
        var size = opts.size;
        $self.change(function() {
            var self = this;
            var files = self.files;
            var dataURL = '';
            // console.log(files.length);
            if (!files.length) return;

            var file = files[0];
            var fr = new FileReader();
            // console.log('fileInfo:', file);

            // creat <canvas>
            var $canvas = $('<canvas></canvas>'),
                canvas = $canvas[0],
                context = canvas.getContext('2d');
            var image;
            var imageSize, targetSize;
            var targetH, targetW, tragetX, tragetY;
            var ratio;
            var callback = function(fEvt) {
                // $canvas.appendTo($body).hide();
                dataURL = canvas.toDataURL(opts.type); // 'image/jpeg'
                // debug: show thumb
                // var thumb = new Image();thumb.src = dataURL;$(thumb).appendTo($body);

                if ($.isFunction(opts.success)) {
                    targetSize = {width: targetW, height: targetH};
                    opts.success.apply(self, [dataURL, targetSize, file, imageSize, fEvt]);
                }
                $canvas.remove(); // delete canvas
            };
            var mpImg = new MegaPixImage(file);
            var drawImage = function(fEvt, exif) {
                var orientation = exif.Orientation;

                canvas.width = opts.width;
                canvas.height = opts.height;

                // use mpImg
                if (opts.background) {
                    context.fillStyle = opts.background;
                    context.fillRect(0, 0, opts.width, opts.height);
                }

                mpImg.render(canvas, { maxWidth: opts.width, maxHeight: opts.height, orientation: orientation });
                return callback(fEvt);
            };
            if (IMG_FILE.test(file.type)) {
                // console.log('file.name:', file.name);
                fr.onerror = function(fEvt) { // error callback
                    if ($.isFunction(opts.error)) opts.error.apply(self, [file, fEvt]);
                };
                fr.onload = function(fEvt) { // onload success
                    // console.log(fEvt);
                    var target = fEvt.target;
                    var result = target.result;
                    // load img
                    image = new Image();
                    var exif;
                    image.onload = function() { // imgW / height
                        drawImage.apply(null, [fEvt, exif]);
                    };
                    // Converting the data-url to a binary string
                    var base64 = result.replace(/^.*?,/,'');
                    var binary = atob(base64);
                    var binaryData = new BinaryFile(binary);

                    // get EXIF data
                    exif = EXIF.readFromBinaryFile(binaryData);
                    // console.log(exif);
                    // alert(file.name +': '+ exif.Orientation);

                    image.src = result;
                };
                fr.readAsDataURL(file);
                // 用fr.readAsBinaryString(file); 也要用binaryajax(exif对binaryajax的方法有依赖), 而且返回的图片是空白
                // 猜测是没有用image.onload里面去drawImage导致.
            }

        });
    };
})(window, jQuery);

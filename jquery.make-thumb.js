/*
kairyou, 2013-08-01
update: 2015-03-03, Chrome4X/IE11空白; +before/always function; 优化上传效率;

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
        before: null, // call function before process image.
        done: null, // success function: call function after thumbnail has been created.
        fail: null, // error function
        always: null // complete function(done|fail)
    };
    
    var $body = $('body');
    var IMG_FILE = /image.*/; // var TEXT_FILE = /text.*/;
    var dataURItoBlob = function (dataURI, mime) { // convert base64 to raw binary data
        var blob;
        // BlobBuilder and ArrayBuffer are now deprecated
        // github.com/blueimp/JavaScript-Canvas-to-Blob 
        // stackoverflow.com/q/15639070/2305701
        var support = !!($.support.filereader && window.Uint8Array); //|| window.ArrayBuffer, window.FormData
        if (!support) return blob;

        var arr = dataURI.split(',');
        var byteString = atob(arr[1]); // decodeURI(arr[1])
        mime = mime || arr[0].split(':')[1].split(';')[0] || 'image/jpeg';

        // var ab = new ArrayBuffer(byteString.length);var ia = new Uint8Array(ab); blob = new Blob([ab], { type: mime });
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        // write the ArrayBuffer to a blob, and you're done
        blob = new Blob([ia], { type: mime });
        return blob;
    };
    $.fn.makeThumb = function(options) {
        var opts = {};
        $.extend(opts, setting, options);
        var $self = this;
        // console.log($self);
        // alert(navigator.userAgent);alert(window.FileReader); // android 2.3.7 don't support
        if (!$.support.filereader) return;
        var size = opts.size;
        var before = opts.before,
            always = opts.always || opts.complete,
            done = opts.done || opts.success,
            fail = opts.fail || opts.error;
        $self.change(function() {
            var self = this;
            var files = self.files;
            var dataURL = '', blob;
            // console.log(files.length);
            if ($.isFunction(before)) before();
            if (!files.length) {
                if ($.isFunction(fail)) fail.apply(self, []);
                if ($.isFunction(always)) always();
                return;
            }

            var file = files[0];
            var fr = new FileReader();
            // console.log('fileInfo:', file);

            // creat <canvas>
            var $canvas = $('<canvas></canvas>'),
                canvas = $canvas[0],
                context = canvas.getContext('2d');
            var image, fEvt;
            var imageSize, targetSize;
            var targetH, targetW, tragetX, tragetY;
            var ratio;
            var callback = function() {
                // $canvas.appendTo($body).hide();
                dataURL = canvas.toDataURL(opts.type); // 'image/jpeg'
                blob = dataURItoBlob(dataURL);
                // debug: show thumb
                // var thumb = new Image();thumb.src = dataURL;$(thumb).appendTo($body);

                if ($.isFunction(done)) {
                    targetSize = {width: targetW, height: targetH};
                    done.apply(self, [dataURL, blob, targetSize, file, imageSize, fEvt]);
                }
                if ($.isFunction(always)) always();
                $canvas.remove(); // delete canvas
            };
            var mpImg = new MegaPixImage(file);
            mpImg.onrender = function() {
                callback();
            }
            var drawImage = function(exif) {
                var orientation = exif.Orientation;

                canvas.width = opts.width;
                canvas.height = opts.height;

                // use mpImg
                if (opts.background) {
                    context.fillStyle = opts.background;
                    context.fillRect(0, 0, opts.width, opts.height);
                }
                mpImg.render(canvas, { maxWidth: opts.width, maxHeight: opts.height, orientation: orientation });
            };
            if (IMG_FILE.test(file.type)) {
                // console.log('file.name:', file.name);
                fr.onerror = function(fEvent) { // error callback
                    fEvt = fEvent;
                    if ($.isFunction(fail)) fail.apply(self, [file, fEvt]);
                    if ($.isFunction(always)) always();
                };
                fr.onload = function(fEvent) { // onload success
                    fEvt = fEvent;
                    // console.log(fEvt);
                    var target = fEvt.target;
                    var result = target.result;
                    // load img
                    image = new Image();
                    var exif;
                    image.onerror = function(){
                        if ($.isFunction(fail)) fail.apply(self, [file]);
                        if ($.isFunction(always)) always();
                    };
                    image.onload = function() { // imgW / height
                        drawImage.apply(null, [exif]);
                    };
                    // Converting the data-url to a binary string
                    var base64 = result.replace(/^.*?,/,'');
                    var binary = atob(base64);
                    var binaryData = new BinaryFile(binary);

                    // get EXIF data
                    exif = EXIF.readFromBinaryFile(binaryData);
                    // console.log(exif);
                    // console.log(file.name +': '+ exif.Orientation);

                    image.src = result;
                };
                fr.readAsDataURL(file);
                // 用fr.readAsBinaryString(file); 也要用binaryajax(exif对binaryajax的方法有依赖), 而且返回的图片是空白
                // 猜测是没有用image.onload里面去drawImage导致.
            }

        });
    };
})(window, jQuery);

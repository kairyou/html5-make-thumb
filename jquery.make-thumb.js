/*
kairyou, 2013-01-08
最好在 http开头的地址 下测试
*/

(function(window, $, undefined) {
    'use strict';
    // caches
    $.support.filereader = !!(window.File && window.FileReader && window.FileList && window.Blob);
    var setting = {
        width: 0, // 固定缩略图宽
        height: 0, // 固定缩略图高
        fill: false, // 是否填充留白 (false: 宽高不限制死, 缩图不会有留白) // size:cover 无留白
        background: '#fff', // 生成图片填充背景
        type: 'image/jpeg', // 生成图片类型. 'image/png'(png+background:null: 生成透明png)
        size: 'contain', // contain: 等比缩放并拉伸(stretch:true), 图片全部显示; cover: 等比缩放并拉伸, 图片完全覆盖容器; auto 图片不拉伸, 居中显示
        mark: {}, // 添加水印
        // 文字水印, 文字背景: bgColor: '#ccc', bgPadding: 5, // font: normal, bold, italic
        // mark = {padding: 5, height: 18, text: 'test', color: '#000', font: '400 18px Arial'}
        // 图片水印, 注意跨域
        // mark = {padding: 5, src: 'mark.png', width: 34, height: 45};
        stretch: false, // 小图是否拉伸, 照顾(size: auto/contain 时)的特殊需求
        success: null, // 生成缩略图后 callback
        error: null // 出错callback
    };
    var $body = $('body');
    var IMG_FILE = /image.*/;
    // var TEXT_FILE = /text.*/;
    // 缩放比
    var getRatio = function(src, traget, size) {
        var ret;
        var ratioS = src.width / src.height,
            ratioT = traget.width / traget.height;
        // console.log('原图宽高比 vs 目标宽高比:', ratioS > ratioT ? '宽度变化大' : '高度变化大');
        if(size === 'cover'){ //background-size: cover; (等比缩放, 图片完全覆盖容器)
            // 变化小的先 100%
            ret = ratioS > ratioT ? traget.height / src.height : traget.width / src.width;
        } else { // contain, auto
        // } else if (size === 'contain') { //background-size: contain; (等比缩放, 图片全部显示)
            // 变化大的先 100%
            ret = ratioS > ratioT ? traget.width / src.width : traget.height / src.height;
        }
        return ret;
    };
    $.fn.makeThumb = function(options) {
        var opts = {};
        $.extend(opts, setting, options);
        var $self = this;
        // console.log($self);
        if (!$.support.filereader) return;
        var size = opts.size;
        $self.change(function() {
            var self = this;
            var files = self.files, file, reader;
            var dataURL = '';
            // console.log(files.length);
            if (!files.length) return;

            file = files[0];
            reader = new FileReader();
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
            var drawImage = function(fEvt) {
                // console.log(fEvt);return;
                canvas.width = opts.width;
                canvas.height = opts.height;

                imageSize = {width: image.width, height: image.height};
                targetSize = {width: opts.width, height: opts.height};
                // console.log(imageSize);
                
                // test
                // size = 'auto'; // contain, cover, auto
                // opts.stretch = true;
                // opts.fill = true;
                

                ratio = getRatio(imageSize, targetSize, size);
                targetW = image.width * ratio;
                targetH = image.height * ratio;
                tragetX = (opts.width - targetW) * 0.5;
                tragetY = (opts.height - targetH) * 0.5;

                if (size === 'contain') {
                    if (!opts.stretch) { // 不拉伸
                        if (image.width < targetW) targetW = image.width;
                        if (image.height < targetH) targetH = image.height;
                    }
                    // 不留白
                    if (!opts.fill) {
                        tragetX = 0;
                        tragetY = 0;
                        canvas.width = targetW;
                        canvas.height = targetH;
                    }
                } else if (size === 'auto') {
                    if (!opts.stretch) {
                        targetW = image.width;
                        targetH = image.height;
                    } else { // 小图拉伸, 大图实际尺寸
                        if (image.width > targetW) targetW = image.width;
                        if (image.height > targetH) targetH = image.height;
                    }
                    tragetX = (opts.width - targetW) * 0.5;
                    tragetY = (opts.height - targetH) * 0.5;
                    // 不留白
                    if (!opts.fill) {
                        if (targetW > targetH) {
                            tragetY = 0;
                            canvas.height = targetH;
                        } else {
                            tragetX = 0;
                            canvas.width = targetW;
                        }
                        if (image.width < canvas.width) {
                            tragetX = 0;
                            canvas.width = targetW;
                        }
                        if (image.height < canvas.height) {
                            tragetY = 0;
                            canvas.height = targetH;
                        }
                    }
                }

                // set img background color
                if (opts.background) {
                    context.fillStyle = opts.background;
                    context.fillRect(0, 0, opts.width, opts.height);
                }

                // console.log(ratio, image.width +'->'+ targetW, image.height +'->'+ targetH);
                context.drawImage(image, tragetX, tragetY, targetW, targetH);

                var mark = opts.mark; //  opts.mark || {};
                var markX = 0, markY = 0;

                if (mark.src) {
                    var markImg = new Image();
                    markImg.onload = function() {// 要http访问
                        markX = targetW - mark.width - mark.padding;
                        markY = targetH - mark.height - mark.padding;
                        context.drawImage(markImg, markX, markY, mark.width || markImg.width, mark.height || markImg.height);
                        callback(fEvt);
                    };
                    markImg.src = mark.src;
                } else if(mark.text) {
                    context.font = mark.font;
                    context.textBaseline = 'top'; // top, middle
                    var txtSize = context.measureText(mark.text);
                    txtSize.height = mark.height;
                    // 背景
                    if (mark.bgColor) {
                        var bgPadding = mark.bgPadding * 2;
                        var w = txtSize.width + bgPadding, h = txtSize.height + bgPadding;
                        context.beginPath();
                        markX = targetW - w - mark.padding;
                        markY = targetH - h - mark.padding;
                        // console.log(w, h);
                        context.rect(markX, markY, w, h);
                        context.fillStyle = mark.bgColor;
                        context.fill();
                        mark.padding += mark.bgPadding;
                    }
                    // 文字
                    context.fillStyle = mark.color;
                    markX = targetW - txtSize.width - mark.padding;
                    markY = targetH - txtSize.height - mark.padding;
                    context.fillText(mark.text, markX, markY); // 填充, or: strokeText(边框)
                }

                // background-size：<bg-size> [ , <bg-size> ] (非等比, 拉伸图片. 注: 某个值 可以为 auto)
                // 实际使用中contain或cover差不多了, bg-size在缩略图使用的机会应该不大..
                /*if (size.width || size.height) {
                    targetW = size.width;
                    targetH = size.height;
                    if (!targetW) targetW = image.width * opts.height / targetH;
                    if (!targetH) targetH = image.height * opts.width / targetW;
                }*/
                
                if (!mark.src) callback(fEvt);
            };
            if (IMG_FILE.test(file.type)) {
                // console.log('file.name:', file.name);
                reader.onload = function(fEvt) { // onload success
                    // console.log(fEvt);
                    var target = fEvt.target;
                    // load img
                    image = new Image();
                    image.onload = function(iEvt) {
                        drawImage.apply(null, [fEvt]);
                    };
                    image.src = target.result;
                };
                reader.onerror = function(fEvt) { // error callback
                    if ($.isFunction(opts.error)) opts.error.apply(self, [file, fEvt]);
                };
                reader.readAsDataURL(file);
            }
        });
    };
})(window, jQuery);


html5-make-thumb
================

Create thumbnail with HTML5.


Useage
-------

``` html
<iframe name="ifr" style="display: none;"></iframe> 
<form id="j-form" target="ifr" action="api.php" method="post" enctype="multipart/form-data">
    <input type="file" name="upfile" id="j-file" />
</form>
<script src="jquery.js"></script>
<script src="jquery.make-thumb.js"></script>
```

``` javascript
var $form = $('#j-form');
var $file = $('#j-file');
$file.makeThumb({
    width: 400,
    height: 400,
    mark: {padding: 5, src: 'mark.png', width: 30, height: 30},
    success: function(dataURL, tSize, file, sSize, fEvt) {
        // post data
        var $up = $('<input type="hidden" name="base64">');
        $up.insertAfter($file).val(dataURL);
        $file.remove();
        $form.submit();
    }
});
```

[docs](http://www.fantxi.com/blog/archives/create-thumbnail-images-html5/)

reference
---------
- http://stackoverflow.com/questions/7296426/how-can-i-check-if-the-browser-support-html5-file-upload-formdata-object
- http://www.html5rocks.com/en/tutorials/file/dndfiles/
- https://github.com/Modernizr/Modernizr/blob/master/feature-detects/file-api.js
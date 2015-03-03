<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE);
header('Content-Type:text/html;charset=UTF-8');

// save img
$img = $_POST['base64'];
$blob = $_FILES['blob'];
$upfile = $_FILES['upfile'];

$target = 'tmp.jpg';
// var_dump(isset($blob), isset($img), isset($upfile));

if (isset($blob) && is_uploaded_file($blob['tmp_name']) && $blob['error'] == 0) { // HTML5 blob
    echo 'filename: ' . $blob['name'] . ', ';
    echo 'type: ' . $blob['type'] . ', ';
    echo 'size: ' . ($blob['size'] / 1024) . ' Kb';
    move_uploaded_file($blob['tmp_name'], $target);
} elseif (isset($img)) { // HTML5 dataURI
    // $img = str_replace('data:image/png;base64,', '', $img);
    if (preg_match('/data:([^;]*);base64,(.*)/', $img, $matches)) {
        // $type = $matches[1];
        // $matches[2] = str_replace(' ', '+', $matches[2]);
        $img = base64_decode($matches[2]);
        file_put_contents($target, $img);
    } else {
        echo 'error'; 
    }
} else { # 普通上传
    if (isset($upfile) && is_uploaded_file($upfile['tmp_name']) && $upfile['error'] == 0) {
        echo 'filename: ' . $upfile['name'] . ', ';
        echo 'type: ' . $upfile['type'] . ', ';
        echo 'size: ' . ($upfile['size'] / 1024) . ' Kb';
        move_uploaded_file($upfile['tmp_name'], $target);
    } else {
        echo 'error ' . $upfile['error'];
    }
}
// echo '<br><img src="',$target,'">';
?>
<script>
parent.document.getElementById('ret').innerHTML='<h6>文件来自api返回:<h6><img src="<?php echo $target; ?>">';
</script>
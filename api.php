<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE);
header('Content-Type:text/html;charset=UTF-8');

// save img
$img = $_POST['base64'];

if (isset($img)) { # dataURI
    $target = 'tmp.jpg';
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
    $uploadFile = $_FILES['upfile'];
    // var_dump($uploadFile);
    $target = 'tmp1.jpg';
    if (isset($uploadFile) && is_uploaded_file($uploadFile['tmp_name']) && $uploadFile['error'] == 0) {
        echo 'filename: ' . $uploadFile['name'] . ', ';
        echo 'type: ' . $uploadFile['type'] . ', ';
        echo 'size: ' . ($uploadFile['size'] / 1024) . ' Kb';
        move_uploaded_file($uploadFile['tmp_name'], $target);
    } else {
        echo 'error: ' . $uploadFile['error'];
    }
}
// echo '<br><img src="',$target,'">';
?>
<script>
parent.document.getElementById('ret').innerHTML='<h6>文件来自api返回:<h6><img src="<?php echo $target; ?>">';
</script>
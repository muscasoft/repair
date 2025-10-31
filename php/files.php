<?php
function removeFile($filename): string {
    try {
        if (!is_file($filename)) {
            throw new Exception('File is not a valid file');
        }

        if (!is_writable($filename)) {
            throw new Exception('Insufficient permissions to delete file');
        }

        if (!unlink($filename)) {
            throw new Exception('Failed to delete file');
        }

        return true;
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}

function listFiles($folder): string
{
    try {
        if (!is_dir($folder)) {
            throw new Exception('Folder not found');
        }

        $filenames = array_filter(glob("$folder/*"), 'is_file');
        
        $result = array_map(fn($filename) => [
            'name' => basename($filename),
            'hash' => getHash($filename),
        ], $filenames);

        return json_encode($result);
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}


function getHash($filename): string
{
    $name = basename($filename);
    $size = filesize($filename);
    $mtime = filemtime($filename);
    return hash('sha256', "$name|$size|$mtime");
}
<?php
// 06/11/2025 : Content Type in header set to 'application/json' so all functions should return string or array, no JSON
// 06/11/2025 : Require_once added

require_once __DIR__ . '/general.php';

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

function listFiles($folder): array | string
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

        return $result;
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}
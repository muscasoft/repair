<?php
function getDiskStatisticsForHomeDir(): string {
    $homeDir = getHomeDir();
    return getDiskStatistics($homeDir, 2, 'B');
}

function getHomeDir(): string {
    $homeDir = getenv('HOME') ?: getenv('USERPROFILE');

    if (!$homeDir && function_exists('posix_getuid') && function_exists('posix_getpwuid')) {
        $info = posix_getpwuid(posix_getuid());
        $homeDir = $info['dir'] ?? null;
    }
 
    // If still not found, fallback to current working directory
    if (!$homeDir || !is_dir($homeDir)) {
        $homeDir = getcwd();
    }
    
    return $homeDir;
}

function getDiskStatistics($path = '/', $precision = 2, $unit = 'auto'): string
{
    try {
        $command = sprintf('du -sb %s 2>/dev/null', escapeshellarg($path));
        exec($command, $output, $returnVar);

        if ($returnVar !== 0 || empty($output)) {
            throw new Exception('Failed to run command');
        }

        $parts = preg_split('/\s+/', trim($output[0]));
        $usedBytes = isset($parts[0]) ? (int)$parts[0] : 0;
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
    
    return $usedBytes;
}
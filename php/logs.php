<?php
function getLogData(): array | string
{
    global $configFileName;
    try {
        $CONFIG = getCONFIG();
        $dataDirectory = $CONFIG['datadirectory'];

        $logFile = "$dataDirectory/nextcloud.log";

        if (!file_exists($logFile)) {
            throw new Exception('Log file not found');
        }

        $startDateLogRetrieval = strtotime('-30 days');

        $handle = fopen($logFile, 'r');
        if (!$handle) {
            throw new Exception('Log file could not be opened');
        }

        $logs = [];
        while (($line = fgets($handle)) !== false) {
            $line = trim($line);
            if (empty($line)) continue;

            $logEntry = json_decode($line, true);
            if ($logEntry === null) continue;

            if (isset($logEntry['time'])) {
                $logTime = strtotime($logEntry['time']);
                if ($logTime >= $startDateLogRetrieval) {
                    $logs[] = [
                        'time' => $logEntry['time'],
                        'level' => $logEntry['level'],
                        'app' => $logEntry['app'] ?? '',
                        'user' => $logEntry['user'] ?? '',
                        'message' => $logEntry['message'] ?? ''
                    ];
                }
            }
        }

        fclose($handle);
        return $logs;
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}
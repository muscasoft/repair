<?php
function getLatestBackupFile(): string
{
    global $backupFolder;

    try {
        if (!is_dir($backupFolder)) {
            throw new Exception('Back-up folder not found');
        }

        $files = array_filter(glob("$backupFolder/*"), 'is_file');

        if (!$files) {
            throw new Exception('No files found in back-up folder');
        }

        $latestFile = array_reduce($files, function ($fileA, $fileB) {
            if ($fileA === null) return $fileB;
            return filemtime($fileA) > filemtime($fileB) ? $fileA : $fileB;
        }, null);

        if ($latestFile === null) {
            throw new Exception('No valid files found');
        }

        $mtime = filemtime($latestFile);

        return json_encode([
            "latest_file"   => basename($latestFile),
            "last_modified" => date("Y-m-d H:i:s", $mtime),
            "timestamp"     => $mtime
        ]);        
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}

function listBackupFiles(): string
{
    global $backupFolder;
    return listFiles($backupFolder);
}

function makeBackupDatabase(): string
{
    global $configFileName, $backupFolder;
    try {
        $CONFIG = getCONFIG();

        if (!is_dir($backupFolder)) {
            if (!mkdir($backupFolder, 0755, true)) {
                throw new Exception('Could not create backup directory');
            }
        }

        // --- Create filenames with timestamp ---
        $date = date(format: 'Y-m-d_H-i-s');
        $sqlFile = "$backupFolder/{$CONFIG['dbname']}_backup_$date.sql";
        $tarFile = "$backupFolder/{$CONFIG['dbname']}_backup_$date.tar.gz";

        // --- Do mysqldump ---
        $command = sprintf(
            'mysqldump --single-transaction %s --user=%s --password=%s --host=%s %s > %s 2>&1',
            $CONFIG['mysql.utf8mb4'] ? '--default-character-set=utf8mb4 ' : '',
            escapeshellarg($CONFIG['dbuser']),
            escapeshellarg($CONFIG['dbpassword']),
            escapeshellarg($CONFIG['dbhost']),
            escapeshellarg($CONFIG['dbname']),
            escapeshellarg($sqlFile)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Backup failed\nOutput:\n' . implode('\n', $output));
        }

        // --- Create tar.gz archive ---
        $tarCommand = sprintf(
            'tar -czf %s -C %s %s',
            escapeshellarg($tarFile),
            escapeshellarg($backupFolder),
            escapeshellarg(basename($sqlFile))
        );

        exec($tarCommand, $tarOutput, $tarReturn);

        if ($tarReturn !== 0) {
            throw new Exception('Compression failed\nOutput:\n' . implode('\n', $tarOutput));
        }
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
    // --- Remove the original .sql dump ---
    if (isset($sqlFile)) {
        if (file_exists($sqlFile)) {
            unlink($sqlFile);
        }
    }

    return true;
}

function deleteBackupFiles($filenamesWithHashes): string
{
    global $backupFolder;
    try {
        if (!is_dir($backupFolder)) {
            throw new Exception('Back-up folder not found');
        }

        if (!is_array($filenamesWithHashes)) {
            throw new Exception('Invalid input, expected JSON-array');
        }
 
        foreach ($filenamesWithHashes as $filenameWithHash) {
            if (!isset($filenameWithHash['name'], $filenameWithHash['hash'])) {
                throw new Exception('invalid input');
            }

            $filename = $backupFolder . '/' . basename($filenameWithHash['name']); // beveiliging: strip path traversal

            if (!is_file($filename)) {
                throw new Exception("{$filename}: file not found");
            }

            if (!is_writable($filename)) {
                throw new Exception("{$filename}: Insufficient permissions to delete file");
            }

            $currentHash = getHash($filename);

            if ($currentHash !== $filenameWithHash['hash']) {
                throw new Exception("{$filename}: hash mismatch");
            }

            if (!@unlink($filename)) {
                throw new Exception("{$filename}: delete failed");
            }
        }
        
        return 'Deletion OK';
    } catch (Exception $e) {
        http_response_code(404);
        return $e->getMessage();
    }
}
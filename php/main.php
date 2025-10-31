<?php
// v2 version check included
// mogelijk nog vervangen ' en .  door formatted string en ""
// mogelijk nog vervangen shell_exec door exec
// get fileLocations: $occCommand, $versionFileName, $configFileName and $stepPattern;
include __DIR__ . '/config.php';
include __DIR__ . '/backup.php';
include __DIR__ . '/disk.php';
include __DIR__ . '/files.php';
include __DIR__ . '/general.php';
include __DIR__ . '/setupchecks.php';

$action = $_POST['action'];
switch ($action) {
    case 'GetNCVersion':
        echo getNCVersion();
        break;
    case 'IsUpdateRunning':
        echo !empty(glob(getStepPattern()));
        break;
    case 'ResetUpdateRunning':
        echo removeFile(glob(getStepPattern())[0]);
        break;
    case 'GetDiskStatistics':
        echo getDiskStatisticsForHomeDir();
        break;
    case 'GetLatestBackupFile':
        echo getLatestBackupFile();
        break;
    case 'MakeBackupDatabase':
        echo makeBackupDatabase();
        break;
    case 'ListBackupFiles':
        echo listBackupFiles();
        break;
    case 'DeleteBackupFiles':
        if (!isset($_POST['FilenamesWithHashes'])) {
            http_response_code(404);
            echo json_encode('No FilenamesWithHashes parameter gevonden');
            exit;
        }
        $filenamesWithHashes = json_decode($_POST['FilenamesWithHashes'], true);
        echo deleteBackupFiles($filenamesWithHashes);
        break;
    case 'GetSetupChecks':
        echo json_encode(getSetupChecks());
        break;
    case 'SkipRepairSetupChecks':
        echo json_encode($skipRepairSetupChecks);
        break;
    case 'DefinedActions':
        echo json_encode($definedActions);
        break;
    case 'MimeTypeMigrationAvailable':
        $result = shell_exec("php --define apc.enable_cli=1 $occCommand maintenance:repair --include-expensive");
        echo $result;
        break;
    case 'DatabaseHasMissingIndices':
        $result = shell_exec("php --define apc.enable_cli=1 $occCommand db:add-missing-indices");
        echo $result;
        break;
    case 'SecurityHeaders':
        echo repairSecurityHeaders();
        break;
    default:
        http_response_code(404);
        echo 'error: action not defined';
        break;
}    

function getNCVersion(): string {
    global $versionFileName, $configFileName;
    try {
        // get  $OC_Build;
        if (!file_exists($versionFileName)) {
            throw new Exception('Version file not found');
        };
        require_once $versionFileName;

        $CONFIG = getCONFIG();
    
        global $releaseChannel, $updaterServer;
    
        $updateURL = $updaterServer . '?version=' . str_replace('.', 'x', $CONFIG['version']) . 'xxx'
                                                  . $releaseChannel . 'xx'
                                                  . urlencode($OC_Build) . 'x'
                                                  . PHP_MAJOR_VERSION . 'x'
                                                  . PHP_MINOR_VERSION . 'x'
                                                  . PHP_RELEASE_VERSION;
    
        $curl = curl_init();
        curl_setopt_array($curl, [
                CURLOPT_RETURNTRANSFER => 1,
                CURLOPT_URL => $updateURL,
                CURLOPT_USERAGENT => 'Nextcloud Updater',
        ]);
    
        $response = curl_exec($curl);
        if ($response === false) {
            throw new Exception('Could not do request to updater server: ' . curl_error($curl));
        }
        curl_close($curl);
    
        // Response can be empty when no update is available
        if ($response === '') {
            throw new Exception('Current version: ' . $CONFIG['version'] . '. No update available.');
        }
    
        $xml = simplexml_load_string($response);
        if ($xml === false) {
            throw new Exception('Could not parse updater server XML response');
        }
    
        $response = get_object_vars($xml);
        return 'Current version: ' . $CONFIG['version'] . '. Update available to ' . $response['version'];
    } catch (Exception $e) {
        return $e->getMessage();
    }
}
<?php
function getCONFIG(): array|string {
    global $configFileName;
    if (!file_exists($configFileName)) {
        throw new Exception('Config file not found');
    }
    
    // get $CONFIG;
    require_once $configFileName;
    
    if (!isset($CONFIG)) {
        throw new Exception('Configuration variable not found');
    }
    return $CONFIG;
}

function getStepPattern(): string {
    global $configFileName;
    $CONFIG = getCONFIG();
    $dataDirectory = $CONFIG['datadirectory'];
    if (!isset($dataDirectory)) {
        throw new Exception('Data directory not found');
    }
    return "$dataDirectory/updater-*/.step";
}
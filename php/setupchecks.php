<?php

$skipRepairSetupChecks = [
    'BruteForceThrottler',
    'ForwardedForHeaders',
];
$definedActions = [
    'LogErrors' => false,
    'BruteForceThrottler' => false,
    'MimeTypeMigrationAvailable' => true,
    'ForwardedForHeaders' => false,
    'DatabaseHasMissingIndices' => true,
    'SecurityHeaders' => true,
];

function getSetupChecks(): array {
    global $occCommand;
    $output = shell_exec("php --define apc.enable_cli=1 $occCommand setupchecks --output=json_pretty");
    $obj = json_decode($output);
    $result= [];
    
    // Loop through the object and select only warning and errors (not successes)
    foreach($obj as $groupKey=>$groupValue){
        foreach($groupValue as $itemKey=>$itemValue){
            if ($itemValue->severity !== 'success') {
                array_push($result, (object)[
                    'id' => $itemKey,
                    'name' => $itemValue->name,
                    'severity' => $itemValue->severity,
                    'description' => $itemValue->description,
                    'descriptionParameters' => $itemValue->descriptionParameters,
                    'linkToDoc' => $itemValue->linkToDoc,
                ]);
            }
        }
    }
    
    array_push($result, (object)[
        'logdata' => $obj,
    ]);
    return $result;
}

function repairSecurityHeaders(): string {
    $searchString = <<<SEARCHSTRING
#### DO NOT CHANGE ANYTHING ABOVE THIS LINE ####

ErrorDocument 403 //index.php/error/403
ErrorDocument 404 //index.php/error/404

SEARCHSTRING;
    
    $replaceString = <<<REPLACESTRING
#### DO NOT CHANGE ANYTHING ABOVE THIS LINE ####

<IfModule mod_rewrite.c>
    RewriteCond %{HTTP:X-Forwarded-Proto} !https
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
</IfModule>

Header onsuccess unset Strict-Transport-Security
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" env=HTTPS

ErrorDocument 403 //index.php/error/403
ErrorDocument 404 //index.php/error/404

REPLACESTRING;

    $searchString = str_replace('\r\n', '\n', $searchString);
    $replaceString = str_replace('\r\n', '\n', $replaceString);

    $charsToEscape = ['.', '/', '^', '(', ')', '{', '}', '[', ']', '*', '$', '"'];
    $charsEscaped = ['\.', '\/', '\^', '\(', '\)', '\{', '\}', '\[', '\]', '\*', '\$', '\"'];
    $charsToEscapeLess = ['$'];
    $charsEscapedLess  = ['\$'];
    
    $searchStringEscaped = '/' . str_replace($charsToEscape, $charsEscaped, $searchString) . '$/';
    $replaceStringEscaped = '/' . str_replace($charsToEscape, $charsEscaped, $replaceString) . '$/';
    $replaceStringEscapedLess = str_replace($charsToEscapeLess, $charsEscapedLess, $replaceString);
    
    $filePath = '../../nextcloud/.htaccess';
    if (file_exists($filePath)){
        $fileContents = file_get_contents($filePath);
        
        $foundSearchString = preg_match($searchStringEscaped, $fileContents, $matches);
        switch ($foundSearchString) {
            case 1:
                $fileContents = preg_replace($searchStringEscaped, $replaceStringEscapedLess, $fileContents);
                file_put_contents($filePath, $fileContents);
                $result = 'HSTS section updated';
                break;
            case 0:
                $foundReplaceString = preg_match($replaceStringEscaped, $fileContents, $matches);
                switch ($foundReplaceString) {
                    case 1:
                        $result = 'Nothing done: Updated HSTS section found';
                        break;
                    case 0:
                        $result = 'Nothing done: No HSTS section found';
                        break;
                    default:
                        $result = 'Nothing done: Multiple updated HSTS sections found';
                }
                break;
            default:
                $result = 'Nothing done: Multiple HSTS sections found';
        }
    } else {
        $result = 'Nothing done: .htAccess file not found';
    }
    return $result;
}
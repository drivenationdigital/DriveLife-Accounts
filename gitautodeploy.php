<?php
declare(strict_types=1);

const CLOUDWAYS_API_URL = 'https://api.cloudways.com/api/v1';

/*
 * Load the protected configuration file located outside public_html.
 */
$configFile = 'gitautodeploy-config.php';

if (!file_exists($configFile)) {
    http_response_code(500);
    exit('Deployment configuration file was not found.');
}

$config = require $configFile;

/*
 * Allow only POST requests.
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Only POST requests are allowed.');
}

/*
 * Validate the webhook secret.
 */
$providedSecret = $_GET['secret'] ?? '';

if (
    empty($config['webhook_secret']) ||
    !hash_equals($config['webhook_secret'], $providedSecret)
) {
    http_response_code(403);
    exit('Invalid webhook secret.');
}

/*
 * Send an authenticated request to the Cloudways API.
 */
function callCloudwaysApi(
    string $method,
    string $endpoint,
    string $accessToken,
    array $parameters = []
): object {
    $curl = curl_init();

    if ($curl === false) {
        http_response_code(500);
        exit('Unable to initialize the API request.');
    }

    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_URL => CLOUDWAYS_API_URL . $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_POSTFIELDS => http_build_query($parameters),
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);

    curl_close($curl);

    if ($response === false) {
        http_response_code(500);
        exit('Cloudways API request failed: ' . $curlError);
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        http_response_code($httpCode);
        exit(
            'Cloudways API returned HTTP status ' .
            $httpCode .
            '. Response: ' .
            substr($response, 0, 2000)
        );
    }

    $decodedResponse = json_decode($response);

    if ($decodedResponse === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        exit('Cloudways API returned an invalid response.');
    }

    return $decodedResponse;
}

/*
 * Prepare the Git deployment request.
 */
$deploymentParameters = [
    'server_id' => $config['server_id'],
    'app_id' => $config['app_id'],
    'git_url' => $config['git_url'],
    'branch_name' => $config['branch_name'],
];

if (!empty($config['deploy_path'])) {
    $deploymentParameters['deploy_path'] = $config['deploy_path'];
}

/*
 * Trigger the Git pull operation.
 */
$deploymentResponse = callCloudwaysApi(
    'POST',
    '/git/pull',
    $config['access_token'],
    $deploymentParameters
);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'The Git deployment request was submitted successfully.',
    'response' => $deploymentResponse,
]);
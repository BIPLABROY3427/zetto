<?php

$config = require __DIR__ . '/config.php';

function generateSign(array $data, string $apiKey): string
{
    ksort($data);

    $str = '';

    foreach ($data as $key => $value) {
        if ($str !== '') {
            $str .= '&';
        }

        $str .= $key . '=' . $value;
    }

    return md5($str . $apiKey);
}

$orderNo = $_GET['orderNo'] ?? '';

if (empty($orderNo)) {
    die('Order No Required');
}

$data = [
    'orderNo' => $orderNo,
    'merchNo' => $config['merchant_no']
];

$data['sign'] = generateSign($data, $config['api_key']);

// Query URL from base_url
$queryUrl = rtrim($config['base_url'], '/') . '/api/payIn/query';

$ch = curl_init($queryUrl);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    die('CURL ERROR: ' . curl_error($ch));
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

header('Content-Type: application/json');

echo json_encode([
    'http_code' => $httpCode,
    'request'   => $data,
    'response'  => json_decode($response, true)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
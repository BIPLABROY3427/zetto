<?php

header('Content-Type: application/json');

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

$utr = trim($_GET['utr'] ?? '');

if (empty($utr)) {
    echo json_encode([
        'code' => 400,
        'msg'  => 'UTR required'
    ]);
    exit;
}

$data = [
    'utr'     => $utr,
    'merchNo' => $config['merchant_no']
];

$data['sign'] = generateSign($data, $config['api_key']);

$url = rtrim($config['base_url'], '/') . '/api/utr/check';

$ch = curl_init($url);

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
    die(json_encode([
        'code' => 500,
        'msg'  => curl_error($ch)
    ]));
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$result = json_decode($response, true);

echo json_encode([
    'http_code' => $httpCode,
    'request'   => $data,
    'response'  => $result
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
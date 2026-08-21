<?php
//https://xbat.in/Aeropay/bindOrder.php?orderNo=ORD123456&utr=412345430998&amount=100
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

$orderNo = trim($_GET['orderNo'] ?? '');
$utr     = trim($_GET['utr'] ?? '');
$amount  = trim($_GET['amount'] ?? '');

if (empty($orderNo) || empty($utr) || empty($amount)) {
    echo json_encode([
        'code' => 400,
        'msg'  => 'orderNo, utr and amount required'
    ]);
    exit;
}

$data = [
    'amount'  => $amount,
    'orderNo' => $orderNo,
    'utr'     => $utr
];

$data['sign'] = generateSign($data, $config['api_key']);

$url = rtrim($config['base_url'], '/') . '/api/payIn/bind';

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
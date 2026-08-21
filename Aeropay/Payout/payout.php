<?php
// Example:
// https://xbat.in/Aeropay/payout.php?amount=100&acctName=BIPLABROY&ifsc=SBIN0001234&account=123456789012&mobile=9876543210

header('Content-Type: application/json');

$config = require __DIR__ . '/../config.php';

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

// Get Client IPv4
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR']
    ?? $_SERVER['REMOTE_ADDR']
    ?? '127.0.0.1';

if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

// Remove IPv6 prefix if exists
if (strpos($clientIp, '::ffff:') === 0) {
    $clientIp = str_replace('::ffff:', '', $clientIp);
}


// echo $_SERVER['HTTP_X_FORWARDED_FOR'];



// Input Parameters
$amount   = $_GET['amount'] ?? '100';
$acctName = $_GET['acctName'] ?? 'BIPLAB ROY';
$acctCode = $_GET['ifsc'] ?? 'IOBA0003242';
$acctNo   = $_GET['account'] ?? '324201000022711';
$mobile   = $_GET['mobile'] ?? '8670660855';

// Request Data
$data = [
    'amount'    => $amount,
    'orderNo'   => 'PO' . time(),
    'merchNo'   => $config['merchant_no'],
    'acctCode'  => $acctCode,
    'mobile'    => $mobile,
    'acctNo'    => $acctNo,
    'acctName'  => $acctName,
    'currency'  => 'INR',
    'notifyUrl' => $config['payout_notify_url'],

    // IPv4 Parameter
    'ip'         => $_SERVER['HTTP_X_FORWARDED_FOR']
];

// Generate Signature
$data['sign'] = generateSign($data, $config['api_key']);

// API URL
$url = rtrim($config['base_url'], '/') . '/api/payOut';

// cURL Request
$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS     => json_encode($data),
    CURLOPT_TIMEOUT        => 30
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode([
        'code' => 500,
        'msg'  => curl_error($ch)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

// Decode Response
$result = json_decode($response, true);

if ($result === null) {
    $result = $response;
}

// Output
echo json_encode([
    'http_code' => $httpCode,
    'request'   => $data,
    'response'  => $result
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
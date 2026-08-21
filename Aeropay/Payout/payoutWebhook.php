<?php

header('Content-Type: text/plain');

$config = require __DIR__ . '/../config.php';

function generateSign(array $data, string $apiKey): string{
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

$input = file_get_contents('php://input');

file_put_contents(
    'payout_webhook_log.txt',
    date('Y-m-d H:i:s') . ' ' . $input . PHP_EOL,
    FILE_APPEND
);

$json = json_decode($input, true);

if (!$json || !isset($json['data'])) {
    exit('fail');
}

$data = $json['data'];

$receivedSign = $data['sign'] ?? '';

unset($data['sign']);

$generatedSign = generateSign(
    $data,
    $config['api_key']
);

if (strtolower($generatedSign) !== strtolower($receivedSign)) {

    file_put_contents(
        'payout_error.txt',
        date('Y-m-d H:i:s') . " Invalid Sign\n",
        FILE_APPEND
    );

    exit('fail');
}

$orderNo    = $data['orderNo'] ?? '';
$orderState = $data['orderState'] ?? '';
$amount     = $data['amount'] ?? '';
$utr        = $data['businessNo'] ?? '';
$msg        = $data['msg'] ?? '';

if ((string)$orderState === '1') {

    file_put_contents(
        'payout_success.txt',
        "{$orderNo} | {$amount} | {$utr}\n",
        FILE_APPEND
    );

    // Mark payout success in database
} else {

    file_put_contents(
        'payout_failed.txt',
        "{$orderNo} | {$msg}\n",
        FILE_APPEND
    );

    // Mark payout failed in database
}

echo 'ok';
exit;
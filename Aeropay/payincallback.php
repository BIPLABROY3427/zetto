<?php

// ================= CONFIG =================
$apiKey = "4Ls142Y10CuV57e56881"; // same API key

// ================= GET RAW DATA =================
$input = file_get_contents("php://input");
$dataJson = json_decode($input, true);

// Log raw data (VERY IMPORTANT)
file_put_contents("callback_log.txt", $input . PHP_EOL, FILE_APPEND);

// ================= CHECK DATA =================
if (!isset($dataJson['data'])) {
    echo "fail";
    exit;
}

$data = $dataJson['data'];

// ================= SIGN VERIFY =================
$receivedSign = $data['sign'] ?? '';
unset($data['sign']);

function generateSign($data, $apiKey) {
    ksort($data);

    $str = "";
    foreach ($data as $key => $value) {
        if ($str !== "") {
            $str .= "&";
        }
        $str .= $key . "=" . $value;
    }

    return md5($str . $apiKey);
}

$generatedSign = generateSign($data, $apiKey);

// ================= VERIFY =================
if (strtolower($generatedSign) !== strtolower($receivedSign)) {

    // ❌ invalid sign
    file_put_contents("callback_error.txt", "Invalid Sign\n", FILE_APPEND);

    echo "fail";
    exit;
}

// ================= PROCESS ORDER =================
$orderNo    = $data['orderNo'];
$orderState = $data['orderState'];
$amount     = $data['amount'];

// Prevent duplicate processing
$lockFile = "locks/" . $orderNo . ".lock";

if (file_exists($lockFile)) {
    echo "ok";
    exit;
}

file_put_contents($lockFile, "done");

// ================= HANDLE STATUS =================
if ($orderState == "1") {

    // ✅ SUCCESS
    file_put_contents("success.txt", $orderNo . " | " . $amount . PHP_EOL, FILE_APPEND);

    // 👉 यहाँ DB update करो
    // UPDATE orders SET status='success'

} else {

    // ❌ FAILED / PROCESSING
    file_put_contents("failed.txt", $orderNo . " | " . $orderState . PHP_EOL, FILE_APPEND);
}

// ================= RESPONSE =================
// IMPORTANT: must return "ok"
echo "ok";
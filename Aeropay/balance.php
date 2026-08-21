<?php

$apiUrl = "https://api.aeropay11.live/api/balance";
$apiKey = "4Ls142Y10CuV57e56881"; // ⚠️ regenerate later

$data = [
    "merchNo" => "xbat",
    "timestamp" => round(microtime(true) * 1000), // milliseconds
    "currency" => "INR"
];

// SIGN FUNCTION (STRICT)
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

// Generate sign
$data['sign'] = generateSign($data, $apiKey);

// CURL
$ch = curl_init($apiUrl);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode($data)
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    die("Curl Error: " . curl_error($ch));
}

curl_close($ch);

$result = json_decode($response, true);

echo $response;
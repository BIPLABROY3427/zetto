<?php

// ================= CONFIG =================
$apiUrl = "https://api.aeropay11.live/api/payIn";
$apiKey = "4Ls142Y10CuV57e56881"; // ⚠️ change later
$merchantNo = "xbat";

// ================= DATA =================
if(isset($_GET['am'])){
    $amount=$_GET['am'];
}else{
    $amount=200;
}
$data = [
    "amount"   => $amount,
    "orderNo"  => "ORD" . time(),
    "merchNo"  => $merchantNo,
    "currency" => "INR",
    // optional:
    "notifyUrl" => "https://xbat.in/Aeropay/webhook.php"
];

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


// ================= GENERATE SIGN =================
$data['sign'] = generateSign($data, $apiKey);

// ================= CURL REQUEST =================
$ch = curl_init($apiUrl);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);

// Error handling
if (curl_errno($ch)) {
    die("CURL ERROR: " . curl_error($ch));
}

curl_close($ch);

// ================= RESPONSE =================
$result = json_decode($response, true);

// DEBUG OUTPUT
echo "<pre>REQUEST:\n";
print_r($data);

echo "\nRESPONSE:\n";
print_r($result);
echo "</pre>";

// ================= SUCCESS HANDLING =================
if (isset($result['code']) && $result['code'] == 0) {

    $paymentUrl = $result['data']['code_url'] ?? '';

    if ($paymentUrl) {
        echo "<h3>Redirecting to Payment...</h3>";
        echo "<script>window.location.href='{$paymentUrl}';</script>";
    } else {
        echo "Payment URL not found!";
    }

} else {
    echo "<h3>ERROR: " . ($result['msg'] ?? 'Unknown error') . "</h3>";
}
<?php

$redis = new Redis();

try {

    $redis->connect('127.0.0.1', 8767);

    // password ho to
    // $redis->auth('your_password');

    // test
    $redis->set('name', 'Biplab Roy');

    echo $redis->get('name');

} catch (Exception $e) {

    echo "Redis Connection Failed: " . $e->getMessage();

}
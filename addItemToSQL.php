<?php

$server = "";
$username = "";
$password = "";
$db = "";

$conn = new mysql($server, $username, $password, $db);

if ($conn->connect_error) {
    die("Connection Failed: ", $conn->connect_error);
}

?>
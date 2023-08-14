<!-- <?php
// save_blocked_list.php

$blockedList = $_POST['blockedList'];

// Save the blocked list to a file
$file = 'blocked_list.txt';
file_put_contents($file, implode("\n", $blockedList));

// Send a success response back to the client
echo 'Blocked list saved successfully.';
?> -->

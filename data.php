<?php
$servr = "localhost";
$ruser = "reader";
$rpass = "reader";
$wuser = "writer";
$wpass = "writer";
$datab = "y11fia2";
// Create the reader and writer connections
$rmysqli = new mysqli($servr, $ruser, $rpass, $datab);
$wmysqli = new mysqli($servr, $wuser, $wpass, $datab);
// Output error if connection failed
if ($rmysqli->connect_error) {
    die("Read Connection failed: " . $rmysqli->connect_error);
}
if ($wmysqli->connect_error) {
    die("CRUD Connection failed: " . $wmysqli->connect_error);
}
function getUserId(mysqli $conn, string $name): int {
    $sql = "SELECT `user_id` FROM `users` WHERE `username` = ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $sql_name);
        $sql_name = htmlspecialchars($name);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                return $row["user_id"];
            }
        }
    }
    return -1;
}
function addUser(mysqli $conn, string $name): bool {
    $sql = "INSERT INTO `users` (`username`) VALUES (?)";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $sql_name);
        $sql_name = htmlspecialchars($name);
        return $stmt->execute();
    }
    return false;
}
function addScore(mysqli $conn, int $id, int $score, int $target): bool {
    $sql = "INSERT INTO `scores` (`user_id`, `score`, `target`) VALUES (?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("iii", $sql_id, $sql_score, $sql_target);
        $sql_id = $id;
        $sql_score = $score;
        $sql_target = $target;
        return $stmt->execute();
    }
    return false;
}

function getAllScores(mysqli $conn, int $limit): array {
    $scores = array();
    $sql = "SELECT `users`.`username`, `scores`.`score`, `scores`.`target` FROM `scores` INNER JOIN `users` ON `users`.`user_id` = `scores`.`user_id` ORDER BY `scores`.`score` DESC LIMIT ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $sql_limit);
        $sql_limit = $limit;
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $scores[] = $row;
            }
        }
    }
    return $scores;
}
if (
    $_SERVER["REQUEST_METHOD"] == "POST" &&
    isset($_POST["type"]) && $_POST["type"] != ""
) {
    // Add a score to name
    if (
        $_POST["type"] == "insert" &&
        isset($_POST["score"]) && $_POST["score"] != "" &&
        isset($_POST["name"]) && $_POST["name"] != "" &&
        isset($_POST["target"]) && $_POST["target"] != ""
    ) {
        $name = htmlspecialchars($_POST["name"]);
        $score = intval(htmlspecialchars($_POST["score"]));
        $target = intval(htmlspecialchars($_POST["target"]));
        $id = getUserId($rmysqli, $name);
        if ($id == -1) {
            if (!addUser($wmysqli, $name)) {
                die("Failed to add user");
            }
            $id = getUserId($rmysqli, $name);
        }
        if (!addScore($wmysqli, $id, $score, $target)) {
            die("Failed to add score");
        } else {
            echo "SUCCESS";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>
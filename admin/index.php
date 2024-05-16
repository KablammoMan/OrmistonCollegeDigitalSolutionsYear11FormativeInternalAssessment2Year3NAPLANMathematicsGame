<?php
include("../data.php");
// Initialize the limit of the number of scores to render
$limit = 10;
// Check if the limit of the number of scores to render has been specified
if (
    $_SERVER["REQUEST_METHOD"] == "GET" && !empty($_GET) &&
    isset($_GET["limit"]) && $_GET["limit"] != ""
) {
    $limit = intval($_GET["limit"]);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap/dist/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap/dist/css/bootstrap.min.css">
    <title>Admin Panel</title>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg bg-dark py-3" data-bs-theme="dark">
        <div class="container">
            <a class="navbar-brand" href="./">Menu Mayhem</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navContent">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="./">Admin Panel</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../">Back to Game</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    <!-- Header -->
    <section class="py-5 bg-secondary text-light">
        <p class="fs-1 text-center fw-bold">Menu Mayhem Administration</p>
    </section>
    <!-- Data -->
    <section class="py-5">
        <div class="container">
            <p class="fs-2 text-center fw-bold">Top User Data</p>
            <form action="./" method="get">
                <div class="input-group mb-3">
                    <label for="limit" class="input-group-text bg-secondary text-light px-3">Max. # of Scores to Display</label>
                    <input type="number" class="form-control" id="limit" name="limit" placeholder="10" value="<?php echo $limit?>" min=1>
                    <input class="input-group-text btn btn-primary px-5" type="submit" value="Update">
                </div>
            </form>
            <table class="table table-secondary table-striped table-hover table-bordered">
                <thead>
                    <tr class="table-dark">
                        <th scope="col">#</th>
                        <th scope="col">Username</th>
                        <th scope="col">Score</th>
                        <th scope="col">Target</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $scores = getAllScores($rmysqli, $limit);
                    for ($i = 0; $i < count($scores); $i++) {
                        echo "<tr>";
                        echo "<th scope='row'>" . ($i + 1) . "</th>";
                        echo "<td>" . $scores[$i]["username"] . "</td>";
                        echo "<td>" . $scores[$i]["score"] . "</td>";
                        echo "<td>" . $scores[$i]["target"] . "</td>";
                        echo "</tr>";
                    }
                    ?>
                </tbody>
            </table>
        </div>
    </section>
</body>
</html>
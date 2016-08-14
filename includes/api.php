<?php
require_once('core.php');

if (isset($_GET['do'])) {
    $action = $_GET['do'];

    switch ($action) {
        case "login":
            login($_POST['user'], $_POST['pass']);
            break;

        case "register":
            register($_POST['user'], $_POST['pass'], $_POST['code']);
            break;

        case "invite":
            generate($_GET['level']);
            break;

        case "fetch":
            fetchFiles($_GET['date'], $_GET['count'], $_GET['keyword'], $_GET['action']);
            break;

        case "search":
            fetchFiles();
            break;

        case "report":
            report($_POST['file'], $_POST['reason']);
            break;

        case "mod":
            mod($_GET['action'], $_GET['date'], $_GET['count'], $_GET['why'], $_GET['file'], $_GET['keyword'], $_GET['fileid'], $_GET['hash'], $_GET['originalname']);
            break;

        case "panel":
            header('Location: ../panel');
            break;

        case "delete":
            delete($_GET['filename'], $_GET['fileid']);
            break;

        case "logout":
            session_unset();
            session_destroy();
            session_write_close();
            header('Location: ../login');
            break;

        default:
            echo "What are you doing here, <span language=\"jp\">baka</span>?";
    }
} else {
    echo "What are you doing here, <span language=\"jp\">baka</span>?";
}
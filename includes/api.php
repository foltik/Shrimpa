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
			if (!empty($_GET['level']))
				generate($_GET['level']);
			else 
				generate(NULL);
            break;

		case "fetch":
			switch($_GET['method']) {
				case "Fetch All":
					fetchFiles($_GET['method'], NULL, $_GET['count'], NULL);
					break;

				case "Fetch":
					fetchFiles($_GET['method'], $_GET['date'], $_GET['count'], $_GET['keyword']);
					break;

				default:
					fetchFiles(NULL, NULL, NULL, NULL);
					break;
			}
			break;

		case "report":
			if (!empty($_POST['file']))
	            report($_POST['file'], $_POST['reason']);
			else
				report(NULL, NULL);
			break;

		case "reports":
			reports();
			break;
			

		case "acceptreport":
			acceptreport($_GET['id']);
			break;

		case "dismissreport":
			dismissreport($_GET['id']);
			break;

        case "panel":
            panel();
            break;

		case "delete":
	            delete($_GET['fileid']);
            break;

		case "logout":
			destroySession();
            break;

        default:
            echo "What are you doing here, <span language=\"jp\">baka</span>?";
    }
} else {
    echo "What are you doing here, <span language=\"jp\">baka</span>?";
}

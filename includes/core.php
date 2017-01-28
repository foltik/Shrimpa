<?php
session_start();
require_once 'database.inc.php';

/*
 *
 *	Utilitiy Functions
 *
 */

function createSession($id, $username, $level) {
	$_SESSION['id'] = $id;
	$_SESSION['user'] = $username;
	$_SESSION['level'] = $level;
	redirect('/');
}

function destroySession() {
	session_unset();
	session_destroy();
	redirect('/login');
}

function checkSession($requiredLevel) {
	// Check that they are logged in
	if (!isset($_SESSION['id']))
		redirect('/login');

	// Check that they have the required access level
	if ($_SESSION['level'] > $requiredLevel)
		exit(header('HTTP/1.0 403 Forbidden'));
}

function redirect($uri) {
	$host = $_SERVER['HTTP_HOST'];
	exit(header('Location: https://'.$host.$uri));
}

/*
 *
 *	Core Functions
 *
 */

function panel() {
	global $db;
	checkSession(3);

	include('./panel.php');

	$q = $db->prepare("SELECT apikey FROM accounts WHERE user = (:user)");
	$q->bindParam(':user', $_SESSION['user']);
	$q->execute();
	$r = $q->fetch();

	echo 'Your API Key is '.$r['apikey'];
}

function register($user, $pass, $code) {
	global $db;
	
	// Check if code exists, if it is used, and store it in $r for later use
	$q = $db->prepare("SELECT id, used, level FROM invites WHERE code = (:code) AND used = 0");
	$q->bindParam(':code', $code);
	$q->execute();
	$r = $q->fetch();
	if ($q->rowCount() == 0) redirect('/register/index.html#fail');

	// Check if username is used
    $q = $db->prepare("SELECT user  FROM accounts WHERE user = (:user)");
    $q->bindParam(':user', $user);
    $q->execute();
	if ($q->rowCount() > 0) redirect('/register/index.html#fail');

    // If the checks passed, create the account
    $q = $db->prepare("INSERT INTO accounts (user, pass, apikey, level) VALUES (:user, :pass, :apikey, :level)");
    $q->bindParam(':user', $user);
    $q->bindParam(':pass', password_hash($pass, PASSWORD_DEFAULT));
	$q->bindParam(':apikey', generateString(KEY_CHARSET, 32));
	$q->bindParam(':level', $r['level']);
    $q->execute();

    // Set the code as used
    $q = $db->prepare("UPDATE invites SET used = (:used), usedby = (:usedby) WHERE code = (:code)");
    $q->bindValue(':used', 1);
	$q->bindValue(':usedby', $user);
	$q->bindParam(':code', $code);
	$q->execute();

	// Log them in
	createSession($r['id'], $user, $r['level']);
}

function generate($level) {
	global $db;
	checkSession(2);

	// Display form if not generating an invite
	if (empty($level)) {
		include_once('./invite.php');
		exit();
	}

	// Check to make sure level is valid
	if ($level < $_SESSION['level'] || $level > 3) {
		echo 'Invalid Access Level.<br>
			Level must be greater than your current level, and less than 4.';
		exit();
	}
	
	// Create the invite code
	$q = $db->prepare("INSERT INTO invites (code, level, issuer) VALUES (:code, :level, :issuer)");
	$code = generateString(CODE_CHARSET, 16);
	$q->bindParam(':code', $code);
	$q->bindParam(':level', $level);
	$q->bindParam(':issuer', $_SESSION['user']);
	$q->execute();
	echo 'Generation Successful.<br>
	    Code: '.$code.'<br>
		Access Level: '.$level;
}

function generateString($charset, $length) {
    $string = '';
    for ($i = 0; $i < $length; $i++) {
        $string .= $charset[rand(0, strlen($charset) - 1)];
    }
    return $string;
}

function login($user, $pass) {
	global $db;
	
	// Get the specified user's data
    $q = $db->prepare("SELECT pass, id, user, level FROM accounts WHERE user = (:user)");
    $q->bindParam(':user', $user);
    $q->execute();
    $r = $q->fetch();
	
	if (password_verify($pass, $r['pass'])) 
		createSession($r['id'], $r['user'], $r['level']);
	else
        redirect('/login/index.html#fail');
}

function delete($fileid) {
	global $db;
	checkSession(3);

	if (empty($fileid)) {
		echo 'Invalid File.';
		exit();
	}

	// Get owner + filename
	$q = $db->prepare("SELECT filename, user FROM files WHERE id = (:id)");
	$q->bindParam(':id', $fileid);
	$q->execute();
	$r = $q->fetch();

	// If they own it or are an admin
	if ($_SESSION['level'] <= 1 || $r['user'] == $_SESSION['user']) {
		// Remove it from the DB
		$q = $db->prepare("DELETE FROM files WHERE id = (:id)");
		$q->bindParam(':id', $fileid);
		$q->execute();
	
		// Delete the file
		unlink(SHIM_FILES_ROOT.$r['filename']);
		echo 'File deleted.';
	}
}

function fetchFiles($method, $date, $count, $keyword) {
	global $db;
	checkSession(3);

	include('./search.php');

	if (empty($method)) {
		include('./footer.php');
		exit();
	}

	if ($method == 'Fetch') {
		// Either fetch all files matching query, or only the user's files
		if ($_SESSION['level'] == 0)
			$q = $db->prepare('SELECT * FROM files WHERE (originalname LIKE (:keyword) AND date LIKE (:date)) OR (filename LIKE (:keyword) AND date LIKE (:date)) ORDER BY id DESC LIMIT :count');
		else {
			$q = $db->prepare('SELECT * FROM files WHERE user = (:user) AND ((originalname LIKE (:keyword) AND date LIKE (:date)) OR (filename LIKE (:keyword) AND date LIKE (:date))) ORDER BY id DESC LIMIT :count');
			$q->bindValue(':user', $_SESSION['user']);
		}

		$q->bindValue(':date', '%'.$date.'%');
		$q->bindValue(':count', (int)$count, PDO::PARAM_INT);
		$q->bindValue(':keyword', '%'.$keyword.'%');
		$q->execute();
	} else if ($method == 'Fetch All') {
		// Either fetch all files or only the user's files
		if ($_SESSION['level'] == 0)
			$q = $db->prepare('SELECT * FROM files ORDER BY id DESC LIMIT :count');
		else {
			$q = $db->prepare('SELECT * FROM files WHERE user = (:user) ORDER BY id DESC LIMIT :count');
			$q->bindValue(':user', $_SESSION['user']);
		}

		$q->bindValue(':count', (int)$count, PDO::PARAM_INT);
		$q->execute();
	}

	while ($r = $q->fetch()) {
		$id = $r['id'];
		$oname = strip_tags($r['originalname']);
		$fname = $r['filename'];
		$bytes = $r['size'].' B';
		$temp = $r['size'] / 1000;
		$kilobytes = $temp.' KB';
		$uploadDate = $r['date'];
		$uploader = $r['user'];

		echo '<tr>
				<td>'.$id.'</td>
				<td>'.$oname.'</td>
				<td><a href="'.SHIM_FILE_URL.$fname.'" target="_BLANK">'.$fname.'</a></td>
				<td>'.$uploadDate.'</td>
				<td>'.$uploader.'</td>
				<td>'.$bytes.' / '.$kilobytes.'</td>
				<td><a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=delete&fileid='.$id.'" target="_BLANK">Remove</a></td>
			</tr>';
	}
	
	echo '<p>'.$q->rowCount().' files found.</p>';
	echo '</table>';

	include('./footer.php');
}

function report($file, $reason) {
    global $db;
    if (isset($_SESSION['id'])) {
        if ($_SESSION['level'] < '4') {
            if (empty($file)) {
                include('./report.php');
            } else {
                $q = $db->prepare("SELECT id, hash FROM files WHERE filename = :file");
                $q->bindValue(':file', strip_tags($file));
                $q->execute();
                $result = $q->fetch();
                
                if ($q->rowCount() != '0') {
                    $q = $db->prepare("INSERT INTO reports (hash, date, file, fileid, reporter, reason) VALUES (:hash, :date, :file, :fileid, :reporter, :reason)");
                    $q->bindValue(':file', strip_tags($file));
                    $q->bindValue(':date', date('Y-m-d'));
                    $q->bindValue(':reporter', $_SESSION['user']);
                    $q->bindValue(':fileid', $result['id']);
                    $q->bindValue(':hash', $result['hash']);
                    $q->bindValue(':reason', $reason);
                    $q->execute();
                    echo 'Thank you, report has been sent. The file will be reviewed.';
                } else echo 'File does not exist.';
            }
        } else echo 'Insufficient Access Level.';
    } else header('Location: ../login');
}

function reports() {
	global $db;
	checkSession(1);

	include('./reports.php');

	// Populate the table
	$q = $db->prepare("SELECT * FROM reports WHERE status = '0'");
	$q->execute();
	while ($r = $q->fetch()) {
		$id = $r['id'];
		$fileid = $r['fileid'];
		$filename = strip_tags($r['file']);
		$reporter = $r['reporter'];
		$status = $r['status'];
		$reason = strip_tags($r['reason']);

		echo '<tr>
			<td>'.$id.'</td>
			<td><a href="'.SHIM_FILE_URL.$filename.'" target="_BLANK">'.$filename.'</td>
			<td>'.$fileid.'</td>
			<td>'.$reporter.'</td>
			<td>'.$status.'</td>
			<td>'.$reason.'</td>
			<td><a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=acceptreport&id='.$id.'" target="_BLANK">Remove File</a>
				<a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=dismissreport&id='.$id.'" target="_BLANK">Dismiss Report</a></td>
		</tr>';
	
	}
	echo '</table>';
			
	include('./footer.php');

	// Display report stats
	echo $q->rowCount().' Reports in total are being shown.<br>';
	$q = $db->prepare("SELECT * FROM reports WHERE status != '0'");
	$q->execute();
	echo $q->rowCount().' Unshown reports filled.';
}

function acceptreport($id) {
	global $db;
	checkSession(1);
	
	// Get file info
	$q = $db->prepare('SELECT file, fileid FROM reports WHERE id = (:id)');
	$q->bindParam(':id', $id);
	$q->execute();
	$r = $q->fetch();
	$fileid = $r['fileid'];
	$filename = $r['file'];

	// Delete the file and remove from DB
	delete($fileid);
	$q = $db->prepare("DELETE FROM files WHERE id = (:id)");
	$q->bindParam(':id', $fileid);
	$q->execute();
			
	// MOVE TO delete();
	unlink(SHIM_FILES_ROOT.$filename);
			
	// Update report status
	$q = $db->prepare("UPDATE reports SET status = (:status) WHERE id = (:id)");
	$q->bindValue(':status', '1');
	$q->bindValue(':id', $id);
	$q->execute();
}

function dismissreport($id) {
	global $db;
	checkSession(1);
	
	// Update report status
	$q = $db->prepare('UPDATE reports SET status = (:status) WHERE id = (:id)');
	$q->bindValue(':status', '2');
	$q->bindValue('id', $id);
	$q->execute();
	echo 'Report Dismissed.';
}

?>

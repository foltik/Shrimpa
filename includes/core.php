<?php
session_start();
require_once 'database.inc.php';

function register($user, $pass, $code)
{
    global $db;
    $q = $db->prepare("SELECT id, used, level FROM invites WHERE code = (:code)");
    $q->bindParam(':code', $code);
    $q->execute();
    $result = $q->fetch();

    // Check if code is used
    if ($result['used'] == '0') {
        // Check to see if the username is in use
        $q->prepare("SELECT user FROM accounts WHERE user = (:user)");
        $q->bindParam(':user', $user);
        $q->execute();
        if ($q->rowCount == 0) {
            // Add new account
            $q = $db->prepare("INSERT INTO accounts (user, pass, level, apikey) VALUES (:user, :pass, :level, :apikey)");
            $q->bindParam(':user', $user);
            $q->bindParam(':level', $result['level']);
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $q->bindParam(':pass', $hash);
            $apikey = generateString(KEY_CHARSET, 32);
            $q->bindParam(':apikey', $apikey);
            $q->execute();

            // Set the code as used
            $q = $db->prepare("UPDATE invites SET used = (:used),usedby = (:usedby) WHERE code = (:code)");
            $q->bindValue(':used', '1');
            $q->bindValue(':usedby', $user);
            $q->bindParam(':code', $code);
            $q->execute();

            // Log them in
            $_SESSION['id'] = $result['id'];
            $_SESSION['user'] = $user;
            $_SESSION['level'] = $result['level'];
            header('Location: api.php?do=panel');
        }
    }
    header('Location: ../register/index.html#fail');
}

function generate($level)
{
    global $db;
    if (isset($_SESSION['id'])) {
        if ($_SESSION['level'] < '3') {
            if (empty($level)) {
                include_once('./invite.php');
            } else {
                if ($level > $_SESSION['level'] && $level < '4') {
                    $q = $db->prepare("INSERT INTO invites (code, level, issuer) VALUES (:code, :level, :issuer)");
                    $code = generateString(CODE_CHARSET, 16);
                    $q->bindParam(':code', $code);
                    $q->bindParam(':level', $level);
                    $q->bindParam(':issuer', $_SESSION['user']);
                    $q->execute();
                    echo '<p>Generation Successful.</p><br>
                        <p>Code: '.$code.'</p><br>
                        <p>Access Level: '.$level.'</p>';
                }
            }
        } else {
            echo 'Insufficient Access Level.';
        }
    } else {
        header('Location: ../login');
    }
}

function generateString($charset, $length)
{
    $string = '';
    for ($i = 0; $i < $length; $i++) {
        $string .= $charset[rand(0, strlen($charset) - 1)];
    }
    return $string;
}

function login($user, $pass)
{
    global $db;
    $q = $db->prepare("SELECT pass, id, user, level FROM accounts WHERE user = (:user)");
    $q->bindParam(':user', $user);
    $q->execute();
    $result = $q->fetch();

    if (password_verify($pass, $result['pass'])) {
        $_SESSION['id'] = $result['id'];
        $_SESSION['user'] = $result['user'];
        $_SESSION['level'] = $result['level'];
        header('Location: api.php?do=panel');
    } else {
        header('Location: ../login/index.html#fail');
    }
}

function delete($filename, $deleteid)
{
    if (isset($_SESSION['id'])) {
        if ($_SESSION['level'] < '4') {
            if (empty($filename)) {
                echo "Invalid Filename";
            } else {
                global $db;
                $q = $db->prepare("SELECT filename, delid, id, user FROM files WHERE filename = (:filename)");
                $q->bindParam(':filename', $filename);
                $q->execute();
                $result = $q->fetch();

                if ($_SESSION['level'] === '0' || $result['user'] === $_SESSION['id']) {
                    $q = $db->prepare("DELETE FROM files WHERE id = (:id)");
                    $q->bindParam(':id', $result['id']);
                    $q->execute();
                    unlink(SHIM_FILES_ROOT.$filename);
                    echo "<br/>File deleted.<br/>";
                } else {
                    echo 'Insufficient Access Level';
                }
            }
        } else {
            echo 'Insufficient Access Level.';
        }
    } else {
        header('Location: ../login');
    }
}

function fetchFiles($date, $count, $keyword, $action)
{
    global $db;
    if (isset($_SESSION['id'])) {
        if ($_SESSION['level'] < '4') {
            include('./search.php');

            if ($action === 'Fetch All') {
                if ($_SESSION['level'] < '2') {
                    $q = $db->prepare("SELECT * FROM files ORDER BY id DESC LIMIT :count");
                } else {
                    $q = $db->prepare("SELECT * FROM files WHERE user = (:user) ORDER BY id DESC LIMIT :count");
                    $q->bindValue(':user', $_SESSION['user']);
                }
                $q->bindValue(':count', (int) $count, PDO::PARAM_INT);
                $q->execute();

                $i = 0;
                while ($row = $q->fetch()) {
                    $i++;
                    $bytes = $row['size'];
                    $kilobytes = $row['size'] / 1000;
                    echo '<tr><td>'.$row['id'].'</td>
                        <td>'.strip_tags($row['originalname']).'</td>
                        <td><a href="'.SHIM_FILE_URL.$row['filename'].'" target="_BLANK">'.$row['filename'].'</a> ('.$row['originalname'].')</td>
                        <td>'.$bytes.' / '.$kilobytes.'</td>
                        <td><a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=delete&action=remove&fileid='.$row['id'].'&filename='.$row['filename'].'" target="_BLANK">Remove</a></td></tr>';
                }
                echo '<p>'.$i.' Files in total at being shown.</p>';
                echo '</table>';
            } elseif ($action === 'Fetch') {
                if ($_SESSION['level'] < '2') {
                    $q = $db->prepare("SELECT * FROM files WHERE originalname LIKE (:keyword) AND date LIKE (:date) OR filename LIKE (:keyword) AND date LIKE (:date) ORDER BY id DESC LIMIT :count");
                } else {
                    $q = $db->prepare("SELECT * FROM files WHERE originalname LIKE (:keyword) AND date LIKE (:date) AND user = (:user) OR filename LIKE (:keyword) AND date LIKE (:date) AND user = (:userid) ORDER BY id DESC LIMIT :count");
                    $q->bindValue(':user', $_SESSION['user']);
                }
                $q->bindValue(':date', "%".$date."%");
                $q->bindValue(':count', (int) $count, PDO::PARAM_INT);
                $q->bindValue(':keyword', "%".$keyword."%");
                $q->execute();

                $i = 0;
                while ($row = $q->fetch()) {
                    $i++;
                    $bytes = $row['size'];
                    $kilobytes = $row['size'] / 1000;
                    echo '<tr><td>'.$row['id'].'</td>
                        <td>'.strip_tags($row['originalname']).'</td>
                        <td><a href="'.SHIM_FILE_URL.$row['filename'].'" target="_BLANK">'.$row['filename'].'</a> ('.$row['originalname'].')</td>
                        <td>'.$bytes.' / '.$kilobytes.'</td>
                        <td><a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=delete&action=remove&fileid='.$row['id'].'&filename='.$row['filename'].'" target="_BLANK">Remove</a></td></tr>';
                }
                echo '<p>'.$i.' Files in total at being shown.</p>';
                echo '</table>';
            }
            include('./footer.php');
        } else {
            echo 'Insufficient Access Level.';
        }
    } else {
        header('Location: ../login');
    }
}

function report($file, $reason)
{
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
                } else {
                    echo 'File does not exist.';
                }
            }
        } else {
            echo 'Insufficient Access Level.';
        }
    } else {
        header('Location: ../login');
    }
}

function mod($action, $date, $count, $why, $file, $keyword, $fileid, $hash, $orginalname)
{
    global $db;
    if (isset($_SESSION['id'])) {
        if ($_SESSION['level'] < '2') {
            switch ($action) {
                case "reports":
                    $q = $db->prepare("SELECT * FROM reports WHERE status = '0'");
                    $q->execute();

                    $i = 0;
                    include('./reports.php');
                    while ($row = $q->fetch()) {
                        $i++;
                        echo '<tr><td>'.$row['id'].'</td>
                        <td><a href="'.SHIM_FILE_URL.strip_tags($row['file']).'" target="_BLANK">'.strip_tags($row['file']).'</td>
                        <td>'.$row['fileid'].'</td>
                        <td>'.$row['reporter'].'</td>
                        <td>'.$row['status'].'</td>
                        <td>'.$row['reason'].'</td>
                        <td><a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=mod&action=remove&fileid='.$row['fileid'].'&file='.$row['file'].'" target="_BLANK">Remove File</a>
                        <a class="btn btn-default" href="'.SHIM_URL.'/includes/api.php?do=mod&action=dismiss&fileid='.$row['fileid'].'&file='.$row['file'].'" target="_BLANK">Dismiss Report</a></td></tr>';
                    }
                    echo '</table>';
                    include('./footer.php');
                    echo $i.' Reports in total at being shown.';
                    break;

                case "remove":
                    delete($file, $fileid);
                    $q = $db->prepare("DELETE FROM files WHERE id = (:id)");
                    $q->bindParam(':id', $fileid);
                    $q->execute();
                    unlink(SHIM_FILES_ROOT.$file);
                    $q = $db->prepare("UPDATE reports SET status = (:status) WHERE fileid = (:fileid)");
                    $q->bindValue(':status', '1');
                    $q->bindValue(':fileid', $fileid);
                    $q->execute();
                    break;

                case "dismiss":
                    $q = $db->prepare("UPDATE reports SET status = (:status) WHERE fileid = (:fileid)");
                    $q->bindValue(':status', '2');
                    $q->bindValue('fileid', $fileid);
                    $q->execute();
                    echo 'Report Dismissed.';
            }
        } else {
            echo 'Insufficient Access Level.';
        }
    } else {
        header('Location: ../login');
    }
}
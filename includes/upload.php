<?php
session_start();

require_once 'classes/Response.class.php';
require_once 'classes/UploadException.class.php';
require_once 'classes/UploadedFile.class.php';
require_once 'includes/database.inc.php';

function generateName($file)
{
    global $db;
    global $doubledots;

    $tries = SHIM_FILES_RETRIES;
    $length = SHIM_FILES_LENGTH;
    $ext = pathinfo($file->name, PATHINFO_EXTENSION);

    // Check if extension is a double-dot extension and, if true, override $ext
    $revname = strrev($file->name);
    foreach ($doubledots as $ddot) {
        if (stripos($revname, $ddot) === 0) {
            $ext = strrev($ddot);
        }
    }

    do {
        // Iterate until we reach the maximum number of retries
        if ($tries-- === 0) {
            throw new Exception(
                'Gave up trying to find an unused name',
                500
            );
        }

        $chars = FILE_CHARSET;
        $name = '';
        for ($i = 0; $i < $length; ++$i) {
            $name .= $chars[mt_rand(0, strlen($chars) - 1)];
        }

        // Add the extension to the file name
        if (isset($ext) && $ext !== '') {
            $name .= '.'.$ext;
        }

        // Check if a file with the same name does already exist in the database
        $q = $db->prepare('SELECT COUNT(filename) FROM files WHERE filename = (:name)');
        $q->bindValue(':name', $name, PDO::PARAM_STR);
        $q->execute();
        $result = $q->fetchColumn();
    // If it does, generate a new name
    } while ($result > 0);
    return $name;
}

function uploadFile($file)
{
    global $db;
    global $FILTER_MODE;
    global $FILTER_MIME;

    // Handle file errors
    if ($file->error) {
        throw new UploadException($file->error);
    }

    // Check if mime type is blocked
    if (!empty($FILTER_MIME)) {
        if ($FILTER_MODE == true) { //whitelist mode
            if (!in_array($file->mime, $FILTER_MIME)) {
                throw new UploadException(UPLOAD_ERR_EXTENSION);
            }
        } else { //blacklist mode
            if (in_array($file->mime, $FILTER_MIME)) {
                throw new UploadException(UPLOAD_ERR_EXTENSION);
            }
        }
    }


    // Check if a file with the same hash and size (a file which is the same)
    // does already exist in the database; if it does, return the proper link
    // and data. PHP deletes the temporary file just uploaded automatically.
    $q = $db->prepare('SELECT filename, COUNT(*) AS count FROM files WHERE hash = (:hash) '.
                      'AND size = (:size)');
    $q->bindValue(':hash', $file->getSha1());
    $q->bindValue(':size', $file->size);
    $q->execute();
    $result = $q->fetch();
    if ($result['count'] > 0) {
        return array(
            'hash' => $file->getSha1(),
            'name' => $file->name,
            'url' => SHIM_FILE_URL.rawurlencode($result['filename']),
            'size' => $file->size,
        );
    }

    // Generate a name for the file
    $newname = generateName($file);

    // Store the file's full file path
    $uploadFile = SHIM_FILES_ROOT . $newname;

    // Attempt to move it to the static directory
    if (!move_uploaded_file($file->tempfile, $uploadFile)) {
        throw new Exception(
            'Failed to move file to destination',
            500
        );
    }

    // Need to change permissions for the new file to make it readable
    if (!chmod($uploadFile, 0644)) {
        throw new Exception(
            'Failed to change file permissions',
            500
        );
    }

    // Add it to the database
    if (!isset($_SESSION['user'])) {
        // If the user is not logged in find the username by api key
        $q = $db->prepare('SELECT user FROM accounts WHERE apikey = (:apikey)');
        $q->bindValue(':apikey', $_POST['apikey']);
        $q->execute();
        $result = $q->fetch();
        $user = $result['user'];
        $q = $db->prepare('INSERT INTO files (hash, originalname, filename, size, date, ' .
                    'expire, delid, user) VALUES (:hash, :orig, :name, :size, :date, ' .
                        ':exp, :del, :user)');    if (!isset($_POST['apikey']) && isset($_SESSION['user'])) {
        $q = $db->prepare('SELECT apikey FROM accounts WHERE user = (:user)');
        $q->bindValue(':user', $_SESSION['user']);
        $q->execute();
        $result = $q->fetch();
        $apikey = $result['apikey'];
    }
        $q->bindValue(':user', $user);
    } else {
        // Otherwise just use session data
        $q = $db->prepare('INSERT INTO files (hash, originalname, filename, size, date, ' .
                    'expire, delid, user) VALUES (:hash, :orig, :name, :size, :date, ' .
                        ':exp, :del, :user)');
        $q->bindValue(':user', $_SESSION['user']);
    }

    $q->bindValue(':hash', $file->getSha1());
    $q->bindValue(':orig', strip_tags($file->name));
    $q->bindValue(':name', $newname);
    $q->bindValue(':size', $file->size);
    $q->bindValue(':date', date('Y-m-d'));
    $q->bindValue(':exp', null);
    $q->bindValue(':del', sha1($file->tempfile));
    $q->execute();

    return array(
        'hash' => $file->getSha1(),
        'name' => $file->name,
        'url' => SHIM_FILE_URL.rawurlencode($newname),
        'size' => $file->size,
    );
}

function diverseArray($files)
{
    $result = array();

    foreach ($files as $key1 => $value1) {
        foreach ($value1 as $key2 => $value2) {
            $result[$key2][$key1] = $value2;
        }
    }
    return $result;
}

function refiles($files)
{
    $result = array();
    $files = diverseArray($files);

    foreach ($files as $file) {
        $f = new UploadedFile();
        $f->name = $file['name'];
        $f->mime = $file['type'];
        $f->size = $file['size'];
        $f->tempfile = $file['tmp_name'];
        $f->error = $file['error'];
        //$f->expire   = $file['expire'];
        $result[] = $f;
    }
    return $result;
}

$type = isset($_GET['output']) ? $_GET['output'] : 'json';
$response = new Response($type);

if (isset($_FILES['files'])) {
    if (isset($_POST['apikey']) || isset($_SESSION['id'])) {
        if (isset($_POST['apikey'])) {
            $q = $db->prepare('SELECT user FROM accounts WHERE apikey = (:apikey)');
            $q->bindValue(':apikey', $_POST['apikey']);
            $q->execute();
            if ($q->rowCount() == 0) {
                $response->error(500, 'Invalid API Key');
                return;
            }
        }

        $uploads = refiles($_FILES['files']);

        try {
            foreach ($uploads as $upload) {
                $res[] = uploadFile($upload);
            } 
            $response->send($res);
        } catch (Exception $e) {
            $response->error($e->getCode(), $e->getMessage());
        }
    }
} else {
    $response->error(400, 'No input file(s)');
}
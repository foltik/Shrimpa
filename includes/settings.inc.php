<?php
define('SHIM_DB_CONN', 'mysql:host=localhost;dbname=shimapan');

define('SHIM_DB_USER', 'shimapan');
define('SHIM_DB_PASS', 'skeleton');

define('SHIM_FILES_ROOT', '/var/www/shimapan/i/');
define('SHIM_FILES_RETRIES', 15);
define('SHIM_FILES_LENGTH', 6);

define('SHIM_URL', 'https://www.shimapan.rocks/');
define('SHIM_FILE_URL', 'https://i.shimapan.rocks/');

define('FILE_CHARSET', 'abcdefghijklmnopqrstuvwxyz');
define('KEY_CHARSET', '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
define('CODE_CHARSET', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

$FILTER_MIME = array();
$FILTER_MODE = false;
$doubledots = array_map('strrev', array(
    'tar.gz',
    'tar.bz',
    'tar.bz2',
    'tar.xz',
    'user.js',
));

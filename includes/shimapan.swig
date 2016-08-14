<?php
$images = array(
    '/assets/img/girls/1.png',
    '/assets/img/girls/2.png',
    '/assets/img/girls/3.png',
    '/assets/img/girls/4.png',
    '/assets/img/girls/5.png',
    '/assets/img/girls/6.png',
    '/assets/img/girls/7.png',
    '/assets/img/girls/8.png',
    '/assets/img/girls/9.png',
    '/assets/img/girls/10.png'
);

// Redirect to a random image from the above array using status code "303 See Other" 
if (headers_sent() === false) {
    header('Location: '.$images[array_rand($images)], true, 303);
}

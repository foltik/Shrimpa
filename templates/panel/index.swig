{% include "../../includes/locked.swig" %}
{% include "../../includes/header.swig" %}
<p>Welcome, <?php echo $_SESSION['user']; ?></p>
<?php
    require_once '../includes/database.inc.php';
    global $db;
    $q = $db->prepare("SELECT apikey FROM accounts WHERE user = (:user)");
    $q->bindValue(':user', $_SESSION['user']);
    $q->execute();
    $result = $q->fetch();
    echo 'Your API key is '.$result['apikey'];
?>
{% include "../../includes/footer.swig" %}

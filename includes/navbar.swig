<nav class="navbar navbar-default">
    <div class="container-fluid">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                <span class="sr-only">Toggle Navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand" href="{{siteUrl}}">{{siteName}}</a>
        </div>
        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul class="nav navbar-nav">
                <li><a href="/panel" target="_BLANK">Panel</a></li>
                <li><a href="/includes/api.php?do=search" target="_BLANK">Search</a></li>
                <?php if ($_SESSION['level'] < '3') echo '<li><a href="/includes/api.php?do=invite" target="_BLANK">Invites</a></li>'; ?>
                <li><a href="/includes/api.php?do=report" target="_BLANK">Report</a></li>
                <?php if ($_SESSION['level'] < '2') echo '<li><a href="/includes/api.php?do=mod&action=reports" target="_BLANK">Reports</a></li>'; ?>
                <li><a href="/includes/api.php?do=logout">Logout</a></li>
            </ul>
        </div>
    </div>
</nav>
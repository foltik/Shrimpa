{% include "header.swig" %}
<div class="container"> 
    <div class="well bs-component">
        <p class="text-primary">Access Levels:</p>
        <ul class="list-group">
            <li class="list-group-item"><span class="badge">0</span>Root. All privileges.</li>
            <li class="list-group-item"><span class="badge">1</span>Admin. May act upon reports and invite moderators.</li>
            <li class="list-group-item"><span class="badge">2</span>Moderator. May invite regular users.</li>
            <li class="list-group-item"><span class="badge">3</span>User. May use the default features of {{siteName}}.</li>
            <li class="list-group-item"><span class="badge">4</span>Restricted. Banned from using {{siteName}}.</li>
        </ul>
        <form class="form-horizontal" action="/includes/api.php?do=invite" method="get">
            <fieldset>
                <legend>Generate Invite Code</legend>
                    <input type="hidden" name="do" value="invite">
                    <div class="form-group">
                        <label class="col-lg-2 control-label" for="level">Level:</label>
                        <div class="col-lg-10">
                            <input type="number" class="form-control" id="level" min="<?php echo $_SESSION['level'] + 1; ?>" max="3" name="level" value="3" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-lg-10 col-lg-offset-2">
                            <input class="btn btn-default" type="submit" value="Generate">
                        </div>
                    </div>
            </fieldset>
        </form>
    </div>
</div>
{% include "footer.swig" %}
{% include "header.swig" %}
<form  action="/includes/api.php?do=report" method="post">
    <div class="form-group">
        <label for="file">Filename</label>
        <input id="file" type="text" name="file">
    </div>
    <div class="form-group">
        <label for="reason">Reason</label>
        <input id="reason" type="text" name="reason">
    </div>
    <input class="btn btn-default" type="submit" value="Report">
</form>
{% include "footer.swig" %}

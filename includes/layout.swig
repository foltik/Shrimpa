{% include "locked.swig" %}
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="generator" content="Shimapan {{pkgVersion}}">
		<title>{{siteName}} {% block title %}Services{% endblock %}</title>
		<link rel="icon" href="/assets/img/favicon.ico">
		<link rel="stylesheet" href="/assets/css/shimapan.min.css">
		<script src="/assets/js/shimapan.min.js"></script>
	</head>
	<body>
		<div class="container">
			{% block body %}What are you doing here, <span lang="jp">baka</span>?{% endblock %}
		</div>
	</body>
</html>
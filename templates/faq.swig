{% extends "../includes/layout.swig" %}
{% block title %}FAQ{% endblock %}
{% block body %}
<article>
	<div class="jumbotron">
		<h1><abbr title="Frequently asked questions">FAQ</abbr></h1>
	</div>
	<h2>What is {{siteName}}?</h2>
	<p><span role="definition"><dfn>{{siteName}}</dfn> is a simple to use free file hosting service.</span> It lets you share your photos, documents, music, videos and more with others online.</p>
</article>
{% include "../includes/nav.swig" %}
{% endblock %}

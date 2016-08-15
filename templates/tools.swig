{% extends "../includes/layout.swig" %}
{% block title %}Tools{% endblock %}
{% block body %}
<div class="jumbotron">
<h1>{{siteName}} Tools</h1>
</div>
<section>
	<h2>ShareX</h2>
	<dl>
		<dt>Download</dt>
		<dd><a href="https://getsharex.com/">https://getsharex.com/</a></dd>
		<dt>Custom Temlate</dt>
      <dd><a href="/assets/tools/shimapan.rocks.json">http://www.shimapan.rocks/assets/tools/shimapan.rocks.json</a></dd>
      <dd>How to import into ShareX:</dd>
		<dd><img src="/assets/img/sharex.png"></dd>
	</dl>
</section>
<section>
	<h2>Bash Uploader</h2>
	<dl>
		<dt>Download</dt>
		<dd><a href="/assets/tools/upload.sh">http://www.shimapan.rocks/assets/tools/upload.sh</a></dd>
		<dt>How to Use</dt>
		<dd>In order for the script to work, you must change <b>[USER KEY HERE]</b> in the script to your API key.</dd>
      <dd>You must also allow execution of the script by running <b>chmod +x upload.sh</b></dd>
      <dd>Usage: ./upload.sh <i>path_to_file</i></dd>
	</dl>
</section>
{% include "../includes/nav.swig" %}
{% endblock %}
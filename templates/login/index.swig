<html lang="en-US">
	<head>
		<link rel="stylesheet" type="text/css" href="/assets/css/shimapan-panel.min.css" media="screen"/>
		<meta charset="utf-8">
		<title>{{siteName}} Login</title>
	</head>
	<body>
		<div id="login-form">
			<h3>Login</h3>
			<fieldset>
				<form action="/includes/api.php?do=login" method="post">
					<input type="text" name="user" placeholder="Username" required>
					<input type="password" name="pass" placeholder="Password" required>
					<input type="submit" value="Login">
					<footer class="clearfix">
						<p><span class="info">?</span><a href="/register">Register</a></p>
					</footer>
				</form>
			</fieldset>
		</div>
		<div id="fail">
			<h3>Login Failed</h3>
			<fieldset>
				<p>You have entered the wrong username or password. Please try again.</p>
			</fieldset>
		</div>
	</body>
</html>

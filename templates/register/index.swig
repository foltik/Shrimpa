<html>
	<head>
		<link rel="stylesheet" type="text/css" href="/assets/css/shimapan-panel.min.css" media="screen" />
		<meta charset="utf-8">
		<title>{{siteName}} Register</title>
	</head>
	<body>
		<div id="login-form">
			<h3>Register</h3>
			<fieldset>
				<form action="/includes/api.php?do=register" method="post">
					<input type="text" name="user" placeholder="Username" required>
					<input type="password" name="pass" placeholder="Password" required> 
					<input type="password" name="confirmpass" placeholder="Confirm Password" required> 
					<input type="text" name="code" placeholder="Invite Code" required>
					<input type="submit" value="Register">
					<footer class="clearfix">
						<p>
							<span class="info">?</span>
							<a href="/login">Login</a>
						</p>
					</footer>
				</form>
			</fieldset>
		</div>
		<div id="fail">
			<h3>Register Failed</h3>
			<fieldset>
				<p>The invite code is invalid or the username is in use.</p>
			</fieldset>
		</div>
	</body>
</html>
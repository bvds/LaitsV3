<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
<title>Log Analysis</title>
</head>
<body>

<?php
	//require "../www/db-login.php";
	//require "../www/error-handler.php";

	set_time_limit(30000);
	include "logAnalysis.php";
	
	date_default_timezone_set('America/Phoenix');
	!empty($_REQUEST["date"])?($date = $_REQUEST["date"]):($date = Date("Y-m-d"));
	!empty($_REQUEST["fromTime"])?($fromTime = $_REQUEST["fromTime"]):($fromTime = '15:00:000');
	!empty($_REQUEST["toTime"])?($toTime = $_REQUEST["toTime"]):($toTime = '16:15:000');
	!empty($_REQUEST["section"])?($section = $_REQUEST["section"]):($section = 'sos-326-spring14');
	!empty($_REQUEST["mode"])?($mode = $_REQUEST["mode"]):$mode = 'STUDENT';
	!empty($_REQUEST["user"])?($user = $_REQUEST["user"]):$user = '';
	
	//$mysqli = mysqli_connect("localhost",$dbuser, $dbpassword, $dbname) or die("Connection not established. Check the user log file");
	$mysqli = mysqli_connect("localhost", "root", "qwerty211", "laits_devel") or die("Connection not established. Check the user log file");

	$al = new AnalyzeLogs($mysqli);

	$al->createDashboard($section, $mode, $date, $fromTime, $toTime, $user);

	mysqli_close($mysqli);
?>
</body>
</html>
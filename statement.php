<?php

require_once 'ExpertSystem.php';

header('Content-Type: application/json');

if (array_key_exists('value', $_GET)) {
	try {
		$data = (new ExpertSystem())->get_statement($_GET['value']);
	} catch (\Exception $ex) {
		$data = ['error' => $ex->getMessage()];
	}
} else {
	$data = (new ExpertSystem())->get_statements();
}

echo json_encode($data);

<?php
require __DIR__ . '/../vendor/autoload.php';
use App\Controllers\KPIsController;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$mysqli = new mysqli($_ENV['DB_HOST'], $_ENV['DB_USER'], $_ENV['DB_PASS'], $_ENV['DB_NAME']);
$mysqli->set_charset('utf8mb4');

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$routes = [
    'GET /api/kpis'           => [KPIsController::class, 'resumen'],
    'GET /api/kpis/cola'      => [KPIsController::class, 'colaLeads'],
    'GET /api/kpis/horas'     => [KPIsController::class, 'kpiPorHora'],
    'GET /api/kpis/horas-pico'=> [KPIsController::class, 'horasPico'],
    'GET /api/kpis/ab'        => [KPIsController::class, 'abTests'],
];

$key = "$method $uri";

if (isset($routes[$key])) {
    [$class, $method_name] = $routes[$key];
    $controller = new $class($mysqli);
    $controller->$method_name();
} else {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not found', 'uri' => $uri]);
}

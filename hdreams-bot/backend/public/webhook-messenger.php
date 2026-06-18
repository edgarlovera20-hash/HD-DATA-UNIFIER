<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/Services/LeadScorerIA.php';
require __DIR__ . '/../app/Services/CanalManager.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$mysqli = new mysqli($_ENV['DB_HOST'], $_ENV['DB_USER'], $_ENV['DB_PASS'], $_ENV['DB_NAME']);
$mysqli->set_charset('utf8mb4');

// Verificación
if (isset($_GET['hub_mode']) && $_GET['hub_mode'] === 'subscribe') {
    echo ($_GET['hub_verify_token'] === $_ENV['META_VERIFY_TOKEN'])
        ? $_GET['hub_challenge']
        : http_response_code(403);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

foreach ($input['entry'] ?? [] as $entry) {
    foreach ($entry['messaging'] ?? [] as $event) {
        if (!isset($event['message']['text'])) continue;

        $psid   = $event['sender']['id'];
        $texto  = $event['message']['text'];
        $canal  = $input['object'] === 'instagram' ? 'instagram' : 'messenger';

        $empresa_id = 1;
        $seccion_id = 1;

        $psid_esc = $mysqli->real_escape_string($psid);
        $mysqli->query(
            "INSERT INTO leads (empresa_id,seccion_id,canal,canal_user_id,fuente)
             VALUES ($empresa_id,$seccion_id,'$canal','$psid_esc','$canal')
             ON DUPLICATE KEY UPDATE mensajes_recibidos=mensajes_recibidos+1,ultima_interaccion=NOW()"
        );
        $lead_id = $mysqli->insert_id
            ?: (int) $mysqli->query("SELECT id FROM leads WHERE canal_user_id='$psid_esc' AND canal='$canal'")->fetch_assoc()['id'];

        $scorer = new LeadScorerIA($empresa_id, $seccion_id, $mysqli);
        $scorer->calcularScore($lead_id);

        $hora  = (int) date('H');
        $fecha = date('Y-m-d');
        $mysqli->query(
            "INSERT INTO kpi_horario (empresa_id,seccion_id,canal,fecha,hora,mensajes_recibidos,leads_nuevos)
             VALUES ($empresa_id,$seccion_id,'$canal','$fecha',$hora,1,1)
             ON DUPLICATE KEY UPDATE mensajes_recibidos=mensajes_recibidos+1"
        );

        $canal_cfg = $mysqli->query(
            "SELECT * FROM canales WHERE empresa_id=$empresa_id AND seccion_id=$seccion_id AND canal='$canal'"
        )->fetch_assoc();

        $manager   = new CanalManager($empresa_id, $seccion_id, $mysqli, $canal_cfg);
        $respuesta = "Hola, soy Lic. Gissell de RH. ¿Qué edad tienes y en qué ciudad estás?";
        $manager->procesarMensaje($psid, $texto);
        $manager->enviarRespuesta($psid, $respuesta);
    }
}

http_response_code(200);
echo json_encode(['status' => 'ok']);

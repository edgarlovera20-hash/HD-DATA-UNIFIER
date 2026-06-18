<?php

class CanalManager
{
    private int    $empresa_id;
    private int    $seccion_id;
    private \mysqli $mysqli;
    private array  $canal_config;
    private string $canal;

    public function __construct(int $empresa_id, int $seccion_id, \mysqli $mysqli, array $canal_config)
    {
        $this->empresa_id   = $empresa_id;
        $this->seccion_id   = $seccion_id;
        $this->mysqli       = $mysqli;
        $this->canal_config = $canal_config;
        $this->canal        = $canal_config['canal'];
    }

    public function procesarMensaje(string $user_id, string $texto, string $tipo = 'text'): string
    {
        $user_id_esc = $this->mysqli->real_escape_string($user_id);
        $texto_esc   = $this->mysqli->real_escape_string($texto);
        $canal_esc   = $this->mysqli->real_escape_string($this->canal);

        $stmt = $this->mysqli->prepare(
            "INSERT INTO ia_logs (empresa_id,seccion_id,wa_id,canal,pregunta) VALUES (?,?,?,?,?)"
        );
        $stmt->bind_param('iisss', $this->empresa_id, $this->seccion_id, $user_id, $this->canal, $texto);
        $stmt->execute();

        return 'ok';
    }

    public function enviarRespuesta(string $user_id, string $texto): void
    {
        match ($this->canal) {
            'messenger', 'instagram' => $this->enviarMessenger($user_id, $texto),
            'whatsapp'               => $this->enviarWhatsApp($user_id, $texto),
            'telegram'               => $this->enviarTelegram($user_id, $texto),
            default                  => null,
        };

        // registrar mensaje enviado
        $this->mysqli->query(
            "UPDATE leads SET mensajes_enviados=mensajes_enviados+1 WHERE canal_user_id='" .
            $this->mysqli->real_escape_string($user_id) . "' AND canal='" .
            $this->mysqli->real_escape_string($this->canal) . "'"
        );
    }

    // -------------------------------------------------------
    private function enviarMessenger(string $psid, string $texto): void
    {
        $this->graphPost('me/messages', [
            'recipient'      => ['id' => $psid],
            'message'        => ['text' => $texto],
            'messaging_type' => 'RESPONSE',
        ], $this->canal_config['access_token'] ?? '');
    }

    private function enviarWhatsApp(string $wa_id, string $texto): void
    {
        $phone_id = getenv('WA_PHONE_ID');
        $token    = getenv('WA_TOKEN');

        $this->graphPost("$phone_id/messages", [
            'messaging_product' => 'whatsapp',
            'to'                => $wa_id,
            'text'              => ['body' => $texto],
        ], $token);
    }

    private function enviarTelegram(string $chat_id, string $texto): void
    {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        $url   = "https://api.telegram.org/bot$token/sendMessage";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST          => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS    => json_encode(['chat_id' => $chat_id, 'text' => $texto]),
            CURLOPT_HTTPHEADER    => ['Content-Type: application/json'],
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    private function graphPost(string $endpoint, array $data, string $token): void
    {
        $ch = curl_init("https://graph.facebook.com/v25.0/$endpoint");
        curl_setopt_array($ch, [
            CURLOPT_POST          => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS    => json_encode($data),
            CURLOPT_HTTPHEADER    => [
                "Authorization: Bearer $token",
                'Content-Type: application/json',
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

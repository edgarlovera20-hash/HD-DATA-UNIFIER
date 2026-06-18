<?php
class LeadScorerIA {
    private $empresa_id, $seccion_id, $mysqli, $openai_key;
    public function __construct($empresa_id, $seccion_id, $mysqli){
        $this->empresa_id = $empresa_id;
        $this->seccion_id = $seccion_id;
        $this->mysqli = $mysqli;
        $this->openai_key = getenv('OPENAI_API_KEY');
    }
    public function calcularScore($lead_id){
        $lead = $this->mysqli->query("SELECT l.*, s.system_prompt FROM leads l JOIN secciones s ON l.seccion_id=s.id WHERE l.id=$lead_id")->fetch_assoc();
        $prompt = "Eres experto en reclutamiento. Analiza lead: ".json_encode($lead)." Responde JSON: {\"score_candidato\":85,\"score_contratacion\":72,\"score_prioridad\":77,\"factores_positivos\":[\"edad_ideal\"],\"factores_negativos\":[],\"razonamiento\":\"...\"}";
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$this->openai_key,'Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode(['model'=>'gpt-4o','messages'=>[['role'=>'user','content'=>$prompt]],'temperature'=>0.3,'response_format'=>['type'=>'json_object']])]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $resultado = json_decode($response['choices'][0]['message']['content'], true);
        $this->guardarScores($lead_id, $resultado);
        return $resultado;
    }
    private function guardarScores($lead_id, $r){
        $fp = json_encode($r['factores_positivos']);
        $fn = json_encode($r['factores_negativos']);
        $raz = addslashes($r['razonamiento']);
        $this->mysqli->query("INSERT INTO lead_scoring_ia (lead_id,score_candidato,score_contratacion,score_prioridad,factores_positivos,factores_negativos,razonamiento) VALUES ($lead_id,{$r['score_candidato']},{$r['score_contratacion']},{$r['score_prioridad']},'$fp','$fn','$raz') ON DUPLICATE KEY UPDATE score_prioridad={$r['score_prioridad']},calculado_en=NOW()");
        $prioridad = $r['score_prioridad']>=80?'urgente':($r['score_prioridad']>=65?'alta':($r['score_prioridad']>=40?'media':'baja'));
        $this->mysqli->query("UPDATE leads SET score_ia_candidato={$r['score_candidato']},score_ia_contratacion={$r['score_contratacion']},prioridad='$prioridad' WHERE id=$lead_id");
    }
}
?>

<?php

namespace App\Controllers;

class KPIsController
{
    private \mysqli $db;

    public function __construct(\mysqli $db)
    {
        $this->db = $db;
    }

    // GET /api/kpis?empresa_id=1&desde=2026-06-01&hasta=2026-06-18
    public function resumen(): void
    {
        $empresa_id = (int) ($_GET['empresa_id'] ?? 0);
        $desde      = $this->sanitizeDate($_GET['desde'] ?? date('Y-m-01'));
        $hasta      = $this->sanitizeDate($_GET['hasta'] ?? date('Y-m-d'));

        if (!$empresa_id) {
            $this->json(['error' => 'empresa_id requerido'], 400);
            return;
        }

        $totales   = $this->totalesLeads($empresa_id, $desde, $hasta);
        $horario   = $this->leadsPorHora($empresa_id, $desde, $hasta);
        $prioridad = $this->distribucionPrioridad($empresa_id, $desde, $hasta);
        $canales   = $this->leadsPorCanal($empresa_id, $desde, $hasta);

        $this->json([
            'periodo' => ['desde' => $desde, 'hasta' => $hasta],
            'totales' => $totales,
            'por_hora' => $horario,
            'por_prioridad' => $prioridad,
            'por_canal' => $canales,
        ]);
    }

    // GET /api/kpis/cola?empresa_id=1&prioridad=urgente
    public function colaLeads(): void
    {
        $empresa_id = (int) ($_GET['empresa_id'] ?? 0);
        $prioridad  = $_GET['prioridad'] ?? null;
        $limite     = min((int) ($_GET['limite'] ?? 20), 100);

        if (!$empresa_id) {
            $this->json(['error' => 'empresa_id requerido'], 400);
            return;
        }

        $where = "l.empresa_id = $empresa_id AND l.estado NOT IN ('descartado','contratado')";
        if ($prioridad && in_array($prioridad, ['urgente','alta','media','baja'], true)) {
            $where .= " AND l.prioridad = '$prioridad'";
        }

        $sql = "SELECT l.id, l.nombre, l.telefono, l.ciudad, l.prioridad, l.estado,
                       l.score_ia_candidato, l.score_ia_contratacion, l.creado_en,
                       s.nombre AS seccion
                FROM leads l
                JOIN secciones s ON l.seccion_id = s.id
                WHERE $where
                ORDER BY FIELD(l.prioridad,'urgente','alta','media','baja'),
                         l.score_ia_candidato DESC
                LIMIT $limite";

        $result = $this->db->query($sql);
        $leads  = [];
        while ($row = $result->fetch_assoc()) {
            $leads[] = $row;
        }

        $this->json(['leads' => $leads, 'total' => count($leads)]);
    }

    // GET /api/kpis/horas?empresa_id=1&fecha=2026-06-18
    public function kpiPorHora(): void
    {
        $empresa_id = (int) ($_GET['empresa_id'] ?? 0);
        $fecha      = $this->sanitizeDate($_GET['fecha'] ?? date('Y-m-d'));

        if (!$empresa_id) {
            $this->json(['error' => 'empresa_id requerido'], 400);
            return;
        }

        $sql = "SELECT hora, leads_recibidos, leads_calificados, leads_descartados,
                       mensajes_enviados, tasa_respuesta, tiempo_respuesta_avg
                FROM kpi_horario
                WHERE empresa_id = $empresa_id AND fecha = '$fecha'
                ORDER BY hora";

        $result = $this->db->query($sql);
        $horas  = [];
        while ($row = $result->fetch_assoc()) {
            $horas[] = $row;
        }

        $this->json(['fecha' => $fecha, 'horas' => $horas]);
    }

    // -------------------------------------------------------
    // Internos
    // -------------------------------------------------------

    private function totalesLeads(int $empresa_id, string $desde, string $hasta): array
    {
        $sql = "SELECT
                  COUNT(*) AS total,
                  SUM(estado = 'nuevo') AS nuevos,
                  SUM(estado = 'en_proceso') AS en_proceso,
                  SUM(estado = 'calificado') AS calificados,
                  SUM(estado = 'descartado') AS descartados,
                  SUM(estado = 'contratado') AS contratados,
                  ROUND(AVG(score_ia_candidato), 1) AS score_candidato_avg,
                  ROUND(AVG(score_ia_contratacion), 1) AS score_contratacion_avg
                FROM leads
                WHERE empresa_id = $empresa_id
                  AND DATE(creado_en) BETWEEN '$desde' AND '$hasta'";

        return $this->db->query($sql)->fetch_assoc() ?? [];
    }

    private function leadsPorHora(int $empresa_id, string $desde, string $hasta): array
    {
        $sql = "SELECT HOUR(creado_en) AS hora, COUNT(*) AS leads
                FROM leads
                WHERE empresa_id = $empresa_id
                  AND DATE(creado_en) BETWEEN '$desde' AND '$hasta'
                GROUP BY HOUR(creado_en)
                ORDER BY hora";

        $result = $this->db->query($sql);
        $rows   = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    private function distribucionPrioridad(int $empresa_id, string $desde, string $hasta): array
    {
        $sql = "SELECT prioridad, COUNT(*) AS total
                FROM leads
                WHERE empresa_id = $empresa_id
                  AND DATE(creado_en) BETWEEN '$desde' AND '$hasta'
                GROUP BY prioridad";

        $result = $this->db->query($sql);
        $rows   = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    private function leadsPorCanal(int $empresa_id, string $desde, string $hasta): array
    {
        $sql = "SELECT COALESCE(l.fuente, 'desconocido') AS canal, COUNT(*) AS total
                FROM leads l
                WHERE l.empresa_id = $empresa_id
                  AND DATE(l.creado_en) BETWEEN '$desde' AND '$hasta'
                GROUP BY l.fuente
                ORDER BY total DESC";

        $result = $this->db->query($sql);
        $rows   = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    private function sanitizeDate(string $date): string
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : date('Y-m-d');
    }

    private function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

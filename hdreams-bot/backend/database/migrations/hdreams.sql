-- HDreams Bot - Database Schema
-- Created: 2026-06-18

CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    plan ENUM('basico','profesional','enterprise') DEFAULT 'basico',
    activa TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo ENUM('reclutamiento','ventas','soporte','custom') DEFAULT 'reclutamiento',
    system_prompt TEXT,
    activa TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    seccion_id INT NOT NULL,
    nombre VARCHAR(255),
    telefono VARCHAR(30),
    email VARCHAR(255),
    edad INT,
    ciudad VARCHAR(100),
    disponibilidad VARCHAR(100),
    experiencia TEXT,
    estado ENUM('nuevo','en_proceso','calificado','descartado','contratado') DEFAULT 'nuevo',
    prioridad ENUM('urgente','alta','media','baja') DEFAULT 'media',
    score_ia_candidato DECIMAL(5,2),
    score_ia_contratacion DECIMAL(5,2),
    fuente VARCHAR(100) DEFAULT 'whatsapp',
    notas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_scoring_ia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL UNIQUE,
    score_candidato DECIMAL(5,2),
    score_contratacion DECIMAL(5,2),
    score_prioridad DECIMAL(5,2),
    factores_positivos JSON,
    factores_negativos JSON,
    razonamiento TEXT,
    calculado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    seccion_id INT NOT NULL,
    wa_message_id VARCHAR(255),
    rol ENUM('user','assistant','system') NOT NULL,
    contenido TEXT NOT NULL,
    tipo_media ENUM('text','image','audio','document') DEFAULT 'text',
    media_url VARCHAR(500),
    enviado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audios_generados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    conversacion_id INT,
    texto_original TEXT NOT NULL,
    audio_url VARCHAR(500),
    duracion_segundos DECIMAL(8,2),
    voice_id VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhooks_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50),
    payload JSON,
    procesado TINYINT(1) DEFAULT 0,
    recibido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_leads_empresa ON leads(empresa_id);
CREATE INDEX idx_leads_seccion ON leads(seccion_id);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_prioridad ON leads(prioridad);
CREATE INDEX idx_conversaciones_lead ON conversaciones(lead_id);

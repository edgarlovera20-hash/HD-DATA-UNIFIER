-- HDreams Bot - Database Schema
-- Updated: 2026-06-18

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- -------------------------------------------------------
-- empresas
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(255) NOT NULL,
    slug          VARCHAR(100) UNIQUE NOT NULL,
    logo_url      VARCHAR(500),
    plan          ENUM('basico','profesional','enterprise') DEFAULT 'basico',
    activa        TINYINT(1) DEFAULT 1,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- secciones
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS secciones (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id    INT NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    tipo          ENUM('reclutamiento','ventas','soporte','custom') DEFAULT 'reclutamiento',
    system_prompt TEXT,
    activa        TINYINT(1) DEFAULT 1,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- canales
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS canales (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id    INT NOT NULL,
    seccion_id    INT,
    tipo          ENUM('whatsapp','facebook','instagram','web') NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    configuracion JSON,
    activo        TINYINT(1) DEFAULT 1,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- leads
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id           INT NOT NULL,
    seccion_id           INT NOT NULL,
    canal_id             INT,
    nombre               VARCHAR(255),
    telefono             VARCHAR(30),
    email                VARCHAR(255),
    edad                 INT,
    ciudad               VARCHAR(100),
    disponibilidad       VARCHAR(100),
    experiencia          TEXT,
    estado               ENUM('nuevo','en_proceso','calificado','descartado','contratado') DEFAULT 'nuevo',
    prioridad            ENUM('urgente','alta','media','baja') DEFAULT 'media',
    score_ia_candidato   DECIMAL(5,2),
    score_ia_contratacion DECIMAL(5,2),
    fuente               VARCHAR(100) DEFAULT 'whatsapp',
    notas                TEXT,
    creado_en            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE,
    FOREIGN KEY (canal_id) REFERENCES canales(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- lead_scoring_ia
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_scoring_ia (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    lead_id              INT NOT NULL UNIQUE,
    score_candidato      DECIMAL(5,2),
    score_contratacion   DECIMAL(5,2),
    score_prioridad      DECIMAL(5,2),
    factores_positivos   JSON,
    factores_negativos   JSON,
    razonamiento         TEXT,
    calculado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- kpi_horario
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_horario (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id      INT NOT NULL,
    seccion_id      INT,
    fecha           DATE NOT NULL,
    hora            TINYINT NOT NULL COMMENT '0-23',
    leads_recibidos INT DEFAULT 0,
    leads_calificados INT DEFAULT 0,
    leads_descartados INT DEFAULT 0,
    mensajes_enviados INT DEFAULT 0,
    tasa_respuesta  DECIMAL(5,2),
    tiempo_respuesta_avg INT COMMENT 'segundos',
    registrado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL,
    UNIQUE KEY uq_kpi_horario (empresa_id, seccion_id, fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- ab_tests
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_tests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id      INT NOT NULL,
    seccion_id      INT,
    nombre          VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    variante_a      TEXT NOT NULL,
    variante_b      TEXT NOT NULL,
    distribucion    TINYINT DEFAULT 50 COMMENT 'porcentaje para variante A',
    metrica_objetivo ENUM('tasa_respuesta','calificacion','contratacion') DEFAULT 'calificacion',
    resultado_a     DECIMAL(5,2),
    resultado_b     DECIMAL(5,2),
    estado          ENUM('activo','pausado','finalizado') DEFAULT 'activo',
    iniciado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizado_en   TIMESTAMP NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- facebook_posts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS facebook_posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id      INT NOT NULL,
    seccion_id      INT,
    fb_post_id      VARCHAR(255) UNIQUE NOT NULL,
    page_id         VARCHAR(100),
    mensaje         TEXT,
    imagen_url      VARCHAR(500),
    estado          ENUM('borrador','publicado','archivado') DEFAULT 'borrador',
    leads_generados INT DEFAULT 0,
    alcance         INT DEFAULT 0,
    interacciones   INT DEFAULT 0,
    publicado_en    TIMESTAMP NULL,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Índices
-- -------------------------------------------------------
CREATE INDEX idx_leads_empresa   ON leads(empresa_id);
CREATE INDEX idx_leads_seccion   ON leads(seccion_id);
CREATE INDEX idx_leads_estado    ON leads(estado);
CREATE INDEX idx_leads_prioridad ON leads(prioridad);
CREATE INDEX idx_kpi_fecha       ON kpi_horario(fecha);
CREATE INDEX idx_fb_page         ON facebook_posts(page_id);

SET foreign_key_checks = 1;

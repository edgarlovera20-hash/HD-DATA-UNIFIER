# HDreams Bot — Multi-Canal con IA

## Stack

| Capa | Tecnología |
|---|---|
| Backend | PHP 8.2 + MySQL 8 |
| Frontend | React 18 + Vite + TailwindCSS + Framer Motion |
| IA | GPT-4o (Lead Scoring Predictivo) |
| Canales | WhatsApp Cloud API, Messenger, Instagram, Facebook Lead Ads |

## Estructura

```
hdreams-bot/
├── backend/
│   ├── app/
│   │   ├── Controllers/KPIsController.php   # /api/kpis endpoints
│   │   └── Services/
│   │       ├── LeadScorerIA.php             # GPT-4o scoring
│   │       └── CanalManager.php             # Envío multi-canal
│   ├── database/migrations/hdreams.sql      # 13 tablas + seed
│   ├── public/
│   │   ├── index.php                        # Router principal
│   │   ├── webhook-whatsapp.php
│   │   ├── webhook-messenger.php
│   │   └── webhook-lead-ads.php
│   └── composer.json
└── frontend/
    └── src/
        ├── App.jsx                          # Router + Sidebar
        ├── pages/Dashboard.jsx
        └── components/
            ├── ui/
            │   ├── Card.jsx
            │   ├── Metric.jsx               # Contador animado
            │   └── Badge.jsx                # Prioridad + estado + canal
            └── dashboard/
                ├── KPIGrid.jsx
                ├── HoursChart.jsx           # Barras horas pico
                └── LeadQueue.jsx            # Cola priorizada IA
```

## Instalación rápida

### Backend

```bash
cd backend
composer install
cp ../.env.example .env
# Editar .env con tus credenciales
mysql -u root -p < database/migrations/hdreams.sql
php -S localhost:8000 -t public
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `DB_HOST / DB_NAME / DB_USER / DB_PASS` | Base de datos MySQL |
| `OPENAI_API_KEY` | GPT-4o lead scoring |
| `META_VERIFY_TOKEN` | Token de verificación webhooks Meta |
| `WA_PHONE_ID` + `WA_TOKEN` | WhatsApp Cloud API |
| `RECRUITER_PHONE` | Teléfono del reclutador (notificaciones urgentes) |

## Webhooks Meta

| URL | Canal |
|---|---|
| `/webhook-whatsapp.php` | WhatsApp Cloud API |
| `/webhook-messenger.php` | Messenger + Instagram |
| `/webhook-lead-ads.php` | Facebook Lead Ads |

## API Endpoints

```
GET /api/kpis?empresa_id=1&desde=2026-06-01&hasta=2026-06-18
GET /api/kpis/cola?empresa_id=1&prioridad=urgente&limite=20
GET /api/kpis/horas?empresa_id=1&fecha=2026-06-18
GET /api/kpis/horas-pico?empresa_id=1&seccion_id=1
GET /api/kpis/ab?empresa_id=1
```

## Acceso

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/kpis?empresa_id=1

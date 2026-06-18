# HDreams Bot - Instalación

## Backend
```bash
cd backend
composer install
cp ../.env.example .env
# Editar .env con tus keys
mysql -u root -p < database/migrations/hdreams.sql
php -S localhost:8000 -t public
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Acceso
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

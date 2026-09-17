# Guía de Inicio Rápido (Getting Started) - AyVino

Esta guía describe los pasos para poner en marcha el entorno local de desarrollo de AyVino (Base de datos, Backend y Frontend).

---

## 1. Requisitos Previos

- **.NET SDK** (8.0 o superior).
- **Node.js** (v20 o superior) y **npm** (v10 o superior).
- **Docker** y **Docker Compose** (para la base de datos PostgreSQL).

---

## 2. Puesta en Marcha

### Paso 1: Levantar la Base de Datos PostgreSQL
En la raíz del proyecto:
```bash
docker compose up -d postgres
```
Esto inicializará el contenedor `postgres_db` en el puerto configurado (por defecto `5432`).

### Paso 2: Iniciar el Backend (.NET Web API)
```bash
cd src/backend/AyVino.Api
dotnet run
```
- La API arrancará y ejecutará automáticamente las migraciones pendientes con `FluentMigrator`.
- La documentación interactiva (Swagger / OpenAPI) estará disponible en:
  - `http://localhost:5000/swagger` (o el puerto configurado en `launchSettings.json`).

### Paso 3: Iniciar el Frontend (React + Vite)
En otra terminal:
```bash
cd src/frontend
npm install
npm run dev
```
- El servidor de desarrollo de Vite abrirá la aplicación en `http://localhost:5173`.

---

## 3. Ejecución de Pruebas y Validación de Calidad

### Pruebas Backend:
```bash
dotnet test
```

### Comprobación de Tipos y Linter en Frontend:
```bash
cd src/frontend
npm run build    # Ejecuta tsc -b y el empaquetado de Vite
npm run lint     # Ejecuta ESLint sobre archivos .ts y .tsx
```
Ambos comandos deben finalizar con **0 errores y 0 advertencias** para cumplir con la constitución del proyecto ([`AGENTS.md`](file:///c:/Codigo%20General/AyVino/AyVino/AGENTS.md)).


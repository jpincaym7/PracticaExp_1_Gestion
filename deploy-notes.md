# Deploy Notes – Sistema de Gestión Institucional

Documento de despliegue simulado para la Sesión 3 del pipeline CI/CD.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Docker      | 24.x          | `docker --version` |
| Docker Compose | 2.x        | `docker compose version` |
| Git         | 2.x           | `git --version` |

---

## Pasos de despliegue simulado (local)

### 1. Clonar el repositorio

```bash
git clone <url-repositorio>
cd PracticaExp_1_Gestion
```

### 2. Verificar que Docker esté corriendo

```bash
docker info
```

### 3. Construir y levantar los contenedores

```bash
cd backend/institucion
docker compose up --build -d
```

Esto realiza automáticamente:
- Construye la imagen Django desde el `Dockerfile`
- Levanta el contenedor PostgreSQL con healthcheck
- Ejecuta `python manage.py migrate` al iniciar
- Expone el servidor en `http://localhost:8000`

### 4. Verificar que los contenedores están corriendo

```bash
docker compose ps
```

Salida esperada:
```
NAME              IMAGE                 STATUS
institucion_db    postgres:15-alpine    Up (healthy)
institucion_web   institucion-web       Up
```

### 5. Verificar desde el navegador

Abrir `http://localhost:8000/api/academico/modalidades` y confirmar respuesta JSON.

### 6. Ver logs en tiempo real

```bash
# Logs del servidor Django
docker compose logs web -f

# Logs de PostgreSQL
docker compose logs db -f
```

### 7. Apagar el entorno

```bash
docker compose down          # Para contenedores (preserva datos)
docker compose down -v       # Para contenedores y elimina volúmenes
```

---

## Despliegue desde artefacto de GitHub Actions

Cuando el pipeline de CI/CD genera el artefacto `docker-image-<sha>.tar.gz`:

```bash
# 1. Descargar el artefacto desde GitHub Actions
# (ir a Actions > Build Docker > Artifacts > Descargar)

# 2. Cargar la imagen localmente
docker load < docker-image-<sha>.tar.gz

# 3. Verificar que la imagen está disponible
docker images | grep institucion-backend

# 4. Levantar con docker compose usando la imagen preconstruida
cd backend/institucion
docker compose up -d
```

---

## Variables de entorno

Todas las variables de entorno se pasan directamente en `docker-compose.yml`.
Para producción, usar un archivo `.env` separado:

```bash
cp .env.example .env
# Editar .env con valores reales
docker compose --env-file .env up -d
```

---

## Endpoints verificados post-despliegue

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/academico/modalidades` | GET | Lista modalidades |
| `/api/academico/carreras` | GET | Lista carreras |
| `/admin/` | GET | Panel de administración |

---

## Solución de problemas comunes

**El contenedor web no arranca:**
```bash
docker compose logs web
# Revisar errores de conexión a la base de datos
```

**La base de datos no está lista:**
```bash
docker compose restart web
# El healthcheck garantiza que PostgreSQL esté listo antes de que arranque web
```

**Puerto 8000 ocupado:**
```bash
# Cambiar el puerto en docker-compose.yml
ports:
  - "8001:8000"
```

---

*Generado: Junio 2026 – Pipeline CI/CD Sesión 3*

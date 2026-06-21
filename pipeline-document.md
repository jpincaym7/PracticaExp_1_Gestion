# Documento Técnico – Flujo CI/CD para Django

**Proyecto:** Sistema de Gestión Institucional  
**Tecnologías:** Django 5.0 · PostgreSQL · Docker · GitHub Actions  
**Fecha:** Junio 2026

---

## 1. Diagrama del Flujo CI/CD

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DESARROLLADOR                                │
│                  git push / pull request                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS TRIGGER                           │
│         (on: push → master/main/ci-setup, pull_request)             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │                             │
              ▼                             │
┌─────────────────────────┐                │
│   JOB 1: test           │                │
│   "Sesión 1 – Tests"    │                │
│                         │                │
│  ┌─────────────────┐    │                │
│  │ Service: Postgres│    │                │
│  │ (postgres:15)   │    │                │
│  └─────────────────┘    │                │
│                         │                │
│  1. Checkout código     │                │
│  2. Setup Python 3.10   │                │
│  3. pip install deps    │                │
│  4. Verificar estructura│                │
│  5. manage.py migrate   │                │
│  6. manage.py test ✓    │                │
└──────────┬──────────────┘                │
           │ needs: test                   │
           ▼                               │
┌─────────────────────────┐                │
│   JOB 2: build          │                │
│  "Sesión 2/3 – Docker"  │                │
│                         │                │
│  1. Checkout código     │                │
│  2. Setup Buildx        │                │
│  3. docker build        │                │
│  4. Verificar imagen    │                │
│  5. docker save → .gz   │                │
│  6. Upload artifact ✓   │                │
└──────────┬──────────────┘                │
           │ needs: build                  │
           ▼                               │
┌─────────────────────────┐                │
│   JOB 3: deploy-sim     │                │
│  "Sesión 3 – Deploy"    │                │
│                         │                │
│  1. Download artifact   │                │
│  2. docker load         │                │
│  3. docker compose up   │                │
│  4. Validar contenedores│                │
│  5. curl HTTP check     │                │
│  6. docker compose down │                │
└─────────────────────────┘                │
                                           │
                    ───────────────────────┘
                    (Si algún job falla,
                     los siguientes no ejecutan)
```

---

## 2. Estructura del Proyecto

```
PracticaExp_1_Gestion/
├── .github/
│   └── workflows/
│       └── ci.yml              ← Pipeline completo
├── backend/
│   └── institucion/
│       ├── manage.py           ← Punto de entrada Django
│       ├── requirements.txt    ← Dependencias Python
│       ├── Dockerfile          ← Imagen Docker (python:3.10-slim)
│       ├── docker-compose.yml  ← Orquestación (web + db)
│       ├── institucion/
│       │   ├── settings.py     ← Configuración Django
│       │   └── urls.py         ← URLs principales
│       └── apps/
│           ├── core/           ← Módulo base (BaseModel, BaseViewSet)
│           └── academico/      ← Módulo académico (Carrera, Modalidad)
│               └── tests/
│                   ├── test_validators.py  (20 tests)
│                   ├── test_models.py      (18 tests)
│                   └── test_api.py         (29 tests)
├── frontend/
│   └── institucion-app/       ← Next.js 16
├── deploy-notes.md            ← Guía de despliegue
└── pipeline-document.md       ← Este documento
```

---

## 3. Explicación del archivo `.github/workflows/ci.yml`

### Trigger (activación)

```yaml
on:
  push:
    branches: [master, main, ci-setup]
  pull_request:
    branches: [master, main]
```

El pipeline se activa en cada `push` a las ramas de desarrollo y en cada Pull Request hacia `master/main`.

### Job 1: `test` – Pruebas automatizadas

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: institucion_db
    options: --health-cmd pg_isready ...
```

GitHub Actions levanta un contenedor PostgreSQL como servicio del job. Django se conecta a `localhost:5432` gracias al port mapping automático.

Las variables de entorno `SECRET_KEY`, `DEBUG` y las credenciales de BD se pasan directamente al job, sin necesidad de archivo `.env`.

**Suite de tests (67 tests):**

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| `test_validators.py` | 20 | Validadores de nombre |
| `test_models.py` | 18 | Modelos, soft delete, restore |
| `test_api.py` | 29 | Endpoints CRUD completos |

### Job 2: `build` – Construcción Docker

```yaml
needs: test  # Solo ejecuta si los tests pasan
```

Construye la imagen Docker y la guarda como artefacto comprimido (`.tar.gz`) disponible por 7 días en la interfaz de GitHub Actions. Esto simula la publicación a un registro de imágenes (DockerHub, ECR, etc.).

### Job 3: `deploy-simulation` – Simulación de despliegue

```yaml
needs: build  # Cadena: test → build → deploy
```

Descarga el artefacto generado en el job anterior, lo carga con `docker load`, levanta el entorno completo con `docker compose up` y valida que el servidor responde con `curl`. Al finalizar, apaga los contenedores.

---

## 4. Dockerfile

```dockerfile
FROM python:3.10-slim          # Base oficial Python 3.10

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1  # No genera archivos .pyc
ENV PYTHONUNBUFFERED=1         # Output sin buffer (mejor para logs)

RUN apt-get update && apt-get install -y \
    libpq-dev gcc               # Dependencias para psycopg2

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

ENTRYPOINT ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

**Decisiones de diseño:**
- `python:3.10-slim` en lugar de `python:3.10` reduce el tamaño ~60%
- `PYTHONDONTWRITEBYTECODE` y `PYTHONUNBUFFERED` son mejores prácticas para contenedores
- `libpq-dev` y `gcc` son requeridos por `psycopg2-binary` para compilar

---

## 5. Docker Compose

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
    volumes:
      - postgres_data:/var/lib/postgresql/data   # Persistencia de datos

  web:
    build: .
    depends_on:
      db:
        condition: service_healthy               # Espera que PostgreSQL esté listo
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"
```

El `healthcheck` en el servicio `db` garantiza que Django no intente conectarse a PostgreSQL antes de que esté listo para aceptar conexiones.

---

## 6. Recomendaciones finales

### Para el entorno de producción

1. **Cambiar `DEBUG=False`** y configurar `ALLOWED_HOSTS` con el dominio real
2. **Generar una `SECRET_KEY` segura**: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
3. **No guardar credenciales en el código**: Usar GitHub Secrets para variables sensibles
4. **Separar el comando de producción**: Reemplazar `runserver` por `gunicorn`:
   ```bash
   gunicorn institucion.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```
5. **Agregar `pip install gunicorn` al `requirements.txt`**
6. **Configurar NGINX como proxy inverso** delante de Gunicorn
7. **Usar `multi-stage build` en Dockerfile** para reducir el tamaño de la imagen final
8. **Ampliar la suite de tests** con pruebas de integración y cobertura (`coverage.py`)

### Para el pipeline CI/CD

9. **Agregar GitHub Secrets** para `SECRET_KEY`, `POSTGRES_PASSWORD` en configuración del repositorio
10. **Publicar imagen a DockerHub**:
    ```yaml
    - name: Push a DockerHub
      run: |
        docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker push institucion-backend:latest
    ```
11. **Agregar notificaciones** (Slack, email) cuando el pipeline falla
12. **Configurar protección de rama** en GitHub para requerir que el CI pase antes de merge

---

## 7. Comandos de referencia rápida

```bash
# Ejecutar tests localmente
cd backend/institucion
python manage.py test apps.academico.tests --verbosity=2

# Construir imagen Docker
docker build -t institucion-backend:latest .

# Levantar entorno completo
docker compose up --build -d

# Ver logs
docker compose logs -f

# Apagar y limpiar
docker compose down -v
```

---

*Documento técnico generado para la Práctica de Experimentación 1 – Pipeline CI/CD*  
*Fecha: Junio 2026*

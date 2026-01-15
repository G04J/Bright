# Deployment (Google Cloud Run + Cloud SQL)

This section describes deploying the API container to Cloud Run and connecting it to a Cloud SQL PostgreSQL database.

## Prerequisites

- Google Cloud project created
- Billing enabled
- gcloud CLI installed
- You are logged into gcloud

Check:
```bash
gcloud --version
gcloud auth login
gcloud config set project bright-484408
gcloud config set run/region australia-southeast1
```

Enable required services:
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

## 1) Build and push Docker image (Artifact Registry)

Create Artifact Registry repo (run once):
```bash
gcloud artifacts repositories create bright \
  --repository-format=docker \
  --location=australia-southeast1 \
  --description="Bright API images"
```

Build and push the image using Cloud Build:
```bash
gcloud builds submit \
  --tag australia-southeast1-docker.pkg.dev/bright-484408/bright/bright-api:latest
```

## 2) Create Cloud SQL PostgreSQL

Create instance:
```bash
gcloud sql instances create bright-postgres \
  --database-version=POSTGRES_16 \
  --region=australia-southeast1 \
  --edition=ENTERPRISE \
  --cpu=1 \
  --memory=4GB \
  --storage-size=10GB
```

Set password for postgres user:
```bash
gcloud sql users set-password postgres \
  --instance=bright-postgres \
  --password=postgres
```

Create database:
```bash
gcloud sql databases create bright --instance=bright-postgres
```

Get instance connection name:
```bash
CONN_NAME=$(gcloud sql instances describe bright-postgres --format="value(connectionName)")
echo "$CONN_NAME"
```

## 3) Create secrets (JWT_SECRET and DATABASE_URL)

Create JWT secret:
```bash
echo -n "a6364e1f0ade2c56f1b076c23686746d5bf01359e9b3982e2eba6172c31fb025" | \
gcloud secrets create JWT_SECRET --data-file=-
```

Create DATABASE_URL (Cloud SQL socket connection):
```bash
DATABASE_URL_VALUE="postgresql://postgres:postgres@localhost:5432/bright?schema=public&host=/cloudsql/${CONN_NAME}"
echo -n "$DATABASE_URL_VALUE" | gcloud secrets create DATABASE_URL --data-file=-
```

Grant Cloud Run permission to access secrets:
```bash
PROJECT_NUMBER=$(gcloud projects describe bright-484408 --format="value(projectNumber)")
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

Grant Cloud Run permission to connect to Cloud SQL:
```bash
gcloud projects add-iam-policy-binding bright-484408 \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/cloudsql.client"
```

## 4) Run Prisma migrations in production

Create a Cloud Run Job:
```bash
gcloud run jobs create prisma-migrate \
  --image=australia-southeast1-docker.pkg.dev/bright-484408/bright/bright-api:latest \
  --set-cloudsql-instances="$CONN_NAME" \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest \
  --command="npx" \
  --args="prisma,migrate,deploy"
```

Execute it:
```bash
gcloud run jobs execute prisma-migrate
```

## 5) Deploy API to Cloud Run

```bash
gcloud run deploy bright-api \
  --image=australia-southeast1-docker.pkg.dev/bright-484408/bright/bright-api:latest \
  --add-cloudsql-instances="$CONN_NAME" \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest \
  --set-env-vars=NODE_ENV=production,JWT_EXPIRES_IN=1d \
  --allow-unauthenticated
```

Get service URL:
```bash
gcloud run services describe bright-api --format="value(status.url)"
```

Swagger:
```
https://YOUR_SERVICE_URL/docs
```

Verify deployment quickly (curl):
```bash
curl -i https://YOUR_SERVICE_URL/docs
```
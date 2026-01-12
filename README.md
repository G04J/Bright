# Bright
Technical assessment for the position of backend software developer for bright OS. 

# Bright OS Health & Wellness Platform - Task Requirements

## OBJECTIVE

Bright OS builds a health & wellness platform that collects, analyses, and serves user health data (activity, sleep, nutrition, heart rate, etc.). We are looking for engineers who can design and implement robust, scalable server-side services that handle sensitive user data, integrate with external APIs, and run efficiently in Google Cloud environments, particularly Cloud Run. Your task is to implement a simplified version of a user health data ingestion and retrieval service.

## TASK REQUIREMENTS

You will implement a REST API service with the following features:

### 1. User Data Ingestion

**Endpoint:** `POST /users/{userId}/health-data`

**Requirements:**
- Accepts JSON payloads with user health metrics (e.g., steps, calories, sleep hours)
- Validate payload structure and data types
- Store data in Google Cloud Firestore (or Cloud SQL if you prefer relational)

**Example Payload:**
```json
{
  "timestamp": "2026-01-08T08:30:00Z",
  "steps": 1200,
  "calories": 450,
  "sleepHours": 7.5
}
```

### 2. User Data Retrieval

**Endpoint:** `GET /users/{userId}/health-data?start=DD-MM-YYYY&end=DD-MM-YYYY`

**Requirements:**
- Returns a list of health data entries for the user within the date range
- Paginate results if more than 50 entries

### 3. Basic Aggregation

**Endpoint:** `GET /users/{userId}/summary?start=DD-MM-YYYY&end=DD-MM-YYYY`

**Requirements:**
- Returns aggregated metrics for the user:
  - Total steps
  - Average calories
  - Average sleep hours

### 4. Authentication & Security

**Requirements:**
- Implement basic authentication (e.g., API key header or JWT) to secure endpoints
- Validate the user identity before processing requests

### 5. Cloud Deployment

**Requirements:**
- Containerize the service using Docker
- Deploy it to Google Cloud Run
- Include a README with instructions to build, deploy, and test locally and on Cloud Run

## BONUS (Optional but Impressive)

- Implement a simple caching layer for GET requests using Google Cloud Memorystore / Redis
- Implement input validation and error handling with descriptive HTTP error codes
- Add unit tests or integration tests for the endpoints
- Implement rate limiting to protect the API

## SUGGESTED TECH TASK

**Language:** Node.js / TypeScript, Python / FastAPI, Go, or any language you are comfortable with

**Database:** Firestore, Cloud SQL (PostgreSQL/MySQL)

**Cloud:** Google Cloud Run, optional: Cloud Memorystore

**Authentication:** JWT or API key

## DELIVERABLES

1. **Source code in a Git repository**

2. **README with:**
   - Setup instructions
   - Deployment instructions for Cloud Run
   - Example API requests

3. **Optional:** Test coverage and benchmark results (if implemented)

## EVALUATION CRITERIA

Your submission will be evaluated on:

- **Correctness of endpoints and functionality** — All endpoints work as specified
- **Code readability, structure, and best practices** — Clean, well-organized code
- **Cloud Run deployment and configuration** — Proper containerization and deployment
- **Security and error handling** — Robust authentication and proper error responses
- **Bonus points for:**
  - Testing (unit or integration tests)
  - Caching implementation
  - Efficient data storage & retrieval
  - Thoughtful API design
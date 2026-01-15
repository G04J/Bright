# Bright Backend API

## Documentation

- [Local Setup](docs/local-setup.md) - Instructions for setting up the project locally
- [Project Layout](docs/project.md) - Information about the project structure and organization
- [Technical Specification](docs/spec.md) - Technical assessment specification for the project
- [Design Decisions](docs/choices.md) - Commentary on architectural and implementation decisions
- [Cloud Run Setup](docs/cloudrun-setup.md) - Guide for deploying to Google Cloud Run

## Database

The database is designed around a central User entity, with all health data stored as time series records owned by a user. Each health domain such as activity, nutrition, sleep, heart metrics, hydration, weight, and micronutrients (attributes inspired by the Bright OS app) is modelled as a separate entry table.

For health domains that contain multiple measurable attributes, such as activity types, food macronutrients, or micronutrients, the schema uses dedicated metric tables linked to a parent entry. This approach keeps the schema normalized while allowing flexibility as new metrics are added.

To support efficient analytics and insights, the database also includes a DailySummary table. This table stores per user, per day aggregated values such as total steps, macronutrient intake, sleep duration, hydration, and key micronutrients. Summaries are computed from raw time series data and are used for fast insight queries.

All tables are connected through explicit foreign key relationships to ensure data integrity. Frequently queried fields such as user identifiers and timestamps are indexed to support efficient time based queries.

## Directory Structure

The backend uses a layered NestJS architecture that separates HTTP controllers, business logic services, and dependency wiring modules. This improves readability, testability, and long term maintainability.

Although this is not the default NestJS folder structure, it was chosen intentionally to make the codebase easier to scale and reason about as the application grows.

## Authentication

The API uses JWT based authentication to secure all protected endpoints. Users authenticate using an email and password through the registration or login endpoints. Upon successful authentication, the server issues a signed JSON Web Token that represents the user's identity.

For any protected route, the client must include the JWT in the Authorization header using the Bearer token format. The token is validated on every request to ensure it is authentic and has not expired. If the token is missing or invalid, the request is rejected before any business logic is executed.

## Rate Limiting

To protect the API from abuse and denial of service attacks, a global rate limit of 20 requests per 60 seconds per IP address has been applied. This ensures fair usage while keeping the API responsive under load.

## Testing

The project includes unit tests written with Jest, focusing on white box testing of core business logic.

### Authentication Tests

Unit tests are provided for the authentication controller and service. These tests validate internal logic, service interactions, error handling, and return values in isolation using mocks.

## Health Data Ingestion

The health data ingestion endpoint accepts a flexible request body that allows partial or complete health data to be submitted for a given timestamp.

### API Request Body
```json
{
  "timestamp": "-",
  "activity": {
    "steps": "-",
    "cardioMinutes": "-",
    "strengthMinutes": "-"
  },
  "food": {
    "calories": "-",
    "carbsGrams": "-",
    "fatsGrams": "-",
    "proteinGrams": "-"
  },
  "sleep": {
    "hours": "-",
    "quality": "-"
  },
  "heart": {
    "bpm": "-",
    "resting": "-"
  },
  "micros": {
    "potassiumMg": "-",
    "calciumMg": "-",
    "sodiumMg": "-"
  },
  "hydration": {
    "liters": "-"
  },
  "weight": {
    "weightKg": "-"
  }
}
```

Each section is optional, but at least one health category must be provided per request.

## Health Data Retrieval

Health data can be retrieved within a specified date range. Results are returned as merged objects per timestamp and support pagination.

| Parameter | Type | Required | Format | Default | Description |
|-----------|------|----------|--------|---------|-------------|
| start | string | Yes | DD-MM-YYYY | - | Start date |
| end | string | Yes | DD-MM-YYYY | - | End date |
| page | number | No | ≥ 1 | 1 | Page number |
| limit | number | No | 1 to 50 | 50 | Page size |

## User Daily Summary

The API provides a daily summary endpoint that returns aggregated insights for a user over a specified date range. These summaries are computed from the DailySummary table to avoid expensive aggregation queries over raw time series data.

The summary includes totals and averages such as:

- Total steps
- Total cardio and strength minutes
- Average calorie intake
- Average sleep duration
- Total hydration
- Other key health indicators

Averages are calculated using only days where the corresponding metric was recorded. Days without data are excluded from the denominator to avoid skewed results.

This design allows the application to serve analytics and insights efficiently while keeping raw health data intact for detailed inspection when needed.

## Further Improvements that could be done with more time

There are a few areas that would be worth improving next as the project matures.

### End to End Testing
Add end to end tests that spin up the API and database together and validate full request flows. This would catch integration issues that unit tests cannot, such as authentication wiring, validation pipes, Prisma queries, and real HTTP responses.

### Dedicated Test Directory
Move tests into a separate top level `test/` directory. This keeps the `src/` folder focused on application code and makes it easier to manage unit, integration, and end to end test suites independently.

### Improve Summary Fetching Logic
The current daily summary retrieval can be improved by:
- Adding clearer rules for what counts as "recorded" (for example, distinguishing missing data from valid zero values).
- Supporting richer summary outputs, like per day breakdowns alongside totals.
- Reducing coupling between ingestion and summary logic if the project grows.

### Increase Coverage Quality
Line coverage is in a good place, but function coverage can remain low when only main branches are exercised. This will raise function coverage and make the suite more representative of real usage.

### Split userDataIngestion.service.ts into Smaller Modules
The `userDataIngestion.service.ts` file is currently doing ingestion, merging, and summary rebuilding in one place. Splitting it into smaller files would improve readability and long term maintainability. 


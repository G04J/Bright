## Database, 
The database is designed around a central User entity, with all health data stored as time series records owned by a user. Each health domain such as activity, nutrition, sleep, heart metrics, hydration, weight, and micronutrients (attributes that are inspired by the Bright OS app) is modelled as a separate entry table.

For health domains that contain multiple measurable attributes, for example activity types, food macronutrients, or micronutrients, the schema uses dedicated metric tables linked to a parent entry.

To support efficient analytics and insights, the database also includes a DailySummary table. This table stores per user, per day aggregated values such as total steps, macronutrient intake, sleep duration, hydration, and key micronutrients. 

All tables are connected through explicit foreign key relationships to ensure data integrity, and frequently queried fields such as user identifiers and timestamps are indexed to support efficient time based queries.

## Directroy strucute 
The backend uses a layered NestJS architecture that separates HTTP controllers, business logic services, and dependency wiring modules to improve readability, testability, and maintainability. Using this approach, it will be easier to scale the application in the future and maintain it. 
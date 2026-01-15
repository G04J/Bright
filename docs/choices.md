## Tech Stack

* **Node.js** for running the backend server
* **NestJS** for a structured and scalable application architecture
* **TypeScript** for compile-time type safety
* **Prisma** for type-safe database access and migrations
* **PostgreSQL** for reliable, relational data storage

## Why Each Choice

### Why NestJS instead of Express?

I chose NestJS because it provides a clear and consistent structure by default. With Express, developers must design their own architecture, which can lead to inconsistencies as a project grows.

From my experience working on a cancer clinic dashboard in a team environment, NestJS significantly reduced onboarding time. Because everyone followed the same architectural patterns, new team members could understand and contribute to the codebase quickly.

### Why TypeScript?

I used TypeScript to catch errors before the code runs. Type checking prevents many common bugs, such as passing incorrect data types between layers of the application.

In a healthcare-related system where data accuracy is critical, reducing runtime errors is especially important. TypeScript helped ensure reliability across the entire codebase.

### Why PostgreSQL instead of Firestore or MySQL?

I chose PostgreSQL because this application contains relational data that benefits from a structured schema.

Firestore is easier to start with, but it is not well suited for complex relationships between users, activities, and daily summaries. MySQL would also work, but PostgreSQL offers stronger support for advanced queries, constraints, and long-term scalability. It is also widely used in production systems across industry.

### Why Prisma instead of writing SQL directly?

Prisma allows me to define the database schema in a clear, declarative way and automatically generates type-safe queries. This reduces the chance of runtime database errors and makes refactoring safer.

Prisma migrations also make schema changes reproducible and easy to track, which is essential when working in a team or deploying across multiple environments.

## Database Design

Instead of using a single generic table, I designed separate tables for different types of health data, including activity entries, food entries, sleep entries, heart rate entries, and a daily summary table.

Although this approach requires more upfront work, it improves performance and maintainability. The daily summary table stores pre-calculated totals, allowing the API to return results quickly without recalculating large datasets on every request.


## Why This Approach for a Technical Assessment

I could have completed this assessment faster by using a simpler stack. However, I believe that to acticulate my skills in a way that mattered it was a good idea to go ahead with a strong architecture early which makes development easier in the long run.

This approach makes it easier to add new features, fix bugs, and onboard new developers. 


## What Is Included

* **Authentication** using JWT-based login and registration
* **Testing** with unit tests to verify core functionality
* **API documentation** generated with Swagger
* **Database migrations** to ensure consistent schema changes
* **Type safety** enforced across the application



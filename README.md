# CarGarage – Automotive Service Platform

[![Backend CI](https://github.com/saurabhdixit03/cargarage/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/saurabhdixit03/cargarage/actions/workflows/backend-ci.yml)

CarGarage is a booking and management platform for a car care and detailing garage. Customers register their cars, book one or more services for a date and automatically receive the best offer available to them. The garage admin manages the service catalogue, processes bookings, runs discount campaigns and showcases facelift kits for specific car models.

This repository contains the **REST API** (Spring Boot). A web frontend (React) is in development.

## Contents

- [Features](#features)
- [Business rules](#business-rules)
- [Booking life cycle](#booking-life-cycle)
- [Architecture and design](#architecture-and-design)
- [Domain model](#domain-model)
- [Tech stack](#tech-stack)
- [API overview](#api-overview)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

## Features

**Customers**
- Sign up and log in
- Manage their profile, password and cars
- Book several services for one car on one date
- Reschedule or cancel an open booking
- View their booking history with the prices and discount applied at booking time
- See the offers available to them and the facelift kits that fit each of their cars

**Admin**
- Manage the service catalogue
- Review bookings by status and accept, reject or complete them
- Create discount campaigns for regular or repeat customers on selected services, with an email notification to every targeted customer
- Manage facelift kits with ordered photo galleries

**Visitors**
- Browse active services and facelift kits, filtered by car make and model

## Business rules

**Bookings**
- A booking is for one car, one date and 1 to 10 services.
- Dates can be chosen from tomorrow up to 60 days ahead.
- A car can have only one open booking (pending or accepted) per day.
- Each booked service keeps the price it had at booking time, and the booking keeps its final total, so later price or offer changes never affect existing bookings.
- Customers can reschedule or cancel a booking only while it's pending or accepted, and only before the appointment day. A rescheduled booking returns to pending for the garage to confirm.

**Customers and offers**
- New customers are **regular**. A customer becomes a **repeat** customer after their first completed visit.
- Each offer targets either regular or repeat customers, covers selected services and has an end date.
- When a booking is made, every offer available to the customer is evaluated and the one that **saves the most money** is applied. An offer only reduces the price of the services it covers.

**Catalogue**
- Services, offers and facelift kits are deactivated rather than deleted, so booking history always stays intact.
- Licence plates are stored in a normalised form (`mh 12-ab 1234` → `MH12AB1234`) and must be unique.

## Booking life cycle

```
           accept               complete
PENDING ──────────▶ ACCEPTED ──────────▶ COMPLETED    (the customer becomes a repeat customer)
   │                    │
   │ reject             │ cancel (customer)
   ▼                    ▼
REJECTED            CANCELLED          (a pending booking can also be cancelled)
```

Each action is allowed only from the status shown. Completing is allowed on or after the appointment day.

## Architecture and design

The API follows a layered design: **controllers** (HTTP and validation) → **services** (business rules and transactions) → **repositories** (Spring Data JPA) → MySQL. Requests and responses use immutable DTO records, so entities are never exposed directly.

- **Authentication:** stateless JWT (HS256) using Spring Security's OAuth2 Resource Server support. Passwords are hashed with BCrypt.
- **Authorization:** role-based URL rules (`ADMIN`, `CUSTOMER`) and consistent JSON responses for 401 and 403.
- **Ownership:** customer endpoints live under `/api/customers/me/...`, and the customer id is always taken from the verified token through a `@CurrentUserId` annotation, never from the URL or request body. Requests for another customer's data return 404.
- **Concurrency:** bookings take a pessimistic lock on the car row (`SELECT ... FOR UPDATE`) under `READ COMMITTED` isolation, so two simultaneous requests can't book the same car on the same day. Status changes lock the booking row, so customer and admin actions on the same booking never overwrite each other.
- **Events:** creating an offer publishes an application event. A listener sends the notifications on a background thread, and only after the transaction commits (`@TransactionalEventListener` + `@Async`), so the admin's request never waits for email delivery. Email goes through an `EmailSender` interface, so the delivery channel can change without touching business code.
- **Query efficiency:** list endpoints load related data with `@EntityGraph`, so each list is fetched in a single query instead of one query per row.
- **Errors:** every error is an RFC 9457 `ProblemDetail` (`application/problem+json`), with field-level messages for validation failures.
- **Time:** an injected `Clock` set to Asia/Kolkata defines "today" for all date rules, which keeps them consistent on any server and testable.
- **Configuration:** all secrets and connection settings come from environment variables; none are stored in the repository.
- **Schema:** versioned Flyway SQL migrations create and change the tables. Hibernate only validates the entity mappings against them at startup, so every schema change is an explicit, reviewable file.

## Domain model

| Entity | Description |
|---|---|
| Customer | Name, unique email, mobile, password hash, customer type (regular or repeat) |
| Admin | Garage staff account |
| Car | Make, model, colour, unique licence plate; belongs to a customer |
| GarageService | Catalogue entry with name, description, price and active flag |
| Appointment | A booking: customer, car, date, status, applied discount and final total |
| AppointmentItem | One booked service with its price at booking time |
| Discount | Percentage offer for a customer type, valid until a date, covering selected services |
| FaceliftKit | Body or styling kit for a car make and model, with an ordered list of photos |

Money is stored as `DECIMAL(10,2)` and handled as `BigDecimal`. Every table records `created_at` and `updated_at` automatically.

## Tech stack

| Area | Technology |
|---|---|
| Language and framework | Java 17, Spring Boot 4.2 (Spring Web MVC) |
| Data | Spring Data JPA, Hibernate 7, MySQL, Flyway |
| Security | Spring Security, OAuth2 Resource Server (JWT), BCrypt |
| Validation and errors | Jakarta Bean Validation, ProblemDetail (RFC 9457) |
| Testing | JUnit 5, Mockito, AssertJ, MockMvc, Spring Security Test |
| Build and CI | Maven (wrapper), GitHub Actions with a MySQL service container |
| Frontend (in development) | React, Vite |

## API overview

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/customers/register`, `POST /api/auth/customers/login`, `POST /api/auth/admin/login` | Public |
| Services | `GET /api/services` | Public |
| | `GET, POST /api/admin/services`, `PUT /api/admin/services/{id}`, `PATCH /api/admin/services/{id}/active?value=` | Admin |
| Facelift kits | `GET /api/facelift-kits?make=&model=` | Public |
| | `GET /api/customers/me/cars/{carId}/facelift-kits` | Customer |
| | `GET, POST /api/admin/facelift-kits`, `PUT /api/admin/facelift-kits/{id}`, `PATCH /api/admin/facelift-kits/{id}/active?value=` | Admin |
| Profile | `GET, PUT /api/customers/me`, `POST /api/customers/me/password` | Customer |
| Cars | `GET, POST /api/customers/me/cars`, `PUT, DELETE /api/customers/me/cars/{id}` | Customer |
| Bookings | `GET, POST /api/customers/me/appointments`, `GET /api/customers/me/appointments/{id}` | Customer |
| | `POST /api/customers/me/appointments/{id}/reschedule`, `POST /api/customers/me/appointments/{id}/cancel` | Customer |
| | `GET /api/admin/appointments?status=`, `GET /api/admin/appointments/{id}` | Admin |
| | `POST /api/admin/appointments/{id}/accept`, `.../reject`, `.../complete` | Admin |
| Discounts | `GET /api/customers/me/discounts` | Customer |
| | `GET, POST /api/admin/discounts`, `PUT /api/admin/discounts/{id}`, `PATCH /api/admin/discounts/{id}/active?value=` | Admin |

Authenticated requests send the token as `Authorization: Bearer <token>`. Example validation error:

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Some fields are invalid",
  "errors": {
    "make": "Make is required",
    "licensePlate": "License plate must look like MH12AB1234"
  }
}
```

## Getting started

**Prerequisites:** Java 17 and MySQL 8 or newer.

**1. Create the database and an application user** (as the MySQL root user):

```sql
CREATE DATABASE cargarage_db;
CREATE USER 'cargarage_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON cargarage_db.* TO 'cargarage_app'@'localhost';
```

**2. Set the environment variables:**

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_PASSWORD` | Yes | | Password of the database user |
| `JWT_SECRET` | Yes | | Base64 of at least 32 random bytes, used to sign tokens |
| `DB_URL` | No | `jdbc:mysql://localhost:3306/cargarage_db` | JDBC URL |
| `DB_USERNAME` | No | `cargarage_app` | Database user |
| `JWT_EXPIRY_MINUTES` | No | `60` | Token lifetime |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | No | | Creates the first admin account on start-up if none exists |

Generate a `JWT_SECRET` with either of these:

```bash
openssl rand -base64 32
```

```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

**3. Start the API:**

```bash
cd backend
./mvnw spring-boot:run        # on Windows: .\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080`. On first start, Flyway creates the tables from the SQL migrations in `src/main/resources/db/migration`.

## Testing

```bash
cd backend
./mvnw test
```

| Level | What it covers |
|---|---|
| Unit tests (JUnit 5, Mockito) | Discount calculation and best-offer selection; the booking state machine and date rules, using a fixed `Clock` |
| Web layer tests (`@WebMvcTest`) | Requests through the real security configuration: 401 without a token, 403 for the wrong role, customer id taken from the token, 400 with field errors, 404 for another customer's car |
| Application test | The full application context starting against MySQL, including the Flyway migrations and Hibernate's schema validation |

The application test needs `DB_PASSWORD` and `JWT_SECRET`. GitHub Actions runs the whole suite on every push against a temporary MySQL 8.4 container.

## Project structure

```
cargarage/
├── backend/                     Spring Boot REST API
│   └── src/main/java/com/cargarage/backend/
│       ├── config/              security, async, clock, first-admin setup
│       ├── controller/          REST endpoints (public, customer, admin)
│       ├── dto/                 request and response records
│       ├── entity/              JPA entities and enums
│       ├── event/               application events
│       ├── exception/           exceptions and the global ProblemDetail handler
│       ├── notification/        email sending and event listeners
│       ├── repository/          Spring Data repositories
│       ├── security/            JWT tokens, roles, @CurrentUserId
│       └── service/             business logic
├── frontend/                    React web app (in development)
└── .github/workflows/           continuous integration
```

## Roadmap

- React web frontend
- Email delivery through an SMTP provider (the notification flow is in place; messages are currently written to the application log)
- Cloud deployment

## Author

**Saurabh Dixit**: [GitHub](https://github.com/saurabhdixit03) · [LinkedIn](https://www.linkedin.com/in/saurabhdixit03)
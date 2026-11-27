# CarGarage – Automotive Service Platform

[![Backend CI](https://github.com/saurabhdixit03/cargarage/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/saurabhdixit03/cargarage/actions/workflows/backend-ci.yml)

A REST API for a car care and detailing garage. Customers register their cars, book one or more services for a date, and get the best available offer applied automatically. The garage admin manages the service catalogue, accepts and completes bookings, runs discount campaigns and showcases facelift kits for specific car models.

**Status:** the backend is feature-complete, tested and checked by CI on every push. A React frontend is in progress.

## Features

**Customers**
- Register and log in (JWT)
- Manage their profile, password and cars (licence plates are normalised and unique)
- Book several services for one car on one date, then reschedule or cancel while the booking is still open
- See their booking history with the prices and discount that applied at booking time
- See the offers meant for them, and the facelift kits that fit each of their cars

**Admin**
- Manage the service catalogue (soft delete)
- Review bookings by status and move them through their life cycle: accept, reject, complete
- Create discount campaigns for regular or repeat customers on selected services; each target customer gets an email notification (written to the log for now, see the roadmap)
- Manage facelift kits with ordered photo links

**Public**
- Browse active services and facelift kits (filter kits by car make and model)

## Engineering highlights

- **Stateless JWT security** with Spring Security's OAuth2 Resource Server (HS256), role-based URL rules and JSON 401/403 responses.
- **No IDOR:** the customer id always comes from the verified token (a `@CurrentUserId` meta-annotation), never from the URL or body. Another customer's car or booking returns 404, exactly like a missing one.
- **No double bookings:** a pessimistic row lock on the car (`SELECT ... FOR UPDATE`) with `READ COMMITTED` isolation serialises concurrent bookings for the same car and day.
- **Booking state machine:** `PENDING → ACCEPTED → COMPLETED`, `PENDING → REJECTED`, `PENDING/ACCEPTED → CANCELLED`, with row locks so customer and admin actions can't overwrite each other.
- **Snapshots:** each booked item stores its price, and each booking stores its final total, so later price or offer changes never alter past bookings.
- **Best-offer selection:** every eligible offer is evaluated and the one that saves the customer the most money wins (`BigDecimal`, rounded half up).
- **Repeat customers:** a customer becomes REPEAT only after a completed visit, so booking and cancelling can't earn loyalty offers.
- **Async, after-commit notifications:** discount emails are sent through `@TransactionalEventListener(AFTER_COMMIT)` and `@Async`, behind an `EmailSender` interface, so a slow mail server never slows or breaks the admin's request.
- **N+1 queries removed** with `@EntityGraph` (the booking list went from 7 queries to 1).
- **Consistent errors:** RFC 9457 `ProblemDetail` responses, with field-level messages for validation errors.
- **Testable time:** an injected `Clock` (Asia/Kolkata) instead of `LocalDate.now()`.

## Tech stack

| Area | Technology |
|---|---|
| Language and framework | Java 17, Spring Boot 4.2 (Spring Web MVC) |
| Data | Spring Data JPA, Hibernate 7, MySQL |
| Security | Spring Security, OAuth2 Resource Server (JWT), BCrypt |
| Validation and errors | Jakarta Bean Validation, ProblemDetail (RFC 9457) |
| Testing | JUnit 5, Mockito, AssertJ, MockMvc, Spring Security Test |
| Build and CI | Maven (wrapper), GitHub Actions with a MySQL service container |
| Frontend (in progress) | React, Vite |

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

Errors use `application/problem+json`. A validation error looks like this:

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
├── frontend/                    React app (in progress)
└── .github/workflows/           CI
```

## Running locally

**Prerequisites:** Java 17 and MySQL 8 or newer.

**1. Create the database and an application user** (as the MySQL root user):

```sql
CREATE DATABASE cargarage_db;
CREATE USER 'cargarage_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON cargarage_db.* TO 'cargarage_app'@'localhost';
```

**2. Set the environment variables.** Configuration comes only from environment variables; no secrets are stored in the repository.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_PASSWORD` | Yes | | Password of the database user |
| `JWT_SECRET` | Yes | | Base64 of at least 32 random bytes, used to sign tokens |
| `DB_URL` | No | `jdbc:mysql://localhost:3306/cargarage_db` | JDBC URL |
| `DB_USERNAME` | No | `cargarage_app` | Database user |
| `JWT_EXPIRY_MINUTES` | No | `60` | Token lifetime |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | No | | Creates the first admin on start-up, only if no admin exists yet |

To generate a `JWT_SECRET`:

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

The API runs on `http://localhost:8080`. Hibernate creates the tables on first start (`ddl-auto=update`, intended for local development).

## Running the tests

```bash
cd backend
./mvnw test
```

There are 19 tests at three levels:

| Level | What it covers |
|---|---|
| Unit tests (JUnit 5, Mockito) | Discount calculation and best-offer choice, the booking state machine and date rules with a fixed `Clock` |
| Web slice tests (`@WebMvcTest`) | Requests through the real security rules: 401 without a token, 403 for the wrong role, the customer id taken from the token, 400 with field errors, 404 for another customer's car |
| Full context | The whole application starts against a real MySQL |

The full-context test needs the database variables (`DB_PASSWORD`, `JWT_SECRET`). GitHub Actions runs all tests on every push against a temporary MySQL 8.4 container.

## Roadmap

- React frontend (Vite)
- Real email delivery behind the existing `EmailSender` interface
- Deployment, with production-grade schema management

## Author

**Saurabh Dixit**: [GitHub](https://github.com/saurabhdixit03) · [LinkedIn](https://www.linkedin.com/in/saurabhdixit03)
-- Version 1 of the CarGarage schema: every table the application uses.
--
-- Flyway runs each file in this folder once, in version order, and records it in the
-- flyway_schema_history table. Once a file has run on a database, never edit it: make
-- every later change in a new file (V2__..., V3__...).
--
-- Each table names its collation, utf8mb4_0900_ai_ci (MySQL 8's default), so text compares
-- the same way on every MySQL-compatible server: 'Ceramic Coating' and 'ceramic coating'
-- count as the same service name everywhere, whatever the server's own default is.

CREATE TABLE admins (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_admins_email UNIQUE (email)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE customers (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    mobile        VARCHAR(15)  NOT NULL,
    password      VARCHAR(100) NOT NULL,
    customer_type VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_customers_email UNIQUE (email),
    CONSTRAINT chk_customers_customer_type CHECK (customer_type IN ('REGULAR', 'REPEAT'))
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE cars (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    make          VARCHAR(50) NOT NULL,
    model         VARCHAR(50) NOT NULL,
    color         VARCHAR(30) NOT NULL,
    license_plate VARCHAR(15) NOT NULL,
    customer_id   BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cars_license_plate UNIQUE (license_plate),
    CONSTRAINT fk_cars_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE garage_services (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL,
    name        VARCHAR(100)  NOT NULL,
    description VARCHAR(500)  NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    active      BIT           NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_garage_services_name UNIQUE (name)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE discounts (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    description          VARCHAR(500) NOT NULL,
    percentage           DECIMAL(5,2) NOT NULL,
    valid_until          DATE         NOT NULL,
    target_customer_type VARCHAR(20)  NOT NULL,
    active               BIT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_discounts_target_customer_type CHECK (target_customer_type IN ('REGULAR', 'REPEAT'))
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Which services each discount covers (many discounts <-> many services)
CREATE TABLE discount_services (
    discount_id BIGINT NOT NULL,
    service_id  BIGINT NOT NULL,
    PRIMARY KEY (discount_id, service_id),
    CONSTRAINT fk_discount_services_discount FOREIGN KEY (discount_id) REFERENCES discounts (id),
    CONSTRAINT fk_discount_services_service FOREIGN KEY (service_id) REFERENCES garage_services (id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE appointments (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    created_at       DATETIME(6)   NOT NULL,
    updated_at       DATETIME(6)   NOT NULL,
    customer_id      BIGINT        NOT NULL,
    car_id           BIGINT        NOT NULL,
    appointment_date DATE          NOT NULL,
    status           VARCHAR(20)   NOT NULL,
    discount_id      BIGINT        NULL,
    total_amount     DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    -- The double-booking check: "does this car already have a booking on this date?"
    INDEX idx_appointments_car_date (car_id, appointment_date),
    -- The staff lists: "all pending bookings, sorted by date"
    INDEX idx_appointments_status_date (status, appointment_date),
    CONSTRAINT chk_appointments_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_appointments_car FOREIGN KEY (car_id) REFERENCES cars (id),
    CONSTRAINT fk_appointments_discount FOREIGN KEY (discount_id) REFERENCES discounts (id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- One booked service per row, with its price at booking time
CREATE TABLE appointment_items (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    created_at     DATETIME(6)   NOT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    appointment_id BIGINT        NOT NULL,
    service_id     BIGINT        NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_appointment_items_appointment_service UNIQUE (appointment_id, service_id),
    CONSTRAINT fk_appointment_items_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT fk_appointment_items_service FOREIGN KEY (service_id) REFERENCES garage_services (id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE facelift_kits (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL,
    kit_name    VARCHAR(100)  NOT NULL,
    car_make    VARCHAR(50)   NOT NULL,
    car_model   VARCHAR(50)   NOT NULL,
    description VARCHAR(500)  NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    active      BIT           NOT NULL,
    PRIMARY KEY (id),
    -- "Which kits fit a Hyundai Creta?"
    INDEX idx_facelift_kits_make_model (car_make, car_model)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- A kit's photo links, in order (position 0 is the main photo)
CREATE TABLE facelift_kit_images (
    kit_id    BIGINT       NOT NULL,
    position  INT          NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    PRIMARY KEY (kit_id, position),
    CONSTRAINT fk_facelift_kit_images_kit FOREIGN KEY (kit_id) REFERENCES facelift_kits (id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
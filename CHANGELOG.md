# Changelog

All notable changes to HomeCanvas project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- WebSocket support for real-time sensor updates
- Advanced rule engine with time-based triggers
- Mobile app integration
- Cloud deployment guides
- Comprehensive test suite

---

## Development Timeline

### Phase 1: Backend User Authentication (June - July 2025)

#### [0.1.0] - 2025-06-07
**Initial Backend Scaffold**
- Project structure setup
- Spring Boot 3.x configuration
- H2 database integration
- User entity model with JPA annotations

#### [0.1.1] - 2025-06-09
- User repository with Spring Data JPA

#### [0.1.2] - 2025-06-14
- Auth controller with JWT endpoints

#### [0.1.3] - 2025-06-16
- User service layer implementation

#### [0.1.4] - 2025-06-21
- Password hashing and security config

#### [0.1.5] - 2025-06-23
- Registration endpoint with validation

#### [0.1.6] - 2025-06-28
- Login endpoint with JWT token generation

#### [0.1.7] - 2025-06-30
- CORS configuration for frontend

#### [0.1.8] - 2025-07-05
- JWT validation middleware

#### [0.1.9] - 2025-07-07
- Exception handling for auth endpoints

#### [0.2.0] - 2025-07-12
- Role-based access control (RBAC) setup

### Phase 2: Frontend User Interface (July - August 2025)

#### [0.3.0] - 2025-07-14
**React + Vite Setup**
- Vite project initialization
- React 18 with TypeScript configuration

#### [0.3.1] - 2025-07-19
- LoginForm component

#### [0.3.2] - 2025-07-21
- RegisterForm component

#### [0.3.3] - 2025-07-26
- Tailwind CSS integration and styling

#### [0.3.4] - 2025-07-28
- API service layer with axios

#### [0.3.5] - 2025-08-02
- Authentication context provider

#### [0.3.6] - 2025-08-04
- Protected route wrapper component

#### [0.3.7] - 2025-08-09
- Dashboard layout component

#### [0.3.8] - 2025-08-11
- Navigation header with logout

#### [0.3.9] - 2025-08-16
- Error handling and toast notifications

#### [0.4.0] - 2025-08-18
- Responsive design for mobile

### [Gap Period: August 2025 - April 2026]
*Initial user authentication phases complete. Focus shifts to IoT integration and advanced features.*

### Phase 3: IoT Device Management & Sensors (April 2026)

#### [1.0.0] - 2026-04-05
**IoT Core Implementation**
- Device entity model
- SensorEvent entity for telemetry
- Rule and RuleCondition entities
- ActionLog entity for audit trail
- Device repository with custom queries
- SensorEvent repository for time-series data
- Rule repository for automation rules
- RuleCondition repository
- ActionLog repository for history
- Telemetry REST API endpoint
- Device registration and status tracking
- Sensor data ingestion from ESP32

---

## Version Details

### [0.1.0] - Initial Backend Structure
**Date**: June 7, 2025

User authentication infrastructure established:
- Maven-based Spring Boot 3.x setup
- H2 in-memory database for development
- JPA entity mapping for User table
- Base configuration and logging

### [0.4.0] - Frontend Complete
**Date**: August 18, 2025

Full user-facing authentication UI:
- React with TypeScript and Vite
- Tailwind CSS styling system
- Login/Register workflows
- Protected routing
- Error handling

### [1.0.0] - IoT Integration
**Date**: April 5, 2026

Complete IoT subsystem:
- Multi-entity relational model
- Time-series data handling (SensorEvent)
- Rule engine data structures
- ESP32 integration via REST API
- Comprehensive audit logging

---

## Migration Guide

### From 0.4.0 to 1.0.0
- No breaking changes to existing auth endpoints
- New IoT endpoints available
- Database schema expands with new tables (devices, sensor_events, rules, etc.)
- Run `mvn migrate` or `mvn spring-boot:run` for automatic schema creation

---

## Known Issues

- [ ] WebSocket implementation pending
- [ ] Real-time sensor updates not yet implemented
- [ ] PostgreSQL migration guide not yet written
- [ ] Docker deployment documentation pending

---

## Future Roadmap

### V1.1 - Enhanced Rules Engine
- Time-based triggers
- Complex boolean logic
- Action chaining

### V1.2 - Real-time Features
- WebSocket for live sensor updates
- Push notifications
- Live dashboard

### V1.3 - Cloud Integration
- AWS/Azure deployment guides
- Remote access
- Cloud backup

### V2.0 - Mobile App
- Native iOS app
- Native Android app
- Offline functionality

---

## Contributing

See [Contributing Guidelines](./CONTRIBUTING.md) for details on code style, testing, and commit conventions.

---

**Repository**: [HomeCanvas GitHub](https://github.com/yourusername/homecanvas)

**Maintainer**: Your Name

**Last Updated**: April 5, 2026

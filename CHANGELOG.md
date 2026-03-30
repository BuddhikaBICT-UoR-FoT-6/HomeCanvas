# Changelog

All notable changes to HomeCanvas project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-30

### MVP Release: Complete IoT Smart Home Management Platform

#### Added - Backend
- **IoT Telemetry Ingestion API** (`POST /api/iot/telemetry`)
  - Receives sensor readings (light level, noise level, motion) from ESP32 devices
  - Auto-registers unregistered devices by MAC address
  - Stores telemetry in time-series database (SensorEvent)
  - Implements 3 automation rules engine
  
- **Automation Rules (Production Ready)**:
  - **Rule 1**: Motion detected → FAN_ON (activate relay)
  - **Rule 2**: Noise level > 700dB → ALERT (security notification)
  - **Rule 3**: Light level < 300 lux → LED_ON (activate light)
  
- **Device Management APIs** (Read-only, Paginated):
  - `GET /api/devices` - List all user-owned devices with online status
  - `GET /api/devices/{id}` - Device details + last telemetry reading
  - `GET /api/devices/{id}/telemetry?page=0&size=20` - Paginated sensor history (20 records/page)
  - `GET /api/devices/{id}/actions?page=0&size=20` - Paginated action audit trail
  
- **Authentication & Security**:
  - JWT token-based authorization (extracted from SecurityContextHolder)
  - Owner-based access control (users can only access their own devices)
  - User service layer with password hashing
  - Authentication controller with login/registration endpoints
  
- **Core Database Entities**:
  - **User**: User accounts (id, username, password_hash, role, timestamps)
  - **Device**: Smart home nodes (id, macAddress unique, owner FK, lastSeen, status)
  - **SensorEvent**: Time-series telemetry (id, device FK, timestamp, light/noise/motion readings)
  - **ActionLog**: Audit trail (id, device FK, actionType, triggeredAt timestamp)
  - Optimized with LAZY loading + proper cascading

#### Added - Frontend
- **Device Dashboard** (`/devices` route)
  - Responsive grid layout of all user devices
  - Real-time online status indicator (ONLINE if lastSeen < 5 minutes, else OFFLINE)
  - Click-to-navigate device cards
  - Total device count display
  
- **Device Detail View** (`/devices/:id` route)
  - 3-tab tabbed interface:
    - **Overview**: Device metadata, MAC address, last telemetry snapshot, status
    - **Telemetry**: Historical sensor data table with pagination
    - **Actions**: Automation rule trigger audit trail (paginated)
  - Axios HTTP client with JWT localStorage token
  - Error handling with user-friendly messages
  
- **Authentication UI**:
  - Login page (username/password → JWT token → localStorage → dashboard redirect)
  - Registration page (new user creation)
  - Protected route HOC preventing unauthorized access
  
- **UI/UX Components**:
  - Tailwind CSS styling
  - TypeScript strict mode
  - Responsive design (mobile/tablet/desktop)
  - Loading states and error boundaries
  - Pagination controls (next/previous buttons)

#### Technical Stack
| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2, Java 17 |
| Frontend | React 18, TypeScript, Vite |
| Database | H2 (dev), PostgreSQL (prod) |
| ORM | Spring Data JPA + Hibernate |
| Authentication | JWT + SecurityContextHolder |
| HTTP Client | Axios |
| Utilities | Lombok (@Data, @Repository, @Service) |
| Building | Maven (backend), npm/Vite (frontend) |

#### Architecture Decisions
- **Layered Architecture**: Controller → Service → Repository → Database
- **LAZY Entity Loading**: Prevents memory bloat in Many-to-One relationships
- **Nullable Device Owner**: Supports auto-registered devices until user adoption
- **Pagination for Time-Series**: Efficient querying of large sensor datasets
- **DTO Layer**: Type-safe request/response transformation
- **Atomic Git History**: 30 commits from 2026-03-21 to 2026-03-30

#### Known Limitations & Deferred Features
- Authentication currently uses mock user in test mode; JWT extraction verified and ready
- Device operations read-only (update/delete deferred to v0.2.0)
- No real-time WebSocket streaming (deferred to v0.2.0)
- Automation rules are fixed 3-rule set (custom rule builder deferred to v0.2.0)
- No email/SMS notifications (deferred to v0.2.0)
- Frontend charts/analytics not included (deferred to v0.3.0)

#### Tested & Verified
- ✅ Postman API validation: All 4 device endpoints return correct data structures
- ✅ Rule engine: All 3 automation rules fire correctly on test data
- ✅ Build: `mvn clean compile` passes, JAR packaged successfully
- ✅ Frontend: React app compiles, connects to backend, displays devices
- ✅ Database: Hibernate schema generation creates all tables automatically
- ✅ Git: Atomic commits with proper author/date metadata

---

## [Unreleased]

### v0.2.0 - Advanced Device Management & Notifications (Q2 2026)
- [ ] Device update/delete endpoints (PUT/DELETE)
- [ ] Custom automation rule builder UI
- [ ] Email/SMS alert notifications
- [ ] Real-time WebSocket telemetry streaming
- [ ] Device event webhooks
- [ ] Action scheduling (time-based rules)

### v0.3.0 - Data Visualization & Analytics (Q3 2026)
- [ ] Historical data charts (Chart.js/Recharts)
- [ ] Sensor data trends and reports
- [ ] Mobile app (React Native)
- [ ] Device statistics dashboard
- [ ] Data export (CSV/JSON)

### v0.4.0 - Cloud & Scale (Q4 2026)
- [ ] Azure deployment setup
- [ ] Multi-user household support
- [ ] Device firmware OTA updates
- [ ] Scalable cloud database (PostgreSQL)

### v1.0.0 - Enterprise Release (2027)
- [ ] Production SLA
- [ ] Full test coverage (unit + integration)
- [ ] Advanced analytics (ML anomaly detection)
- [ ] Integration marketplace (Alexa, Google Home, IFTTT)
- [ ] Monitoring & observability (logs, metrics)

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

**Maintainer**: A.B.D. Anandakumara

**Last Updated**: April 5, 2026

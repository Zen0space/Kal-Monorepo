# Changelog

All notable changes to Kal will be documented in this file.

---

## [1.0.1] - 2026-04-06

### Fixed

- Rate limit usage stats now only count successful requests — previously, rate-limited (429) responses were still counted against your usage, which made your dashboard stats appear higher than actual usage
- Improved error tracking in request logs with clearer error messages for failed requests

---

## [1.0.0] - 2026-03-17

### Added

- API v1 with versioned endpoints (`/api/v1/*`)
- Food database with comprehensive nutritional data
- API key management dashboard
- Request logging and analytics
- Setup wizard with code examples
- Feedback and bug reporting system
- Collapsible sidebar with mobile-responsive drawer

### Changed

- Migrated all API endpoints to versioned paths
- Improved dashboard performance and loading states

---

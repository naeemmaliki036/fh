# Real Estate Multi-Tenant Platform  
## Product Requirements Document (PRD)

---

## 1. Product Overview

Build a **multi-tenant SaaS real estate operations platform** where real estate companies can:

- manage properties and listings
- manage agents and compliance data
- handle leads and deals end-to-end
- collect customer documents securely via links
- manage commissions and reporting
- integrate with listing portals
- support future payment collection workflows

The system starts with **UAE market support** but must be **globally extensible**.

---

## 2. Core Goals

### Primary Goals
- Multi-tenant SaaS platform
- End-to-end lifecycle: listing → lead → deal → commission
- Secure customer document collection
- Optimized media delivery at scale
- Foundation for integrations (portals, payments)

### Secondary Goals
- Subscription billing
- Agent-based pricing
- Workflow automation (future)
- AI-readiness (future)

---

## 3. Tech Stack

### Frontend
- Next.js (React)

### Backend
- Python (FastAPI)
- Async-first architecture

### Database
- PostgreSQL

### Cache / Queue
- Redis

### Workers
- Celery / Dramatiq

---

## 4. Storage Architecture

### Public Media (High Traffic)
- Cloudflare R2 (storage)
- Cloudflare CDN (delivery)

Used for:
- property images
- listing videos
- thumbnails

### Private Documents (Sensitive)
- AWS S3
- Access via signed URLs only

Used for:
- passports
- agent IDs (RERA etc.)
- customer KYC docs
- contracts

---

## 5. Multi-Tenant Model

### Tenant Lifecycle
1. Company signup
2. Status = pending
3. Admin approval
4. Status = active

### Tenant Isolation
- All data scoped by `tenant_id`
- Strict RBAC
- No cross-tenant access

---

## 6. User Roles

### Platform Roles
- Super Admin
- Operations Admin
- Finance Admin

### Tenant Roles
- Company Owner
- Company Admin
- Property Admin
- Listing Manager
- Agent
- Finance User

---

## 7. Agent Management

### Fields
- name
- photo
- contact info
- license/RERA ID
- expiry
- status

### Commission
- default commission at agent level
- copied to deal
- can be overridden at deal level
- audit required

---

## 8. Property & Listings

### Core Rule
Property ≠ Listing

- Property = inventory
- Listing = market representation

### Features
- property details
- pricing
- location
- amenities
- assigned agents
- media gallery
- listing states

---

## 9. Media Requirements

### Public Media Flow
- upload → R2
- optimize → multiple sizes
- deliver via CDN

### Requirements
- WebP/AVIF support
- thumbnails
- CDN caching
- high performance

---

## 10. Private Document Handling

### Requirements
- stored in S3
- accessed via signed URLs
- permission-checked
- audit logged

---

## 11. Lead Management

### Sources
- portals
- website
- manual entry
- imports

### Features
- assignment
- tracking
- pipeline stages
- notes and activities

### Stages
- new
- contacted
- qualified
- viewing
- offer
- won/lost

---

## 12. Customer Document Collection (CRITICAL)

### Flow
1. Agent creates document request
2. System generates unique link
3. Customer opens link
4. Enters verification code
5. Uploads documents

### Requirements
- unique token per request
- OTP/verification code
- expiry support
- document checklist
- upload status tracking
- secure storage in S3
- audit logs

---

## 13. Deal Management

### Types
- sale
- rental

### Features
- linked lead
- property
- agent
- customer
- documents
- commission
- payment tracking (future)

---

## 14. Commission System

### Logic
- agent default commission
- copied to deal
- override allowed by admin

### Requirements
- percentage or fixed
- audit log for override
- payout tracking

---

## 15. Payment Links (Future)

### Use Cases
- booking deposit
- reservation fee

### Requirements
- unique payment link
- amount + purpose
- status tracking
- linked to deal

### States
- draft
- sent
- paid
- expired

---

## 16. Billing

### Model
- subscription per company
- X agents included
- additional agents billed

### Requirements
- plans
- invoices
- usage tracking

---

## 17. Reporting

- inventory reports
- lead conversion
- agent performance
- commissions
- billing

---

## 18. Backend Architecture (FastAPI)

### Structure
- modular monolith

### Modules
- auth
- tenants
- users
- agents
- properties
- media
- documents
- leads
- deals
- commissions
- payments
- billing

---

## 19. Key Entities

- Tenant
- User
- Agent
- Property
- Listing
- Media
- PrivateDocument
- Lead
- Deal
- Commission
- DocumentRequest
- PaymentLink
- Subscription
- Invoice
- AuditLog

---

## 20. Security

- RBAC
- tenant isolation
- signed URLs
- encryption at rest
- audit logs
- secure OTP flows

---

## 21. Implementation Phases

### Phase 1
- tenants
- users
- agents
- properties
- media
- leads
- document collection
- deals
- commission

### Phase 2
- portal integrations
- payment links
- advanced reporting

### Phase 3
- KYC integrations
- automation
- mobile apps

---

## 22. Key Rules for Implementation

1. Property and listing must be separate  
2. Use R2 + CDN for public media  
3. Use S3 + signed URLs for private docs  
4. Document collection via secure links + OTP  
5. Commission = agent default → deal → override  
6. Strict tenant isolation  
7. Pluggable integrations  
8. Audit all critical actions  

---

## 23. Final Summary

A multi-tenant SaaS platform for real estate companies to manage listings, leads, deals, documents, commissions, and billing. Public media is optimized using **Cloudflare R2 + CDN**, while sensitive documents are secured using **S3 signed URLs**. The system supports secure customer interactions, scalable media delivery, and future integrations for portals and payments.

---
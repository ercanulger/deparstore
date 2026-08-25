# Security Specification

## 1. Data Invariants
- Products can be read by any user (authenticated or guest/public).
- Products can only be created, modified, or deleted by authenticated Administrators (or seeded during initial store bootstrap).
- Orders can be created by authenticated customers or guests during checkout.
- Orders can be viewed by the user who created them (`resource.data.userId == request.auth.uid`) or by an Administrator.
- Order fulfillment status can only be updated by an Administrator.
- User profile documents can only be modified by the respective owner or an Administrator.

## 2. Payloads Analysis
- Attack 1: Non-admin trying to update product price to 0 -> Denied.
- Attack 2: Non-admin trying to alter order status -> Denied.
- Attack 3: Customer trying to read other customers' private orders -> Denied.

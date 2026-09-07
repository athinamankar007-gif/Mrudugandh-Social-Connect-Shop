---
name: Schema-backed route test doubles
description: Durable guidance for testing API routes that validate database-shaped responses.
---

When mocking a database for route integration tests, reproduce the database's nullable fields and column defaults before returning records to the route.

**Why:** Response schemas validate the full persisted shape, so an incomplete test double can fail with misleading validation errors unrelated to the behavior under test.

**How to apply:** For seed and mutation paths, supply defaults such as nullable image fields, empty arrays, numeric defaults, availability flags, and timestamps in the mock persistence layer.
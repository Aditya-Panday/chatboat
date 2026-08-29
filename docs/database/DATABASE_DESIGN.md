# Covers&All Live Chat — Database Design

Production PostgreSQL schema for customer-support live chat with AI, agent assignment, RBAC, and full audit trails.

**Source of truth:** `prisma/schema.prisma`

---

## Architecture overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   users     │────▶│  user_roles  │◀────│     roles       │
│ CUSTOMER/   │     └──────────────┘     └────────┬────────┘
│ STAFF       │                                   │
└──────┬──────┘                          ┌────────▼────────┐
       │                                 │ role_permissions│
       │                                 └────────┬────────┘
       │                                          │
       ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│agent_profiles│                          │ permissions  │
└──────┬───────┘                          └──────────────┘
       │
       ▼
┌──────────────────┐
│chat_sessions     │◀──────────────────────────────────────┐
│ (session token   │                                       │
│  hash in DB)     │                                       │
└────────┬─────────┘                                       │
         │                                                  │
    ┌────┴────┬──────────────┬─────────────┬──────────────┤
    ▼         ▼              ▼             ▼              ▼
chat_messages chat_assignments chat_reviews chat_session_events ai_runs
```

---

## Session lifecycle

```
Customer opens widget
        │
        ▼
  Create chat_sessions row
  Generate random session token
  Store SHA-256 hash in session_token_hash
  Set HttpOnly cookie with raw token
  Status: AI
        │
        ▼
  Customer clicks "Chat with Agent"
  Status: WAITING_FOR_AGENT
        │
        ▼
  Auto-assign (SELECT FOR UPDATE on agent_profiles)
  Status: ASSIGNED → ACTIVE
        │
        ▼
  Close (customer or agent)
  Status: CLOSED (never reused)
        │
        ▼
  New chat → new chat_sessions row
```

### Session recovery after page refresh

1. Browser sends HttpOnly cookie containing raw session token.
2. Server hashes token → lookup `chat_sessions.session_token_hash`.
3. If session status ≠ `CLOSED`, return session + messages from `chat_messages`.
4. Messages are **never** stored in the cookie.

---

## Tables (14)

| Table | Purpose |
|-------|---------|
| `users` | Customers and staff (admins, agents) |
| `roles` | ADMIN, SUPERVISOR, AGENT |
| `permissions` | Granular capability strings |
| `user_roles` | User ↔ Role (M:N) |
| `role_permissions` | Role ↔ Permission (M:N) |
| `agent_profiles` | Agent stats, status, concurrency limits |
| `agent_status_history` | Immutable agent availability log |
| `chat_sessions` | Conversation lifecycle |
| `chat_messages` | All messages (customer, agent, AI, system) |
| `chat_assignments` | Full assignment history (A → B → C) |
| `chat_reviews` | Post-session ratings (1–5) |
| `chat_session_events` | Session-level event log |
| `ai_runs` | AI provider/token/latency tracking |
| `audit_logs` | Admin/security audit trail |

---

## Enums (11)

| Enum | Values |
|------|--------|
| `UserType` | CUSTOMER, STAFF |
| `ChatSessionStatus` | AI, WAITING_FOR_AGENT, ASSIGNED, ACTIVE, CLOSED |
| `ChatSessionSource` | WEB, MOBILE, API |
| `SenderType` | CUSTOMER, AGENT, AI, SYSTEM |
| `MessageType` | TEXT, IMAGE, FILE, SYSTEM_EVENT |
| `AgentStatus` | ONLINE, BREAK, UNAVAILABLE, OFFLINE |
| `AssignmentType` | ADMIN, AUTO, REASSIGN |
| `ActorType` | CUSTOMER, AGENT, ADMIN, SYSTEM, AI |
| `SessionEventType` | SESSION_CREATED, AGENT_REQUESTED, … |
| `AiRunStatus` | SUCCESS, FAILED |

---

## Key indexes

| Table | Index | Query pattern |
|-------|-------|---------------|
| `chat_sessions` | `status` | Active queue listing |
| `chat_sessions` | `(current_agent_id, status)` | Agent's active chats |
| `chat_sessions` | `(customer_id, created_at DESC)` | Customer history |
| `chat_sessions` | `last_message_at DESC` | Inbox sorting |
| `chat_sessions` | `session_token_hash` UNIQUE | Cookie session lookup |
| `chat_messages` | `(session_id, created_at)` | Transcript retrieval |
| `chat_assignments` | `(agent_id, is_current)` | Current load per agent |
| `agent_profiles` | `(status, active_chat_count)` | Auto-assignment picker |
| `agent_status_history` | `(agent_id, started_at DESC)` | Status timeline |
| `chat_session_events` | `(session_id, created_at)` | Session audit |
| `chat_reviews` | `(agent_id, created_at DESC)` | Rating aggregation |

---

## Agent auto-assignment (transactional)

When status changes to `WAITING_FOR_AGENT`:

```sql
BEGIN;

-- Lock eligible agent row to prevent race conditions
SELECT ap.*
FROM agent_profiles ap
JOIN users u ON u.id = ap.user_id
WHERE u.is_active = true
  AND ap.status = 'ONLINE'
  AND ap.active_chat_count < COALESCE(ap.max_concurrent_chats, 5)
ORDER BY ap.active_chat_count ASC, ap.last_status_changed_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- Increment active_chat_count atomically
UPDATE agent_profiles SET active_chat_count = active_chat_count + 1 ...;

-- Mark previous assignment is_current = false (if reassign)
UPDATE chat_assignments SET is_current = false, unassigned_at = now() ...;

-- Insert new chat_assignments row
INSERT INTO chat_assignments ...;

-- Update chat_sessions
UPDATE chat_sessions SET status = 'ASSIGNED', current_agent_id = ..., assigned_at = now();

-- Insert chat_session_events
INSERT INTO chat_session_events (event_type = 'AGENT_ASSIGNED') ...;

COMMIT;
```

Use `SELECT FOR UPDATE SKIP LOCKED` so concurrent requests pick different agents.

---

## Denormalized agent counters

| Field | Updated when |
|-------|--------------|
| `active_chat_count` | Assign, reassign, close |
| `total_chat_count` | First assignment to agent |
| `average_rating` | New review created |
| `total_reviews` | New review created |

Reconciliation query (if counters drift):

```sql
SELECT agent_id, COUNT(*) AS true_active
FROM chat_assignments ca
JOIN chat_sessions cs ON cs.id = ca.session_id
WHERE ca.is_current = true
  AND cs.status IN ('ASSIGNED', 'ACTIVE')
GROUP BY agent_id;
```

---

## Delete behavior

| Relation | onDelete | Rationale |
|----------|----------|-----------|
| Messages → Session | `Restrict` | Never orphan or cascade-delete history |
| Session → Customer | `SetNull` | Preserve closed sessions if customer removed |
| Assignment → Session | `Restrict` | Preserve assignment audit trail |
| User → AgentProfile | `Restrict` | Prevent accidental agent deletion |

**No cascade deletes** on chat history tables.

---

## Security

| Rule | Implementation |
|------|----------------|
| Session token | Random 32+ bytes; only SHA-256 hash in DB |
| Cookie | HttpOnly, Secure (prod), SameSite=Lax |
| Password | bcrypt hash in `password_hash`; never exposed via API |
| Authorization | RBAC via roles/permissions; enforced server-side |
| Agent access | Agents see only assigned chats (`chat.view.assigned`) |
| Identity | Never trust `agent_id`/`customer_id` from frontend |

---

## Seed data

```bash
npm run db:seed
```

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Demo Admin | admin@coversandall.com | Admin@12345 | ADMIN |
| Demo Agent | agent@coversandall.com | Agent@12345 | AGENT |

---

## Commands

```bash
# Validate schema
npm run db:validate

# Create & apply migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed roles, permissions, demo users
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

---

## Visual ER diagram

Import `docs/database/schema.dbml` into [dbdiagram.io](https://dbdiagram.io) for an interactive diagram.

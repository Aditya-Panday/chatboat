import assert from "node:assert/strict";
import test from "node:test";
import { buildPaginationMeta } from "@/lib/api/response";
import { normalizeEmail } from "@/lib/api/request";
import { hashSessionToken } from "@/lib/auth/session-token";
import { filterConversations } from "@/lib/admin/chats-data";
import { loginSchema } from "@/lib/validation/auth.schema";
import { createUserSchema } from "@/lib/validation/user.schema";

test("normalizeEmail lowercases and trims", () => {
  assert.equal(normalizeEmail("  Admin@Example.COM "), "admin@example.com");
});

test("loginSchema validates email and password", () => {
  const parsed = loginSchema.parse({
    email: "admin@coversandall.com",
    password: "secret",
  });
  assert.equal(parsed.email, "admin@coversandall.com");
});

test("createUserSchema rejects weak password", () => {
  assert.throws(() =>
    createUserSchema.parse({
      name: "John Smith",
      email: "john@example.com",
      password: "weak",
      role: "AGENT",
    }),
  );
});

test("buildPaginationMeta calculates total pages", () => {
  assert.deepEqual(buildPaginationMeta(2, 20, 45), {
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
  });
});

test("hashSessionToken is deterministic", () => {
  const first = hashSessionToken("token-value");
  const second = hashSessionToken("token-value");
  assert.equal(first, second);
  assert.notEqual(first, hashSessionToken("other-token"));
});

test("filterConversations applies tab and search filters", () => {
  const all = filterConversations(
    [
      {
        id: "1",
        customer: {
          name: "Sarah Jenkins",
          initials: "SJ",
          avatarClassName: "bg-blue-500",
          status: "online",
          source: "Web",
        },
        preview: "Need help",
        time: "Now",
        unreadCount: 0,
        status: "unassigned",
        sessionStatus: "WAITING_FOR_AGENT",
        statusLabel: "Waiting",
      },
    ],
    "unassigned",
    "sarah",
  );
  assert.equal(all.length, 1);

  const none = filterConversations(all, "resolved", "sarah");
  assert.equal(none.length, 0);
});

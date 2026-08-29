import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_SESSION_STATUSES,
  CLOSE_REASON,
  isAiSessionStatus,
  isSessionWritable,
  mapStatusLabel,
  SESSION_STATUS,
} from "@/lib/chat/domain";
import { formatChatTime, customerInitials } from "@/lib/admin/format-time";

test("maps session statuses to labels", () => {
  assert.equal(mapStatusLabel("AI"), "AI");
  assert.equal(mapStatusLabel("WAITING_FOR_AGENT"), "Waiting");
  assert.equal(mapStatusLabel("CLOSED"), "Closed");
});

test("only AI status uses the LLM", () => {
  assert.equal(isAiSessionStatus("AI"), true);
  assert.equal(isAiSessionStatus("WAITING_FOR_AGENT"), false);
  assert.equal(isAiSessionStatus("ASSIGNED"), false);
  assert.equal(isAiSessionStatus("ACTIVE"), false);
  assert.equal(isAiSessionStatus("CLOSED"), false);
});

test("treats only CLOSED as not writable", () => {
  for (const status of ACTIVE_SESSION_STATUSES) {
    assert.equal(isSessionWritable(status), true);
  }
  assert.equal(isSessionWritable(SESSION_STATUS.CLOSED), false);
});

test("defines close reasons", () => {
  assert.equal(CLOSE_REASON.AI_RESOLVED, "AI_RESOLVED");
  assert.equal(CLOSE_REASON.AGENT_RESOLVED, "AGENT_RESOLVED");
});

test("builds customer initials", () => {
  assert.equal(customerInitials("John Doe"), "JD");
  assert.equal(customerInitials("Alice"), "AL");
});

test("suggestResolution triggers after helpful exchange", async () => {
  const { suggestResolution } = await import("@/lib/ai/prompt");
  assert.equal(
    suggestResolution("thank you!", "Glad I could help!", 4),
    true,
  );
  assert.equal(suggestResolution("hello", "Hi there", 0), false);
});

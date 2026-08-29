import assert from "node:assert/strict";
import test from "node:test";
import {
  canAgentSendMessage,
  canStaffAccessConversation,
  isAgentEligibleForAssignment,
  isAgentEligibleForAutoAssignment,
  isDuplicateAssignment,
  shouldAutoAssignWhenNoOnlineAdmins,
} from "@/lib/chat/rbac";
import type { AuthenticatedUser } from "@/lib/auth/types";

function staffUser(
  overrides: Pick<AuthenticatedUser, "id" | "name" | "email"> & {
    roles: AuthenticatedUser["roles"];
  },
): AuthenticatedUser {
  return {
    ...overrides,
    userType: "STAFF",
    permissions: [],
    isActive: true,
    isOnline: true,
    lastSeenAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const adminUser = staffUser({
  id: "admin-1",
  name: "Admin",
  email: "admin@test.com",
  roles: [{ id: "r1", name: "ADMIN", description: null }],
});

const agentUser = staffUser({
  id: "agent-1",
  name: "Agent",
  email: "agent@test.com",
  roles: [{ id: "r2", name: "AGENT", description: null }],
});

const otherAgent = staffUser({
  id: "agent-2",
  name: "Other",
  email: "other@test.com",
  roles: [{ id: "r2", name: "AGENT", description: null }],
});

test("RBAC: admin can access any conversation", () => {
  assert.equal(
    canStaffAccessConversation(adminUser, {
      currentAgentId: "agent-2",
      assignedAgentIds: [],
    }),
    true,
  );
});

test("RBAC: agent can access assigned conversation", () => {
  assert.equal(
    canStaffAccessConversation(agentUser, {
      currentAgentId: "agent-1",
      assignedAgentIds: [],
    }),
    true,
  );

  assert.equal(
    canStaffAccessConversation(agentUser, {
      currentAgentId: null,
      assignedAgentIds: ["agent-1"],
    }),
    true,
  );
});

test("RBAC: agent cannot access another agent conversation", () => {
  assert.equal(
    canStaffAccessConversation(agentUser, {
      currentAgentId: "agent-2",
      assignedAgentIds: ["agent-2"],
    }),
    false,
  );

  assert.equal(
    canStaffAccessConversation(otherAgent, {
      currentAgentId: "agent-1",
      assignedAgentIds: [],
    }),
    false,
  );
});

test("assignment: manual assign allows offline agents under capacity", async () => {
  const { isAgentEligibleForManualAssignment } = await import("@/lib/chat/rbac");
  assert.equal(
    isAgentEligibleForManualAssignment({
      userType: "STAFF",
      isActive: true,
      isOnline: false,
      roles: ["AGENT"],
      agentStatus: "OFFLINE",
      activeChatCount: 1,
      maxConcurrentChats: 5,
    }),
    true,
  );
});

test("assignment: eligible agent passes capacity and status checks", () => {
  assert.equal(
    isAgentEligibleForAssignment({
      userType: "STAFF",
      isActive: true,
      roles: ["AGENT"],
      agentStatus: "ONLINE",
      activeChatCount: 2,
      maxConcurrentChats: 5,
    }),
    true,
  );

  assert.equal(
    isAgentEligibleForAssignment({
      userType: "STAFF",
      isActive: true,
      roles: ["AGENT"],
      agentStatus: "ONLINE",
      activeChatCount: 5,
      maxConcurrentChats: 5,
    }),
    false,
  );

  assert.equal(
    isAgentEligibleForAssignment({
      userType: "STAFF",
      isActive: true,
      roles: ["AGENT"],
      agentStatus: "OFFLINE",
      activeChatCount: 0,
    }),
    false,
  );
});

test("assignment: auto-assign requires online agent status", () => {
  assert.equal(
    isAgentEligibleForAutoAssignment({
      userType: "STAFF",
      isActive: true,
      isOnline: true,
      roles: ["AGENT"],
      agentStatus: "ONLINE",
      activeChatCount: 1,
    }),
    true,
  );

  assert.equal(
    isAgentEligibleForAutoAssignment({
      userType: "STAFF",
      isActive: true,
      isOnline: false,
      roles: ["AGENT"],
      agentStatus: "ONLINE",
      activeChatCount: 0,
    }),
    false,
  );
});

test("assignment: auto-assign skipped when admins are online", () => {
  assert.equal(shouldAutoAssignWhenNoOnlineAdmins(0), true);
  assert.equal(shouldAutoAssignWhenNoOnlineAdmins(2), false);
});

test("assignment: duplicate assignment is detected", () => {
  assert.equal(
    isDuplicateAssignment({
      currentAgentId: "agent-1",
      targetAgentId: "agent-1",
      status: "ASSIGNED",
    }),
    true,
  );

  assert.equal(
    isDuplicateAssignment({
      currentAgentId: "agent-1",
      targetAgentId: "agent-2",
      status: "ASSIGNED",
    }),
    false,
  );
});

test("RBAC: agent send message rules", () => {
  assert.equal(
    canAgentSendMessage({
      isAdmin: false,
      agentId: "agent-1",
      currentAgentId: "agent-1",
      status: "ACTIVE",
    }),
    true,
  );

  assert.equal(
    canAgentSendMessage({
      isAdmin: false,
      agentId: "agent-2",
      currentAgentId: "agent-1",
      status: "ACTIVE",
    }),
    false,
  );

  assert.equal(
    canAgentSendMessage({
      isAdmin: true,
      agentId: "admin-1",
      currentAgentId: "agent-1",
      status: "ACTIVE",
    }),
    true,
  );
});

import type { AuthenticatedUser } from "@/lib/auth/types";
import { isAdmin } from "@/lib/auth/roles";

export type ConversationAccessContext = {
  currentAgentId: string | null;
  assignedAgentIds: string[];
};

/** Server-side RBAC: staff access to a conversation. */
export function canStaffAccessConversation(
  user: AuthenticatedUser,
  session: ConversationAccessContext,
): boolean {
  if (isAdmin(user)) return true;
  if (session.currentAgentId === user.id) return true;
  return session.assignedAgentIds.includes(user.id);
}

export type AgentEligibilityInput = {
  userType: string;
  isActive: boolean;
  isOnline?: boolean;
  roles: string[];
  agentStatus?: string | null;
  activeChatCount?: number;
  maxConcurrentChats?: number | null;
};

export function isAgentEligibleForAssignment(
  agent: AgentEligibilityInput,
): boolean {
  if (agent.userType !== "STAFF" || !agent.isActive) return false;
  if (!agent.roles.includes("AGENT")) return false;
  if (!agent.agentStatus || !["ONLINE", "BREAK"].includes(agent.agentStatus)) {
    return false;
  }

  const max = agent.maxConcurrentChats ?? 5;
  return (agent.activeChatCount ?? 0) < max;
}

/** Admin manual assign — offline/unavailable agents allowed if active and under capacity. */
export function isAgentEligibleForManualAssignment(
  agent: AgentEligibilityInput,
): boolean {
  if (agent.userType !== "STAFF" || !agent.isActive) return false;
  if (!agent.roles.includes("AGENT")) return false;

  const max = agent.maxConcurrentChats ?? 5;
  return (agent.activeChatCount ?? 0) < max;
}

export function isAgentEligibleForAutoAssignment(
  agent: AgentEligibilityInput,
): boolean {
  if (!isAgentEligibleForAssignment(agent)) return false;
  if (!agent.isOnline) return false;
  return agent.agentStatus === "ONLINE";
}

export function shouldAutoAssignWhenNoOnlineAdmins(
  onlineAdminCount: number,
): boolean {
  return onlineAdminCount === 0;
}

export function isDuplicateAssignment(params: {
  currentAgentId: string | null;
  targetAgentId: string;
  status: string;
}): boolean {
  return (
    params.currentAgentId === params.targetAgentId &&
    (params.status === "ASSIGNED" || params.status === "ACTIVE")
  );
}

export function canAgentSendMessage(params: {
  isAdmin: boolean;
  agentId: string;
  currentAgentId: string | null;
  status: string;
}): boolean {
  if (params.isAdmin) return true;
  if (params.currentAgentId === params.agentId) return true;
  return params.status === "WAITING_FOR_AGENT";
}

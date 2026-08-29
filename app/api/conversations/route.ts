import { NextRequest } from "next/server";
import { handleApiError, jsonList } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import {
  listConversations,
  type ConversationFilter,
} from "@/services/chat/conversation.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff(request);
    const { searchParams } = request.nextUrl;

    const filter = (searchParams.get("status") ??
      searchParams.get("filter") ??
      "all") as ConversationFilter;

    const result = await listConversations({
      user,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      filter,
      search: searchParams.get("search") ?? undefined,
      agentId: searchParams.get("agentId") ?? undefined,
    });

    return jsonList(result.data, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

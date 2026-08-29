import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { getDashboardStats } from "@/services/chat/conversation.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff(request);
    const stats = await getDashboardStats(user);
    return jsonSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

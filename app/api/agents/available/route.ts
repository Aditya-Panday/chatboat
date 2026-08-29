import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { listAvailableAgents } from "@/services/chat/assignment.service";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const agents = await listAvailableAgents();
    return jsonSuccess(agents);
  } catch (error) {
    return handleApiError(error);
  }
}

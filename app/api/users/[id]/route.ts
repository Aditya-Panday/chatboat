import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { requireStaff } from "@/lib/auth/authorization";
import { deleteUser, getUserById } from "@/services/user.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireStaff(request);
    const { id } = await context.params;
    const user = await getUserById(id, actor);
    return jsonSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireStaff(request);
    const { id } = await context.params;
    const result = await deleteUser(id, {
      actor,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

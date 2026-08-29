import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { requireStaff } from "@/lib/auth/authorization";
import { updateRoleSchema } from "@/lib/validation/user.schema";
import { updateUserRole } from "@/services/user.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireStaff(request);
    const { id } = await context.params;
    const body = await request.json();
    const input = updateRoleSchema.parse(body);
    const user = await updateUserRole(id, input, {
      actor,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return jsonSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

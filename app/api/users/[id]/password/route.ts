import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { requireStaff } from "@/lib/auth/authorization";
import {
  adminResetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validation/user.schema";
import { updateUserPassword } from "@/services/user.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireStaff(request);
    const { id } = await context.params;
    const body = await request.json();
    const isSelf = actor.id === id;

    if (isSelf) {
      const input = updatePasswordSchema.parse(body);
      await updateUserPassword(id, input.newPassword, {
        actor,
        currentPassword: input.currentPassword,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    } else {
      const input = adminResetPasswordSchema.parse(body);
      await updateUserPassword(id, input.newPassword, {
        actor,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    }

    return jsonSuccess({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}

import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/services/auth.service";
import { ApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    return jsonSuccess(toPublicUser(user));
  } catch (error) {
    return handleApiError(error);
  }
}

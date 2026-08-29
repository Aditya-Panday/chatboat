import { NextRequest } from "next/server";
import { handleApiError, jsonList, jsonSuccess } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { requireStaff } from "@/lib/auth/authorization";
import {
  createUserSchema,
  listUsersSchema,
} from "@/lib/validation/user.schema";
import { createUser, listUsers } from "@/services/user.service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireStaff(request);
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listUsersSchema.parse(params);
    const result = await listUsers(query, actor);
    return jsonList(result.data, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireStaff(request);
    const body = await request.json();
    const input = createUserSchema.parse(body);
    const user = await createUser(input, {
      actor,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return jsonSuccess(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

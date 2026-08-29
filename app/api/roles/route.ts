import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { listAssignableRoles } from "@/services/role.service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireStaff(request);
    const roles = await listAssignableRoles(actor);
    return jsonSuccess(roles);
  } catch (error) {
    return handleApiError(error);
  }
}

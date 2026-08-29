import { z } from "zod";

export const guestIdentitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
});

export const startSessionSchema = z.object({
  visitorId: z.string().uuid().optional(),
  guest: guestIdentitySchema.optional(),
  customerId: z.string().uuid().optional(),
});

export const sendSessionMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const handoffSchema = z.object({
  reason: z.literal("CUSTOMER_REQUESTED_AGENT").default("CUSTOMER_REQUESTED_AGENT"),
});

export const closeSessionSchema = z.object({
  reason: z.enum(["AI_RESOLVED", "CUSTOMER_CLOSED"]).default("CUSTOMER_CLOSED"),
});

export const assignSessionSchema = z.object({
  agentId: z.string().uuid(),
});

export type StartSessionSchema = z.infer<typeof startSessionSchema>;
export type SendSessionMessageSchema = z.infer<typeof sendSessionMessageSchema>;

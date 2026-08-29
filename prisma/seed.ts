import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: "chat.view.all", description: "View all chat sessions" },
  { name: "chat.view.assigned", description: "View assigned chat sessions" },
  { name: "chat.assign", description: "Assign chats to agents" },
  { name: "chat.reassign", description: "Reassign chats between agents" },
  { name: "chat.close", description: "Close chat sessions" },
  { name: "chat.reopen", description: "Reopen closed chat sessions" },
  { name: "agent.view", description: "View agent profiles and status" },
  { name: "agent.create", description: "Create new agent accounts" },
  { name: "agent.update", description: "Update agent profiles" },
  { name: "agent.delete", description: "Deactivate or remove agents" },
  { name: "agent.change_status", description: "Change agent online status" },
  { name: "review.create", description: "Create chat reviews/ratings" },
  { name: "review.view", description: "View chat reviews/ratings" },
  { name: "analytics.view", description: "View analytics dashboards" },
  { name: "users.view", description: "View user accounts" },
  { name: "user.create", description: "Create user accounts" },
  { name: "user.read", description: "Read user accounts" },
  { name: "user.update", description: "Update user accounts" },
  { name: "user.block", description: "Block or activate user accounts" },
  { name: "user.role.update", description: "Assign or change user roles" },
  {
    name: "user.password.update",
    description: "Reset or update user passwords",
  },
  { name: "audit.view", description: "View security audit logs" },
] as const;

const ROLE_DEFINITIONS = {
  ADMIN: {
    description: "Full system administrator",
    permissions: PERMISSIONS.map((p) => p.name),
  },
  SUPERVISOR: {
    description: "Supervisor — manages agents and reviews",
    permissions: [
      "chat.view.all",
      "chat.view.assigned",
      "chat.assign",
      "chat.reassign",
      "chat.close",
      "chat.reopen",
      "agent.view",
      "agent.update",
      "agent.change_status",
      "review.create",
      "review.view",
      "analytics.view",
      "users.view",
    ],
  },
  AGENT: {
    description: "Support agent — handles assigned chats",
    permissions: [
      "chat.view.assigned",
      "chat.close",
      "agent.change_status",
      "review.view",
    ],
  },
} as const;

async function main() {
  console.log("Seeding permissions...");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((permission) =>
      prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: permission,
      }),
    ),
  );

  const permissionByName = Object.fromEntries(
    permissionRecords.map((record) => [record.name, record]),
  );

  console.log("Seeding roles and role-permission mappings...");
  for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleDef.description },
      create: { name: roleName, description: roleDef.description },
    });

    for (const permissionName of roleDef.permissions) {
      const permission = permissionByName[permissionName];
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "ADMIN" },
  });
  const agentRole = await prisma.role.findUniqueOrThrow({
    where: { name: "AGENT" },
  });

  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const agentPasswordHash = await bcrypt.hash("Agent@12345", 12);

  console.log("Seeding demo admin...");
  const admin = await prisma.user.upsert({
    where: { email: "aditya.panday@groupbayport.com" },
    update: {
      name: "Demo Admin",
      passwordHash: adminPasswordHash,
      userType: "STAFF",
      isActive: true,
    },
    create: {
      email: "aditya.panday@groupbayport.com",
      name: "Demo Admin",
      passwordHash: adminPasswordHash,
      userType: "STAFF",
      isActive: true,
      isOnline: false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log("Seeding demo agent...");
  const agent = await prisma.user.upsert({
    where: { email: "agent@coversandall.com" },
    update: {
      name: "Demo Agent",
      passwordHash: agentPasswordHash,
      userType: "STAFF",
      isActive: true,
    },
    create: {
      email: "agent@coversandall.com",
      name: "Demo Agent",
      passwordHash: agentPasswordHash,
      userType: "STAFF",
      isActive: true,
      isOnline: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: agent.id, roleId: agentRole.id },
    },
    update: {},
    create: { userId: agent.id, roleId: agentRole.id },
  });

  await prisma.agentProfile.upsert({
    where: { userId: agent.id },
    update: {
      status: "ONLINE",
      maxConcurrentChats: 5,
      lastStatusChangedAt: new Date(),
    },
    create: {
      userId: agent.id,
      status: "ONLINE",
      activeChatCount: 0,
      totalChatCount: 0,
      maxConcurrentChats: 5,
      lastStatusChangedAt: new Date(),
    },
  });

  const existingOpenHistory = await prisma.agentStatusHistory.findFirst({
    where: { agentId: agent.id, endedAt: null },
  });

  if (!existingOpenHistory) {
    await prisma.agentStatusHistory.create({
      data: {
        agentId: agent.id,
        status: "ONLINE",
        startedAt: new Date(),
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Admin: admin@coversandall.com / Admin@12345");
  console.log("  Agent: agent@coversandall.com / Agent@12345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

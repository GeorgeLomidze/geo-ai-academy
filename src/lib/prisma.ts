import { createRequire } from "module";
import type { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionKey: string | undefined;
};
const runtimeRequire = createRequire(import.meta.url);

function normalizeConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);

    // Supabase session pooler on 5432 hits client limits quickly in local dev.
    // Switch runtime traffic to the transaction pooler port.
    if (
      url.hostname.endsWith(".pooler.supabase.com") &&
      url.port === "5432"
    ) {
      url.port = "6543";
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}

function getFieldNames(model: unknown) {
  const fields = (model as { fields?: Array<{ name: string }> | Record<string, unknown> } | undefined)?.fields;

  if (Array.isArray(fields)) {
    return fields.map((field) => field.name);
  }

  if (fields && typeof fields === "object") {
    return Object.keys(fields);
  }

  return [];
}

function hasExpectedModelFields(client: PrismaClient) {
  const models = (client as PrismaClient & {
    _runtimeDataModel?: {
      models?: Record<string, unknown>;
    };
  })._runtimeDataModel?.models;

  const questionFields = getFieldNames(models?.Question);
  const answerFields = getFieldNames(models?.Answer);

  return (
    questionFields.includes("imageUrl") &&
    questionFields.includes("imageUrls") &&
    questionFields.includes("adminReadAt") &&
    answerFields.includes("imageUrl") &&
    answerFields.includes("imageUrls")
  );
}

function loadPrismaClientClass(forceFresh = false) {
  const modulePath = runtimeRequire.resolve("@prisma/client");

  if (forceFresh) {
    delete runtimeRequire.cache[modulePath];
  }

  const prismaModule = runtimeRequire("@prisma/client") as typeof import("@prisma/client");
  return prismaModule.PrismaClient;
}

function createPrismaClient(forceFresh = false) {
  const connectionString = normalizeConnectionString(process.env.DATABASE_URL!);
  const adapter = new PrismaPg({
    connectionString,
    max: 1,
  });
  const RuntimePrismaClient = loadPrismaClientClass(forceFresh);
  return new RuntimePrismaClient({ adapter });
}

function hasExpectedDelegates(client: PrismaClient) {
  return (
    "question" in client &&
    typeof client.question !== "undefined" &&
    "answer" in client &&
    typeof client.answer !== "undefined" &&
    "adminNotification" in client &&
    typeof client.adminNotification !== "undefined" &&
    "userNotification" in client &&
    typeof client.userNotification !== "undefined" &&
    hasExpectedModelFields(client)
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  const connectionKey = normalizeConnectionString(process.env.DATABASE_URL!);

  // In dev, PrismaClient may stay cached across schema changes.
  // Recreate it if the generated delegates are missing.
  if (
    cached &&
    hasExpectedDelegates(cached) &&
    globalForPrisma.prismaConnectionKey === connectionKey
  ) {
    return cached;
  }

  if (cached) {
    cached.$disconnect().catch(() => {});
  }

  let nextClient = createPrismaClient();

  if (!hasExpectedDelegates(nextClient)) {
    nextClient.$disconnect().catch(() => {});
    nextClient = createPrismaClient(true);
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = nextClient;
    globalForPrisma.prismaConnectionKey = connectionKey;
  }

  return nextClient;
}

export function getPrisma() {
  return getPrismaClient();
}

type OptionalNotificationDelegateName = "adminNotification" | "userNotification";

function getOptionalDelegate<Name extends OptionalNotificationDelegateName>(
  name: Name
) {
  const client = getPrismaClient() as PrismaClient & Record<Name, unknown>;
  const delegate = Reflect.get(client as object, name, client);
  return delegate as PrismaClient[Name] | undefined;
}

export function getAdminNotificationDelegate() {
  return getOptionalDelegate("adminNotification");
}

export function getUserNotificationDelegate() {
  return getOptionalDelegate("userNotification");
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getPrismaClient();
  globalForPrisma.prismaConnectionKey = normalizeConnectionString(
    process.env.DATABASE_URL!
  );
}

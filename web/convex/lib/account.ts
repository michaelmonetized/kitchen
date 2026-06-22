import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export const ACCOUNT_KIND = "account";
export const DEFAULT_USER_ROLE = "user";

export function defaultUsernamePlaceholder(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at <= 0) return normalized.replace(/[^a-z0-9.-]+/g, "-");
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  return `${domain}-${local}`.replace(/[^a-z0-9.-]+/g, "-");
}

export function normalizeUsername(raw: string): string {
  const username = raw.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  if (!username || username.length < 2) {
    throw new Error("INVALID_USERNAME");
  }
  return username;
}

export function isAccountFile(
  file: Pick<Doc<"files">, "type" | "parentId" | "properties">,
): boolean {
  return (
    file.type === "dir" &&
    file.parentId === undefined &&
    file.properties.kind === ACCOUNT_KIND
  );
}

export function isLegacyOrgFile(
  file: Pick<Doc<"files">, "type" | "parentId" | "properties">,
): boolean {
  return (
    file.type === "dir" &&
    file.parentId === undefined &&
    file.properties.kind !== ACCOUNT_KIND
  );
}

export function isAccountProject(
  file: Pick<Doc<"files">, "type" | "parentId">,
  parent: Pick<Doc<"files">, "type" | "parentId" | "properties"> | null,
): boolean {
  return file.type === "dir" && parent !== null && isAccountFile(parent);
}

export function defaultProjectProperties(ownerEmail: string): Record<string, string> {
  return {
    owner: ownerEmail.trim().toLowerCase(),
    [`role:${DEFAULT_USER_ROLE}`]: "write",
  };
}

export async function getUserById(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db.get(userId);
}

export async function ensureAccountForUser(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<Id<"files">> {
  if (user.accountFileId) {
    const existing = await ctx.db.get(user.accountFileId);
    if (existing && isAccountFile(existing)) return user.accountFileId;
  }

  const now = Date.now();
  const placeholder = user.username ?? defaultUsernamePlaceholder(user.email);
  const accountId = await ctx.db.insert("files", {
    type: "dir",
    name: placeholder,
    parentId: undefined,
    properties: {
      kind: ACCOUNT_KIND,
      owner: user.email.trim().toLowerCase(),
    },
    forked: false,
    createdAt: now,
    updatedAt: now,
  });

  const patch: Partial<Doc<"users">> = {
    accountFileId: accountId,
  };
  if (!user.username) {
    patch.username = placeholder;
  }
  if (user.onboardingComplete === undefined) {
    patch.onboardingComplete = false;
  }
  await ctx.db.patch(user._id, patch);
  return accountId;
}

export async function findOrgIdForProject(
  ctx: Ctx,
  project: Doc<"files">,
): Promise<Id<"files"> | null> {
  for (const [key] of Object.entries(project.properties)) {
    if (!key.startsWith("org:")) continue;
    const slug = key.slice("org:".length);
    const orgs = await ctx.db.query("files").collect();
    for (const org of orgs) {
      if (!isLegacyOrgFile(org)) continue;
      if (org.properties[key] !== undefined || org.name === slug) {
        return org._id;
      }
      if (org.properties[`org:${slug}`] !== undefined) return org._id;
    }
  }
  return null;
}

export function projectRootFromChain(chain: Doc<"files">[]): Doc<"files"> | undefined {
  if (chain.length === 0) return undefined;
  const root = chain[chain.length - 1];
  if (!root?.parentId) return undefined;
  const account = chain.find((f) => f._id === root.parentId);
  if (account && isAccountFile(account)) return root;
  return chain.length >= 2 ? chain[chain.length - 2] : undefined;
}
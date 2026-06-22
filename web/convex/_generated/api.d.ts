/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as cli from "../cli.js";
import type * as collabRelay from "../collabRelay.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_account from "../lib/account.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_blame from "../lib/blame.js";
import type * as lib_deleted from "../lib/deleted.js";
import type * as lib_invariants from "../lib/invariants.js";
import type * as lib_metadataAudit from "../lib/metadataAudit.js";
import type * as lib_session from "../lib/session.js";
import type * as lib_slugify from "../lib/slugify.js";
import type * as lib_versionHeads from "../lib/versionHeads.js";
import type * as queries from "../queries.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as users from "../users.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  admin: typeof admin;
  cli: typeof cli;
  collabRelay: typeof collabRelay;
  files: typeof files;
  http: typeof http;
  "lib/account": typeof lib_account;
  "lib/authz": typeof lib_authz;
  "lib/blame": typeof lib_blame;
  "lib/deleted": typeof lib_deleted;
  "lib/invariants": typeof lib_invariants;
  "lib/metadataAudit": typeof lib_metadataAudit;
  "lib/session": typeof lib_session;
  "lib/slugify": typeof lib_slugify;
  "lib/versionHeads": typeof lib_versionHeads;
  queries: typeof queries;
  roles: typeof roles;
  seed: typeof seed;
  social: typeof social;
  users: typeof users;
  versions: typeof versions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

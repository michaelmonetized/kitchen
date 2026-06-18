import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";

export type OrgContext = NonNullable<
  FunctionReturnType<typeof api.admin.getOrgContext>
>;
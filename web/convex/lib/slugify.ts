export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function projectSlug(name: string, orgName?: string): string {
  const base = slugify(name);
  if (!orgName) return base;
  return `${slugify(orgName)}-${base}`;
}
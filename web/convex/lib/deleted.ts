type FileProperties = Record<string, string> | undefined;

export function isDeleted(properties: FileProperties): boolean {
  return properties?.deleted === "true";
}
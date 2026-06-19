export function formatVersionTimestamp(creationTime: number) {
  return new Date(creationTime).toLocaleString();
}

export function formatVersionShortId(versionId: string) {
  return versionId.slice(-6);
}

export function formatVersionLabel(
  index: number,
  creationTime: number,
  versionId: string,
  authorLabel?: string,
) {
  const when = formatVersionTimestamp(creationTime);
  const who = authorLabel ? ` · ${authorLabel}` : "";
  return `v${index + 1} · ${when}${who} · ${formatVersionShortId(versionId)}`;
}
import { diffLines } from "diff";

export type BlameLine = {
  lineNumber: number;
  text: string;
  authorUserId: string;
  authorLabel: string;
  versionId: string;
  timestamp: number;
};

export type VersionSnapshot = {
  _id: string;
  _creationTime: number;
  authorUserId: string;
  authorLabel: string;
  content: string;
};

type LineMeta = {
  authorUserId: string;
  authorLabel: string;
  versionId: string;
  timestamp: number;
};

function linesFromChange(value: string): string[] {
  if (value === "") return [];
  const trimmed = value.endsWith("\n") ? value.slice(0, -1) : value;
  if (trimmed === "") return [""];
  return trimmed.split("\n");
}

function lineMeta(version: VersionSnapshot): LineMeta {
  return {
    authorUserId: version.authorUserId,
    authorLabel: version.authorLabel,
    versionId: version._id,
    timestamp: version._creationTime,
  };
}

export function computeBlame(versions: VersionSnapshot[]): BlameLine[] {
  const sorted = [...versions].sort((a, b) => a._creationTime - b._creationTime);
  if (sorted.length === 0) return [];

  let lines: string[] = [];
  let meta: LineMeta[] = [];

  for (const version of sorted) {
    if (lines.length === 0) {
      lines = linesFromChange(version.content);
      meta = lines.map(() => lineMeta(version));
      continue;
    }

    const changes = diffLines(lines.join("\n"), version.content);
    const nextLines: string[] = [];
    const nextMeta: LineMeta[] = [];
    let srcIdx = 0;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (!change.added && !change.removed) {
        for (const line of linesFromChange(change.value)) {
          nextLines.push(line);
          nextMeta.push(meta[srcIdx] ?? lineMeta(version));
          srcIdx++;
        }
        continue;
      }

      if (
        change.removed &&
        i + 1 < changes.length &&
        changes[i + 1].added
      ) {
        srcIdx += linesFromChange(change.value).length;
        i++;
        for (const line of linesFromChange(changes[i].value)) {
          nextLines.push(line);
          nextMeta.push(lineMeta(version));
        }
        continue;
      }

      if (change.removed) {
        srcIdx += linesFromChange(change.value).length;
        continue;
      }

      if (change.added) {
        for (const line of linesFromChange(change.value)) {
          nextLines.push(line);
          nextMeta.push(lineMeta(version));
        }
      }
    }

    lines = nextLines;
    meta = nextMeta;
  }

  return lines.map((text, index) => ({
    lineNumber: index + 1,
    text,
    authorUserId: meta[index].authorUserId,
    authorLabel: meta[index].authorLabel,
    versionId: meta[index].versionId,
    timestamp: meta[index].timestamp,
  }));
}
import { diffLines } from "diff";

export type PickSide = "left" | "right" | "both" | "skip";

export type MergeRow = {
  id: string;
  left: string | null;
  right: string | null;
  kind: "equal" | "left" | "right" | "conflict";
  pick: PickSide;
};

function linesFromChange(value: string): string[] {
  if (value === "") return [];
  const trimmed = value.endsWith("\n") ? value.slice(0, -1) : value;
  if (trimmed === "") return [""];
  return trimmed.split("\n");
}

export function buildMergeRows(left: string, right: string): MergeRow[] {
  const changes = diffLines(left, right);
  const rows: MergeRow[] = [];
  let id = 0;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      for (const line of linesFromChange(change.value)) {
        rows.push({
          id: String(id++),
          left: line,
          right: line,
          kind: "equal",
          pick: "both",
        });
      }
      continue;
    }

    if (
      change.removed &&
      i + 1 < changes.length &&
      changes[i + 1].added
    ) {
      const leftLines = linesFromChange(change.value);
      const rightLines = linesFromChange(changes[i + 1].value);
      const maxLen = Math.max(leftLines.length, rightLines.length);

      for (let j = 0; j < maxLen; j++) {
        const leftLine = leftLines[j] ?? null;
        const rightLine = rightLines[j] ?? null;
        rows.push({
          id: String(id++),
          left: leftLine,
          right: rightLine,
          kind: "conflict",
          pick:
            leftLine !== null && rightLine === null
              ? "left"
              : rightLine !== null && leftLine === null
                ? "right"
                : "left",
        });
      }
      i++;
      continue;
    }

    if (change.removed) {
      for (const line of linesFromChange(change.value)) {
        rows.push({
          id: String(id++),
          left: line,
          right: null,
          kind: "left",
          pick: "left",
        });
      }
      continue;
    }

    if (change.added) {
      for (const line of linesFromChange(change.value)) {
        rows.push({
          id: String(id++),
          left: null,
          right: line,
          kind: "right",
          pick: "right",
        });
      }
    }
  }

  return rows;
}

export function composeMergedContent(rows: MergeRow[]): string {
  const result: string[] = [];

  for (const row of rows) {
    switch (row.pick) {
      case "left":
        if (row.left !== null) result.push(row.left);
        break;
      case "right":
        if (row.right !== null) result.push(row.right);
        break;
      case "both":
        if (row.left !== null) result.push(row.left);
        else if (row.right !== null) result.push(row.right);
        break;
      case "skip":
        break;
    }
  }

  return result.join("\n");
}
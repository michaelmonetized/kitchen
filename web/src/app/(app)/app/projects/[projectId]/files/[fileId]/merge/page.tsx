import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { MergeView } from "@/components/merge/MergeView";
import { parseFileId, parseProjectId } from "@/lib/convex-id";

export const dynamic = "force-dynamic";

export default async function MergePage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>;
}) {
  const { projectId, fileId } = await params;
  const parsedProjectId = parseProjectId(projectId);
  const parsedFileId = parseFileId(fileId);
  if (!parsedProjectId || !parsedFileId) notFound();

  return (
    <>
      <AppHeader title="Merge" />
      <main className="flex-1 p-6">
        <MergeView projectId={projectId} fileId={parsedFileId} />
      </main>
    </>
  );
}
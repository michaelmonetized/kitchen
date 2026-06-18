import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { FileEditor } from "@/components/editor/FileEditor";
import { parseFileId, parseProjectId } from "@/lib/convex-id";

export const dynamic = "force-dynamic";

export default async function FilePage({
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
      <AppHeader title="Editor" />
      <main className="flex-1 p-6">
        <FileEditor projectId={projectId} fileId={parsedFileId} />
      </main>
    </>
  );
}
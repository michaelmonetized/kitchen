import { AppHeader } from "@/components/shell/AppHeader";
import { FileEditor } from "@/components/editor/FileEditor";

export const dynamic = "force-dynamic";

export default async function FilePage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>;
}) {
  const { projectId, fileId } = await params;

  return (
    <>
      <AppHeader title="Editor" />
      <main className="flex-1 p-6">
        <FileEditor projectId={projectId} fileId={fileId} />
      </main>
    </>
  );
}
import { AppHeader } from "@/components/shell/AppHeader";
import { FileTree } from "@/components/tree/FileTree";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <>
      <AppHeader title="Project" />
      <main className="flex-1 p-6">
        <FileTree projectId={projectId} rootId={projectId} />
      </main>
    </>
  );
}
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { FileTree } from "@/components/tree/FileTree";
import { parseProjectId } from "@/lib/convex-id";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const parsedProjectId = parseProjectId(projectId);
  if (!parsedProjectId) notFound();

  return (
    <>
      <AppHeader title="Project" />
      <main className="flex-1 p-6">
        <FileTree projectId={projectId} rootId={parsedProjectId} />
      </main>
    </>
  );
}
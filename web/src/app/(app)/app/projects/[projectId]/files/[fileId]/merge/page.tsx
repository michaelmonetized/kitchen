import { AppHeader } from "@/components/shell/AppHeader";
import { MergeView } from "@/components/merge/MergeView";

export const dynamic = "force-dynamic";

export default async function MergePage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>;
}) {
  const { projectId, fileId } = await params;

  return (
    <>
      <AppHeader title="Merge" />
      <main className="flex-1 p-6">
        <MergeView projectId={projectId} fileId={fileId} />
      </main>
    </>
  );
}
import { AppHeader } from "@/components/shell/AppHeader";
import { ProjectList } from "@/components/shell/ProjectList";

export const dynamic = "force-dynamic";

export default function AppHomePage() {
  return (
    <>
      <AppHeader title="Projects" />
      <main className="flex-1 p-6">
        <ProjectList />
      </main>
    </>
  );
}
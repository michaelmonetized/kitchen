import { AppHeader } from "@/components/shell/AppHeader";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Settings" />
      <main className="flex-1 p-6">
        <SettingsView />
      </main>
    </>
  );
}
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/lib/data-store";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHeader
        eyebrow="תצורת מערכת"
        title="הגדרות"
        description="הגדרות עסקיות, שעות פעילות, סף רמת ודאות והכנה לחיבור וואטסאפ אמיתי."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}

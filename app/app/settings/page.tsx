import { StudentSettingsSupportSections } from "@/components/dashboard/student/student-settings-support-sections";
import { PrivacySettingsView } from "@/components/dashboard/settings/privacy-settings-view";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import { loadVisibleStudentMemory } from "@/lib/server/memory/service";
import { loadPrivacySettingsSnapshot } from "@/lib/server/privacy/service";

export default async function AppSettingsPage() {
  const { appUser } = await requireAppPageContext();
  const [snapshot, memorySnapshot] = await Promise.all([
    loadPrivacySettingsSnapshot(appUser),
    appUser.role === "student"
      ? loadVisibleStudentMemory({
          viewer: appUser,
          studentUserId: appUser.id,
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-6">
      <PrivacySettingsView appUser={appUser} snapshot={snapshot} />

      {appUser.role === "student" && memorySnapshot ? (
        <StudentSettingsSupportSections
          appUser={appUser}
          memorySnapshot={memorySnapshot}
        />
      ) : null}
    </div>
  );
}

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { getAppSettings, maskSecret } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let loadError: string | null = null;
  let settings: Awaited<ReturnType<typeof getAppSettings>> = {
    businessName: "Noobz Network",
    contactEmail: "",
    logoPath: null,
    cngMerchantId: "",
    cngApiKey: "",
    cngEnvironment: "qa",
    cngEndpointOverride: "",
    promoCode: "",
    promoPercent: 0,
  };

  try {
    settings = await getAppSettings();
  } catch {
    loadError = "Could not load settings. Check the database connection.";
  }

  return (
    <DashboardShell title="Settings">
      {loadError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}
      <SettingsForm
        initial={{
          businessName: settings.businessName,
          contactEmail: settings.contactEmail,
          logoPath: settings.logoPath,
          cngMerchantId: settings.cngMerchantId,
          cngApiKeyMasked: maskSecret(settings.cngApiKey),
          cngEnvironment: settings.cngEnvironment,
          cngEndpointOverride: settings.cngEndpointOverride,
          promoCode: settings.promoCode,
          promoPercent: settings.promoPercent,
          hasApiKey: Boolean(settings.cngApiKey),
        }}
      />
    </DashboardShell>
  );
}

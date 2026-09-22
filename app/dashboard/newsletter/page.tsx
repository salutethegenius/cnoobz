import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NewsletterComposer } from "@/components/dashboard/newsletter-composer";
import { resendConfigured } from "@/lib/newsletter/resend";

export const dynamic = "force-dynamic";

export default function NewsletterPage() {
  return (
    <DashboardShell title="Newsletter">
      <NewsletterComposer resendReady={resendConfigured()} />
    </DashboardShell>
  );
}

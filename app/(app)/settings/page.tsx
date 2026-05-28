import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBusinessProfile, getSessionUser } from "@/lib/data/queries";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getBusinessProfile(user.id);
  if (!profile) redirect("/setup");

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Business configuration"
        description="Edit your GST identity, invoice prefix, bank details, financial year locks, and invoice assets."
        action={
          <Button asChild variant="secondary">
            <Link href="/api/export" target="_blank">
              Export backup
            </Link>
          </Button>
        }
      />
      <Card>
        <BusinessProfileForm profile={profile} userId={user.id} />
      </Card>
    </div>
  );
}

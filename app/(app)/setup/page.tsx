import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getBusinessProfile, getSessionUser } from "@/lib/data/queries";

export default async function SetupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getBusinessProfile(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="One-time setup"
        title="Configure your business identity"
        description="Store GST details, billing settings, bank details, terms, and brand assets once, then reuse them across every invoice."
      />
      <Card>
        <BusinessProfileForm profile={profile} userId={user.id} />
      </Card>
    </div>
  );
}

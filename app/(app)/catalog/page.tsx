import { redirect } from "next/navigation";
import { CatalogManager } from "@/components/catalog-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getProducts, getSessionUser } from "@/lib/data/queries";

export default async function CatalogPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const products = await getProducts(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Reusable products and services"
        description="Save HSN/SAC codes, rates, units, and default GST percentages so invoice creation stays fast and consistent."
      />
      <CatalogManager products={products} />
    </div>
  );
}

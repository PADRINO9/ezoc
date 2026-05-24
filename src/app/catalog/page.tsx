import { ProductCatalog } from "@/components/catalog/product-catalog";
import { PageHeader } from "@/components/shared/page-header";
import { getProducts } from "@/lib/data-store";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <div>
      <PageHeader
        eyebrow="תשתית זיהוי"
        title="קטלוג מוצרים"
        description="מוצרים, כינויים וסגנונות חיתוך שמאפשרים למערכת להבין הודעות Hebrew WhatsApp לא מסודרות."
      />
      <ProductCatalog products={products} />
    </div>
  );
}

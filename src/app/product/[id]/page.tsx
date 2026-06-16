import { notFound } from "next/navigation";
import { ProductClient } from "./ProductClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ProductClient productId={id} />;
}

import Link from "next/link";
import { CategoryMeta } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { allTools } from "@/lib/tools-registry";
import { Locale, localePath } from "@/lib/i18n/config";
import { formatToolCount } from "@/lib/i18n/format";

export function CategoryCard({ category, locale }: { category: CategoryMeta; locale: Locale }) {
  const count = allTools.filter((t) => t.category === category.slug).length;
  return (
    <Link href={localePath(locale, `/categories/${category.slug}`)} className="block focus-visible:outline-none">
      <Card className="h-full transition-colors hover:bg-surface-hover">
        <h3 className="font-medium text-text-primary">{category.name}</h3>
        <p className="mt-2 text-sm text-text-muted">{category.description}</p>
        <p className="mt-3 text-xs text-text-muted">{formatToolCount(count, locale)}</p>
      </Card>
    </Link>
  );
}

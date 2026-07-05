import Link from "next/link";
import { Tool } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function ToolCard({ tool, locale, dict }: { tool: Tool; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={localePath(locale, `/tools/${tool.slug}`)} className="block focus-visible:outline-none group">
      <Card className="h-full transition-colors hover:bg-surface-hover relative">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-text-primary">{tool.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {tool.isPopular && <Badge variant="popular">{dict.badges.popular}</Badge>}
            {tool.isPremiumAI && <Badge variant="pro">AI</Badge>}
            {!tool.isImplemented && !tool.isPremiumAI && <Badge variant="soon">{dict.badges.comingSoon}</Badge>}
            <FavoriteButton slug={tool.slug} />
          </div>
        </div>
        <p className="mt-2 text-sm text-text-muted">{tool.shortDescription}</p>
      </Card>
    </Link>
  );
}

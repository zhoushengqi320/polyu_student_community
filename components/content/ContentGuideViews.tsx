import Link from "next/link";
import { RichContent } from "@/components/common/RichContent";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ContentGuideDetail, type ContentGuideListItem } from "@/types/contentGuide";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";

type ContentGuideListProps = {
  items: ContentGuideListItem[];
  detailHref: (id: string) => string;
  emptyTitle: string;
  emptyDescription: string;
};

export function ContentGuideList({
  items,
  detailHref,
  emptyTitle,
  emptyDescription,
}: ContentGuideListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Link key={item.id} href={detailHref(item.id)} className="group block h-full">
          <Card className={interactiveCardClassName("h-full")}>
            <CardHeader>
              <CardTitle className="transition-colors group-hover:text-primary">
                {item.title}
              </CardTitle>
              {item.excerpt ? (
                <CardDescription className="line-clamp-3">{item.excerpt}</CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

type ContentGuideDetailViewProps = {
  guide: ContentGuideDetail;
};

export function ContentGuideDetailView({ guide }: ContentGuideDetailViewProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <RichContent content={guide.content} stripTitle={guide.title} />
      </CardContent>
    </Card>
  );
}

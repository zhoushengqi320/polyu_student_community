import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Resource } from "@/types/resource";

type ResourceCardProps = {
  resource: Resource;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <span>{resource.title}</span>
          <ExternalLink
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </CardTitle>
        {resource.description ? (
          <CardDescription>{resource.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          访问网站
        </a>
      </CardContent>
    </Card>
  );
}

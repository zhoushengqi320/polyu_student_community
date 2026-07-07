import { Download, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils/formatDate";
import { type CourseDetail } from "@/types/course";

type CoursePdfPanelProps = {
  course: CourseDetail;
};

function getCoursePdfHref(course: CourseDetail): string | null {
  if (course.pdfUrl) {
    return course.pdfUrl;
  }

  if (!course.pdfStoragePath) {
    return null;
  }

  const normalizedPath = course.pdfStoragePath.replace(/^学科\//, "");
  return `/course-pdfs/${normalizedPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function CoursePdfPanel({ course }: CoursePdfPanelProps) {
  const pdfHref = getCoursePdfHref(course);

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF</CardTitle>
        <CardDescription>保留官方原始课程资料入口，便于核对信息来源</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pdfHref ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={pdfHref} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" aria-hidden="true" />
                查看 PDF
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={pdfHref} download>
                <Download className="h-4 w-4" aria-hidden="true" />
                下载 PDF
              </a>
            </Button>
          </div>
        ) : (
          <EmptyState
            title="暂无 PDF"
            description="课程官方 PDF 导入后会显示查看和下载入口。"
          />
        )}
        {course.sourceUpdatedAt ? (
          <p className="text-sm text-muted-foreground">
            更新时间：{formatDate(course.sourceUpdatedAt)}
          </p>
        ) : null}
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {course.sourceFileName ? (
            <div>
              <p className="text-muted-foreground">Source File</p>
              <p className="mt-1 break-all">{course.sourceFileName}</p>
            </div>
          ) : null}
          {course.pdfStoragePath ? (
            <div>
              <p className="text-muted-foreground">Storage Path</p>
              <p className="mt-1 break-all">{course.pdfStoragePath}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

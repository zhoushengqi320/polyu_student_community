import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type CourseDetail } from "@/types/course";

type CourseAssessmentProps = {
  course: CourseDetail;
};

function AssessmentBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="font-medium">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value}
      </p>
    </div>
  );
}

export function CourseAssessment({ course }: CourseAssessmentProps) {
  const assessmentItems =
    course.assessment.items && course.assessment.items.length > 0
      ? course.assessment.items
      : [
          { label: "作业", value: course.assessment.assignment },
          { label: "测验", value: course.assessment.quiz },
          { label: "期中考试", value: course.assessment.midterm },
          { label: "期末考试", value: course.assessment.finalExam },
          { label: "项目", value: course.assessment.project },
          { label: "汇报", value: course.assessment.presentation },
          { label: "其他", value: course.assessment.other },
        ].filter((item): item is { label: string; value: string } =>
          Boolean(item.value),
        );

  return (
    <Card>
      <CardHeader>
        <CardTitle>考核方式</CardTitle>
        <CardDescription>
          课程考核方式，按官方 PDF 中的原始分类和百分比展示
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assessmentItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {assessmentItems.map(({ label, value }) => (
              <AssessmentBlock key={label} label={label} value={value} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="暂无考核信息"
            description="导入官方 PDF 后会在这里展示该课程原始考核分类。"
          />
        )}
      </CardContent>
    </Card>
  );
}

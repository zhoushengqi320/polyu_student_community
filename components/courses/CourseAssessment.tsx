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
          { label: "Assignment", value: course.assessment.assignment },
          { label: "Quiz", value: course.assessment.quiz },
          { label: "Midterm", value: course.assessment.midterm },
          { label: "Final Exam", value: course.assessment.finalExam },
          { label: "Project", value: course.assessment.project },
          { label: "Presentation", value: course.assessment.presentation },
          { label: "Other", value: course.assessment.other },
        ].filter((item): item is { label: string; value: string } =>
          Boolean(item.value),
        );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment</CardTitle>
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

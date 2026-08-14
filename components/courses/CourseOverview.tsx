import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDepartmentCode } from "@/constants/courseOptions";
import {
  normalizeDisplayCode,
  normalizeDisplayLevel,
  normalizeDisplayName,
} from "@/lib/courses/normalizeDisplay";
import { type CourseDetail } from "@/types/course";

type CourseOverviewProps = {
  course: CourseDetail;
};

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (value === null || value === "") {
    return null;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</p>
    </div>
  );
}

export function CourseOverview({ course }: CourseOverviewProps) {
  const displayCode = normalizeDisplayCode(course.code);
  const displayName = normalizeDisplayName(course.name, course.code);
  const displayLevel = normalizeDisplayLevel(course.level);

  return (
    <Card>
      <CardHeader>
        <CardTitle>课程概览</CardTitle>
        <CardDescription>来自官方课程资料的结构化信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoBlock label="课程代码" value={displayCode} />
          <InfoBlock label="课程名称" value={displayName} />
          <InfoBlock label="开课学系" value={course.department} />
          <InfoBlock label="所属学院" value={course.faculty} />
          <InfoBlock
            label="学分"
            value={course.credits === null ? null : `${course.credits} 学分`}
          />
          <InfoBlock label="级别" value={displayLevel} />
          <InfoBlock label="开课学期" value={course.semesterOffered} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock label="课程简介" value={course.description} />
          <InfoBlock label="学习目标" value={course.objectives} />
          <InfoBlock label="先修要求" value={course.prerequisites} />
          <InfoBlock label="教学模式" value={course.teachingPattern} />
        </div>
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>来自官方课程资料的结构化信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoBlock label="Course Code" value={course.code} />
          <InfoBlock label="Course Name" value={course.name} />
          <InfoBlock label="Department" value={course.department} />
          <InfoBlock label="School ID" value={course.schoolId} />
          <InfoBlock label="Faculty" value={course.faculty} />
          <InfoBlock
            label="Credits"
            value={course.credits === null ? null : `${course.credits} credits`}
          />
          <InfoBlock label="Level" value={course.level} />
          <InfoBlock label="Semester Offered" value={course.semesterOffered} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock label="课程简介" value={course.description} />
          <InfoBlock label="目标" value={course.objectives} />
          <InfoBlock label="先修要求" value={course.prerequisites} />
          <InfoBlock label="Teaching Pattern" value={course.teachingPattern} />
        </div>
      </CardContent>
    </Card>
  );
}

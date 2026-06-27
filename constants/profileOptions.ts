export const STUDENT_GRADES = [
  { id: "y1", label: "一年级" },
  { id: "y2", label: "二年级" },
  { id: "y3", label: "三年级" },
  { id: "y4", label: "四年级" },
  { id: "pg", label: "授课型硕士" },
  { id: "rp", label: "研究型硕士 / 博士" },
  { id: "exchange", label: "交换生" },
  { id: "other", label: "其他" },
] as const;

export type StudentGradeId = (typeof STUDENT_GRADES)[number]["id"];

export function getStudentGradeLabel(id: string): string {
  return STUDENT_GRADES.find((item) => item.id === id)?.label ?? id;
}

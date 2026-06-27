import { z } from "zod";
import { isAllowedPolyuEmail } from "@/constants/auth";
import { STUDENT_GRADES } from "@/constants/profileOptions";

const gradeIds = STUDENT_GRADES.map((item) => item.id) as [string, ...string[]];

export const polyuEmailSchema = z.object({
  email: z
    .string()
    .email("请输入有效的邮箱地址")
    .refine(isAllowedPolyuEmail, {
      message: "仅支持理大学生邮箱（@connect.polyu.hk）",
    }),
});

export type PolyuEmailFormValues = z.infer<typeof polyuEmailSchema>;

export const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "昵称至少 2 个字符")
    .max(30, "昵称过长"),
  username: z
    .string()
    .trim()
    .min(2, "用户名至少 2 个字符")
    .max(30, "用户名过长")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名仅可包含字母、数字和下划线"),
  grade: z.enum(gradeIds, { message: "请选择年级" }),
  major: z
    .string()
    .trim()
    .min(1, "请填写专业")
    .max(100, "专业名称过长"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

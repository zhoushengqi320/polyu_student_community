import { z } from "zod";
import {
  isAllowedPolyuEmail,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  OTP_LENGTH,
  PASSWORD_MIN_LENGTH,
  WEAK_PASSWORDS,
} from "@/constants/auth";
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

export const otpCodeSchema = z.object({
  email: polyuEmailSchema.shape.email,
  otp: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `请输入 ${OTP_LENGTH} 位数字验证码`),
});

function isWeakPassword(password: string): boolean {
  const lower = password.toLowerCase();
  if (WEAK_PASSWORDS.has(lower)) {
    return true;
  }
  if (/^\d+$/.test(password)) {
    return true;
  }
  if (/^(.)\1+$/.test(password)) {
    return true;
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    return true;
  }
  return false;
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `密码至少 ${PASSWORD_MIN_LENGTH} 位`)
  .max(72, "密码过长")
  .refine((value) => !isWeakPassword(value), {
    message: "密码过于简单，请换一个更安全的密码",
  });

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const changePasswordWithOtpSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `请输入 ${OTP_LENGTH} 位数字验证码`),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

/** @deprecated 改用 changePasswordWithOtpSchema */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "新密码不能与当前密码相同",
    path: ["password"],
  });

export const loginPasswordSchema = z.object({
  email: polyuEmailSchema.shape.email,
  password: z.string().min(1, "请输入密码"),
});

export const nicknameOptionalSchema = z
  .string()
  .trim()
  .max(NICKNAME_MAX_LENGTH, "昵称过长")
  .refine(
    (value) => value.length === 0 || value.length >= NICKNAME_MIN_LENGTH,
    { message: `昵称至少 ${NICKNAME_MIN_LENGTH} 个字符` },
  );

export const firstSetupSchema = z.object({
  grade: z.enum(gradeIds, { message: "请选择年级" }),
  major: z
    .string()
    .trim()
    .min(1, "请填写专业")
    .max(100, "专业名称过长"),
  nickname: nicknameOptionalSchema.optional().default(""),
  avatarUrl: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "头像地址无效",
    }),
});

export type FirstSetupFormValues = z.infer<typeof firstSetupSchema>;

/** @deprecated 使用 firstSetupSchema */
export const onboardingSchema = z.object({
  displayName: nicknameOptionalSchema.optional().default(""),
  username: z.string().optional().default(""),
  grade: z.enum(gradeIds, { message: "请选择年级" }),
  major: z
    .string()
    .trim()
    .min(1, "请填写专业")
    .max(100, "专业名称过长"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const updateProfileReviewSchema = z.object({
  nickname: nicknameOptionalSchema.optional().default(""),
  avatarUrl: z.string().trim().optional().default(""),
  grade: z.enum(gradeIds, { message: "请选择年级" }).optional(),
  major: z
    .string()
    .trim()
    .min(1, "请填写专业")
    .max(100, "专业名称过长")
    .optional(),
});

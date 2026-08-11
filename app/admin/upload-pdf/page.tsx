"use client";

import Link from "next/link";
import { useState } from "react";
import { uploadCoursePdfAction } from "@/lib/course/uploadPdfAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export default function UploadPdfPage() {
  const [courseCode, setCourseCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !courseCode.trim()) {
      setIsError(true);
      setMsg("请填写课程代码并选择 PDF 文件");
      return;
    }

    setLoading(true);
    setMsg("");
    setIsError(false);
    setPublicUrl(null);

    try {
      const formData = new FormData();
      formData.set("courseCode", courseCode.trim());
      formData.set("file", selectedFile);

      const result = await uploadCoursePdfAction(formData);
      if (!result.success) {
        setIsError(true);
        setMsg(`上传失败：${result.error}`);
        return;
      }

      setPublicUrl(result.publicUrl);
      setMsg(`上传成功！已绑定课程 ${result.code}`);
    } catch (err) {
      setIsError(true);
      setMsg(
        `上传失败：${err instanceof Error ? err.message : "未知错误"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">上传课程 PDF</h1>
          <p className="mt-2 text-muted-foreground">
            上传到 Supabase Storage（course_pdfs），并写入课程的 pdf_url。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={ROUTES.adminCourses()}>返回课程目录</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理员上传课程 PDF</CardTitle>
          <CardDescription>
            请先确认课程代码已在课程目录中存在；上传后会覆盖该课程原有 PDF 链接。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseCode">课程代码</Label>
              <Input
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="例如 AAE1002"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">PDF 文件</Label>
              <Input
                id="pdfFile"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] ?? null)
                }
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "上传中..." : "开始上传"}
            </Button>
          </form>

          {msg ? (
            <div
              className={`mt-4 text-sm ${
                isError ? "text-destructive" : "text-green-700"
              }`}
            >
              <p>{msg}</p>
              {publicUrl ? (
                <p className="mt-2 break-all">
                  PDF 链接：{" "}
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {publicUrl}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

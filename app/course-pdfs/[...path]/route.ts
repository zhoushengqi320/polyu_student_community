import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { type NextRequest, NextResponse } from "next/server";
import {
  COURSE_PDF_DIR_NAME,
  COURSE_PDF_STORAGE_BUCKET,
  LEGACY_COURSE_PDF_DIR_NAME,
} from "@/lib/courses/pdfPath";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function decodeSegments(segments: string[]): string[] | null {
  try {
    return segments.map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
}

function isSafeRelativeSegments(segments: string[]): boolean {
  if (segments.length === 0) {
    return false;
  }

  return segments.every(
    (segment) =>
      Boolean(segment) &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("\0") &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      !path.isAbsolute(segment),
  );
}

function contentDisposition(fileName: string, download: boolean): string {
  const disposition = download ? "attachment" : "inline";
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, "_") || "course.pdf";
  const encoded = encodeURIComponent(fileName);

  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

async function resolveLocalPdf(relativeSegments: string[]): Promise<string | null> {
  const roots = [COURSE_PDF_DIR_NAME, LEGACY_COURSE_PDF_DIR_NAME];

  for (const rootName of roots) {
    const rootDir = path.resolve(process.cwd(), rootName);
    const candidate = path.resolve(rootDir, ...relativeSegments);
    const relativeToRoot = path.relative(rootDir, candidate);

    if (
      relativeToRoot.startsWith("..") ||
      path.isAbsolute(relativeToRoot) ||
      relativeToRoot === ""
    ) {
      continue;
    }

    try {
      await access(candidate);
      const info = await stat(candidate);
      if (info.isFile()) {
        return candidate;
      }
    } catch {
      // try next root
    }
  }

  return null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path: rawSegments } = await context.params;
  const segments = decodeSegments(rawSegments ?? []);

  if (!segments || !isSafeRelativeSegments(segments)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const joined = segments.join("/");
  if (!joined.toLowerCase().endsWith(".pdf")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 兼容误链到 /course-pdfs/course_pdfs/... 的情况 → 跳转 Storage 公开 URL
  if (segments[0] === COURSE_PDF_STORAGE_BUCKET) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
    if (!base) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const objectPath = segments
      .slice(1)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const publicUrl = `${base}/storage/v1/object/public/${COURSE_PDF_STORAGE_BUCKET}/${objectPath}`;
    const download = request.nextUrl.searchParams.get("download") === "1";

    if (download) {
      return NextResponse.redirect(`${publicUrl}?download`, 302);
    }

    return NextResponse.redirect(publicUrl, 302);
  }

  const filePath = await resolveLocalPdf(segments);
  if (!filePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const fileName = path.basename(filePath);
  const info = await stat(filePath);
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(info.size),
      "Content-Disposition": contentDisposition(fileName, download),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

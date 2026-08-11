import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import {
  COURSE_PDF_DIR_NAME,
  LEGACY_COURSE_PDF_DIR_NAME,
} from "@/lib/courses/pdfPath";

type CoursePdfRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const PDF_ROOTS = [COURSE_PDF_DIR_NAME, LEGACY_COURSE_PDF_DIR_NAME] as const;

function resolveCoursePdfPath(pathSegments: string[]): string | null {
  if (pathSegments.length === 0) {
    return null;
  }

  const decodedSegments = pathSegments.map((segment) =>
    decodeURIComponent(segment),
  );

  // /course-pdfs/课程/AAE/foo.pdf → cwd/课程/AAE/foo.pdf
  if (PDF_ROOTS.includes(decodedSegments[0] as (typeof PDF_ROOTS)[number])) {
    const requestedPath = path.normalize(
      path.join(process.cwd(), ...decodedSegments),
    );
    const root = path.join(process.cwd(), decodedSegments[0]);
    if (
      requestedPath.startsWith(`${root}${path.sep}`) &&
      requestedPath.endsWith(".pdf")
    ) {
      return requestedPath;
    }
    return null;
  }

  // /course-pdfs/AAE/foo.pdf → cwd/课程/AAE/foo.pdf（默认根目录）
  for (const rootName of PDF_ROOTS) {
    const root = path.join(process.cwd(), rootName);
    const requestedPath = path.normalize(
      path.join(root, ...decodedSegments),
    );
    if (
      (requestedPath === root || requestedPath.startsWith(`${root}${path.sep}`)) &&
      requestedPath.endsWith(".pdf")
    ) {
      return requestedPath;
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: CoursePdfRouteContext,
) {
  const { path: pathSegments } = await context.params;
  const requestedPath = resolveCoursePdfPath(pathSegments);

  if (!requestedPath) {
    return new NextResponse("Invalid PDF path", { status: 400 });
  }

  try {
    const file = await fs.readFile(requestedPath);
    const filename = path.basename(requestedPath);
    const shouldDownload = request.nextUrl.searchParams.get("download") === "1";
    const disposition = shouldDownload
      ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      : `inline; filename*=UTF-8''${encodeURIComponent(filename)}`;

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("PDF not found", { status: 404 });
  }
}

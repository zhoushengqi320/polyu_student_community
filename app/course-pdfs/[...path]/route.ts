import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

type CoursePdfRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(
  _request: NextRequest,
  context: CoursePdfRouteContext,
) {
  const { path: pathSegments } = await context.params;
  const pdfRoot = path.join(process.cwd(), "学科");
  const requestedPath = path.normalize(path.join(pdfRoot, ...pathSegments));
  const isInsidePdfRoot =
    requestedPath === pdfRoot || requestedPath.startsWith(`${pdfRoot}${path.sep}`);

  if (!isInsidePdfRoot || !requestedPath.endsWith(".pdf")) {
    return new NextResponse("Invalid PDF path", { status: 400 });
  }

  try {
    const file = await fs.readFile(requestedPath);
    const filename = path.basename(requestedPath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch {
    return new NextResponse("PDF not found", { status: 404 });
  }
}

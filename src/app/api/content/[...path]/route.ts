import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  json: "application/json",
  txt: "text/plain",
  md: "text/markdown",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

type RouteProps = {
  params: Promise<{ path: string[] }>;
};

function toSafeAbsolutePath(segments: string[]): string | null {
  const decoded = segments.map((segment) => decodeURIComponent(segment));
  const absolutePath = path.resolve(CONTENT_ROOT, ...decoded);
  const contentRootResolved = path.resolve(CONTENT_ROOT);
  if (!absolutePath.startsWith(contentRootResolved)) {
    return null;
  }
  return absolutePath;
}

function detectMimeType(absPath: string): string {
  const ext = path.extname(absPath).replace(".", "").toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const pathParams = await params;
  const resolved = toSafeAbsolutePath(pathParams.path);
  if (!resolved) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const file = await fs.readFile(resolved);
    const mimeType = detectMimeType(resolved);
    const fileName = path.basename(resolved);
    const asDownload = request.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=600",
        "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`
      }
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}

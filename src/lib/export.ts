import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * 期間内のログ写真の Signed URL を一括取得する。
 */
export async function fetchPhotoUrls(
  supabase: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string
): Promise<string[]> {
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, photo_storage_path")
    .gte("log_date", dateStart)
    .lte("log_date", dateEnd)
    .not("photo_storage_path", "is", null);

  if (!logs || logs.length === 0) return [];

  const paths = logs
    .filter((log) => log.photo_storage_path)
    .map((log) => log.photo_storage_path!);

  const { data: signedData } = await supabase.storage
    .from("log-photos")
    .createSignedUrls(paths, 3600);

  if (!signedData) return [];

  return signedData.map((d) => d.signedUrl).filter(Boolean);
}

/**
 * DOM要素をPNGとしてダウンロードする。
 */
export async function exportAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * DOM要素をPDFとしてダウンロードする。
 */
export async function exportAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const imgData = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  // 画像サイズを取得するために一時的にImageを作成
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imgData;
  });

  // A4 幅に合わせてスケール
  const pdfWidth = 210; // mm
  const pdfHeight = (img.height * pdfWidth) / img.width;

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}

/**
 * エクスポート用のファイル名を生成する。
 */
export function buildExportFilename(
  type: "weekly" | "monthly",
  dateLabel: string,
  format: "png" | "pdf"
): string {
  if (type === "weekly") {
    return `すくすく日記_${dateLabel}.${format}`;
  }
  return `すくすく日記_${dateLabel}.${format}`;
}

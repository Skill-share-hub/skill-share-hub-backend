import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3";
import { env } from "../config/env";

export const getS3KeyFromUrl = (fileUrl?: string | null): string | null => {
  if (!fileUrl) return null;

  try {
    const parsedUrl = new URL(fileUrl);
    const pathname = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ""));
    const bucketName = env.awsBucket;

    if (pathname.startsWith(`${bucketName}/`)) {
      return pathname.slice(bucketName.length + 1);
    }

    return pathname || null;
  } catch {
    return null;
  }
};

export const deleteFromS3 = async (s3Key: string): Promise<void> => {
  if (!s3Key) throw new Error("s3Key is required for deletion.");
const BUCKET = env.awsBucket!;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
    })
  );
};

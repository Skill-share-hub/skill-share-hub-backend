import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3";
import { env } from "../config/env";

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
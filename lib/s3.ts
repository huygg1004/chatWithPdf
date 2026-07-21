import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const s3 = new S3({
  region: process.env.NEXT_PUBLIC_S3_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  const file_key = `uploads/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  try {
    // Convert browser File into Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);

    console.log("Successfully uploaded:", file_key);

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-southeast-1.amazonaws.com/${file_key}`;
  return url;
}

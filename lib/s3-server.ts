import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

export async function downloadFromS3(
  file_key: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const s3 = new S3({
        region: "ap-southeast-1",
        credentials: {
          accessKeyId:
            process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
          secretAccessKey:
            process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        },
      });

      const params = {
        Bucket:
          process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      };

      const obj = await s3.getObject(params);

      const tmpDir = "/tmp";

      // Ensure /tmp exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
      }

      const file_name = path.join(
        tmpDir,
        `${Date.now()}.pdf`,
      );

      if (
        obj.Body instanceof
        require("stream").Readable
      ) {
        const file =
          fs.createWriteStream(file_name);

        file.on("open", () => {
          // @ts-ignore
          obj.Body?.pipe(file).on(
            "finish",
            () => {
              resolve(file_name);
            },
          );
        });
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Delete multiple files from S3
 */
export async function deleteFilesFromS3(
  fileKeys: string[],
): Promise<void> {
  if (fileKeys.length === 0) {
    return;
  }

  const s3 = new S3({
    region: "ap-southeast-1",
    credentials: {
      accessKeyId:
        process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey:
        process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
    },
  });

  const result = await s3.deleteObjects({
    Bucket:
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Delete: {
      Objects: fileKeys.map((fileKey) => ({
        Key: fileKey,
      })),
      Quiet: false,
    },
  });

  if (
    result.Errors &&
    result.Errors.length > 0
  ) {
    console.error(
      "S3 deletion errors:",
      result.Errors,
    );

    throw new Error(
      "Some S3 files could not be deleted.",
    );
  }

  console.log(
    `Deleted ${fileKeys.length} file(s) from S3.`,
  );
}
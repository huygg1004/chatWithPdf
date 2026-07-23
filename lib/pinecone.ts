import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import fs from "fs/promises";
import { extractText } from "unpdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

// ---------------------------------------------
// Pinecone client
// ---------------------------------------------

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

// ---------------------------------------------
// PDF type
// ---------------------------------------------

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: {
      pageNumber: number;
    };
  };
};

// ---------------------------------------------
// Main function
// ---------------------------------------------

export async function loadS3IntoPinecone(fileKey: string) {
  // 1. Download PDF from S3
  console.log("Downloading PDF from S3...");

  const fileName = await downloadFromS3(fileKey);

  if (!fileName) {
    throw new Error("Could not download PDF from S3");
  }

  console.log("Loading PDF into memory:", fileName);

  // 2. Read PDF
  const dataBuffer = await fs.readFile(fileName);

  // 3. Parse PDF
  console.log("Parsing PDF...");

  const { text } = await extractText(new Uint8Array(dataBuffer));

  const extractedText = text.join("\n");

  console.log("PDF parsed successfully");

  console.log(`Extracted ${extractedText.length} characters`);

  // 4. Create document
  // For now, the entire PDF is treated
  // as one page.
  const pages: PDFPage[] = [
    {
      pageContent: extractedText,
      metadata: {
        loc: {
          pageNumber: 1,
        },
      },
    },
  ];

  // 5. Split PDF into chunks
  console.log("Splitting PDF into chunks...");

  const documents = await Promise.all(pages.map(prepareDocument));

  const chunks = documents.flat();

  console.log(`Created ${chunks.length} chunks`);

  // 6. Generate embeddings
  console.log("Generating embeddings...");

  const vectors = await Promise.all(chunks.map(embedDocument));

  console.log(`Generated ${vectors.length} embeddings`);

  // 7. Upload to Pinecone
  console.log("Connecting to Pinecone...");

  const client = getPineconeClient();

  const pineconeIndex = client.index({
    name: "chat-pdf",
  });

  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  console.log("Inserting vectors into Pinecone...");

  await namespace.upsert({
    records: vectors,
  });

  console.log("Successfully inserted vectors into Pinecone");

  return chunks;
}

// ---------------------------------------------
// Embed document
// ---------------------------------------------

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);

    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.error("Error embedding document:", error);

    throw error;
  }
}

// ---------------------------------------------
// Truncate string by bytes
// ---------------------------------------------

export const truncateStringByBytes = (str: string, bytes: number) => {
  const encoder = new TextEncoder();

  const decoder = new TextDecoder("utf-8");

  return decoder.decode(encoder.encode(str).slice(0, bytes));
};

// ---------------------------------------------
// Prepare document
// ---------------------------------------------

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;

  // Clean whitespace
  pageContent = pageContent.replace(/\s+/g, " ").trim();

  // Create splitter
  const splitter = new RecursiveCharacterTextSplitter();

  // Split document
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,

      metadata: {
        pageNumber: metadata.loc.pageNumber,

        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  return docs;
}

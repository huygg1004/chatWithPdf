import { getEmbeddings } from "./embeddings";
import { getPineconeClient } from "./pinecone";
import { convertToAscii } from "./utils";

type ChunkMetadata = {
  text?: string;
  pageContent?: string;
  pageNumber?: number;
  fileKey?: string;
};

export async function getContext(
  query: string,
  fileKey: string,
): Promise<string> {
  if (!query.trim()) {
    return "";
  }

  const queryEmbedding = await getEmbeddings(query);

  const pinecone = await getPineconeClient();
  const index = pinecone.index("chat-pdf");

  // This must be the same namespace used when the PDF was uploaded.
  const namespace = index.namespace(convertToAscii(fileKey));

  const result = await namespace.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
    includeValues: false,
  });
  console.log("Query:", query);
  console.log("Namespace:", convertToAscii(fileKey));
  console.log("Pinecone matches:", result.matches);

  const relevantChunks = result.matches
    // .filter((match) => {
    //   // Adjust this after checking the score distribution in your index.
    //   return match.score === undefined || match.score >= 0.65;
    // })
    .map((match, index) => {
      const metadata = match.metadata as ChunkMetadata | undefined;

      const text = metadata?.text ?? metadata?.pageContent ?? "";
      const page = metadata?.pageNumber;

      if (!text) {
        return "";
      }

      return [
        `[Source ${index + 1}${page ? `, page ${page}` : ""}]`,
        text,
      ].join("\n");
    })
    .filter(Boolean);

  return relevantChunks.join("\n\n---\n\n");
}

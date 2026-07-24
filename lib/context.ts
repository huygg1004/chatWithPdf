import { getEmbeddings } from "./embeddings";
import { getPineconeClient } from "./pinecone";
import { convertToAscii } from "./utils";

type ChunkMetadata = {
  text?: string;
  pageContent?: string;
  pageNumber?: number;
  fileKey?: string;
  chunkIndex?: number;
  section?: string;
};

type RetrievedChunk = {
  text: string;
  pageNumber?: number;
  score: number;
  chunkIndex?: number;
  section?: string;
};

/**
 * Normalize text so identical chunks with small formatting differences
 * can be detected as duplicates.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

/**
 * Measures how many words two chunks have in common.
 *
 * Returns:
 * 0 = completely different
 * 1 = effectively identical
 */
function calculateWordOverlap(textA: string, textB: string): number {
  const wordsA = new Set(normalizeText(textA).split(" "));
  const wordsB = new Set(normalizeText(textB).split(" "));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  let intersectionSize = 0;

  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersectionSize++;
    }
  }

  return intersectionSize / Math.min(wordsA.size, wordsB.size);
}

function removeDuplicateChunks(
  chunks: RetrievedChunk[],
  maximumOverlap = 0.85,
): RetrievedChunk[] {
  const uniqueChunks: RetrievedChunk[] = [];
  const exactTexts = new Set<string>();

  for (const chunk of chunks) {
    const normalized = normalizeText(chunk.text);

    // Remove exact duplicates.
    if (exactTexts.has(normalized)) {
      continue;
    }

    // Remove chunks that contain almost the same information.
    const isNearDuplicate = uniqueChunks.some((existingChunk) => {
      return (
        calculateWordOverlap(existingChunk.text, chunk.text) >= maximumOverlap
      );
    });

    if (isNearDuplicate) {
      continue;
    }

    exactTexts.add(normalized);
    uniqueChunks.push(chunk);
  }

  return uniqueChunks;
}

export async function getContext(
  query: string,
  fileKey: string,
): Promise<string> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return "";
  }

  try {
    const queryEmbedding = await getEmbeddings(cleanedQuery);

    const pinecone = await getPineconeClient();
    const index = pinecone.index("chat-pdf");
    const namespaceName = convertToAscii(fileKey);
    const namespace = index.namespace(namespaceName);

    /*
     * Retrieve more results than you eventually need.
     *
     * This gives you enough candidates to filter and deduplicate.
     */
    const result = await namespace.query({
      vector: queryEmbedding,
      topK: 12,
      includeMetadata: true,
      includeValues: false,
    });

    console.log("Query:", cleanedQuery);
    console.log("Namespace:", namespaceName);
    console.log(
      "Matches:",
      result.matches.map((match) => ({
        id: match.id,
        score: match.score,
        pageNumber: match.metadata?.pageNumber,
      })),
    );

    const minimumScore = 0.6;

    const candidates: RetrievedChunk[] = result.matches
      .map((match): RetrievedChunk | null => {
        const metadata = match.metadata as ChunkMetadata | undefined;
        const text = metadata?.text ?? metadata?.pageContent ?? "";
        const cleanedText = text.trim();

        if (!cleanedText) {
          return null;
        }

        return {
          text: cleanedText,
          pageNumber: metadata?.pageNumber,
          chunkIndex: metadata?.chunkIndex,
          section: metadata?.section,
          score: match.score ?? 0,
        };
      })
      .filter((chunk): chunk is RetrievedChunk => chunk !== null)
      .filter((chunk) => chunk.score >= minimumScore)
      .sort((a, b) => b.score - a.score);

    const uniqueChunks = removeDuplicateChunks(candidates);

    /*
     * Do not automatically send every matching chunk.
     * Keep only the strongest diverse results.
     */
    const selectedChunks = uniqueChunks.slice(0, 5);

    /*
     * Prevent retrieved context from becoming excessively large.
     * A token-based limit would be even more accurate.
     */
    const maximumContextCharacters = 12_000;
    let currentLength = 0;

    const formattedChunks: string[] = [];

    for (const chunk of selectedChunks) {
      const sourceNumber = formattedChunks.length + 1;

      const sourceDetails = [
        `Source ${sourceNumber}`,
        chunk.pageNumber !== undefined
          ? `page ${chunk.pageNumber}`
          : undefined,
        chunk.section ? `section: ${chunk.section}` : undefined,
        `score: ${chunk.score.toFixed(3)}`,
      ].filter(Boolean);

      const formattedChunk = [
        `[${sourceDetails.join(", ")}]`,
        chunk.text,
      ].join("\n");

      if (
        currentLength + formattedChunk.length >
        maximumContextCharacters
      ) {
        break;
      }

      formattedChunks.push(formattedChunk);
      currentLength += formattedChunk.length;
    }

    console.log(
      `Retrieved ${result.matches.length} candidates, ` +
        `${candidates.length} passed threshold, ` +
        `${uniqueChunks.length} remained after deduplication, ` +
        `${formattedChunks.length} were selected.`,
    );

    return formattedChunks.join("\n\n---\n\n");
  } catch (error) {
    console.error("Failed to retrieve PDF context:", error);
    return "";
  }
}
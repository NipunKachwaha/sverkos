// Define a simple type since we no longer use Convex's SerializedMessage
export type SerializedMessage = any;

/**
 * Compresses an array of messages using native Gzip CompressionStream.
 * Replaces the old WASM Lz4.compress method.
 */
export async function compressMessages(messages: SerializedMessage[]): Promise<ArrayBuffer> {
  // 1. Convert the JSON object to a string
  const jsonString = JSON.stringify(messages);
  
  // 2. Use native Web API to compress it (Gzip)
  const stream = new Response(jsonString).body!.pipeThrough(
    new CompressionStream("gzip")
  );
  
  // 3. Return as ArrayBuffer (ready to be uploaded to Supabase Storage)
  const compressedBuffer = await new Response(stream).arrayBuffer();
  return compressedBuffer;
}

/**
 * Decompresses a Fetch Response containing Gzip data.
 * Replaces the old WASM Lz4.decompress method.
 */
export async function decompressMessages(response: Response): Promise<SerializedMessage[]> {
  // 1. Ensure the response body exists
  if (!response.body) {
    throw new Error("Response body is empty or invalid.");
  }

  // 2. Pipe the compressed response through the native DecompressionStream
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  
  // 3. Convert back to text and parse the JSON
  const decompressedText = await new Response(stream).text();
  return JSON.parse(decompressedText);
}
// Define a basic type since we don't have Convex's SerializedMessage anymore
export type SerializedMessage = any; 

export async function compressMessages(messages: SerializedMessage[]): Promise<ArrayBuffer> {
  // 1. Convert JSON to a string
  const jsonString = JSON.stringify(messages);
  
  // 2. Use native Web API to compress it (Gzip)
  const stream = new Response(jsonString).body!.pipeThrough(
    new CompressionStream("gzip")
  );
  
  // 3. Return as ArrayBuffer (ready to be uploaded to Supabase Storage)
  const compressedBuffer = await new Response(stream).arrayBuffer();
  return compressedBuffer;
}

export async function decompressMessages(response: Response): Promise<SerializedMessage[]> {
  // 1. Check if the response body exists
  if (!response.body) {
    throw new Error("Response body is empty");
  }

  // 2. Pipe the compressed response through the native DecompressionStream
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  
  // 3. Convert back to text and parse the JSON
  const decompressedText = await new Response(stream).text();
  return JSON.parse(decompressedText);
}
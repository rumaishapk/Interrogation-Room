// Turns a Zod schema into the JSON Schema subset Gemini accepts.
// Gemini rejects some keywords (pattern, minLength, ...); we remove them here
// and still enforce those rules with Zod on whatever comes back.
import { z } from "zod";

const UNSUPPORTED_KEYWORDS = new Set(["$schema", "pattern", "minLength", "maxLength"]);

function strip(node: unknown, isPropertyMap = false): unknown {
  if (Array.isArray(node)) return node.map((item) => strip(item));
  if (node === null || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      // Inside "properties" the keys are our field names, not keywords, so keep them all.
      .filter(([key]) => isPropertyMap || !UNSUPPORTED_KEYWORDS.has(key))
      .map(([key, value]) => [key, strip(value, !isPropertyMap && key === "properties")])
  );
}

export function toGeminiSchema(schema: z.ZodType): unknown {
  return strip(z.toJSONSchema(schema));
}

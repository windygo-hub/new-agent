import { GoogleGenAI } from "@google/genai";
import type { AspectRatio, ImageSize } from "../../../types";

export const runtime = "nodejs";

type VisualRequest = {
  prompt: string;
  copy: string;
  referenceImageBase64?: string | null;
  styleRefBase64?: string | null;
  productImages?: Array<string | null>;
  highQuality?: boolean;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
};

function stripDataUrl(data?: string | null) {
  if (!data) return null;
  const comma = data.indexOf(",");
  return comma >= 0 ? data.slice(comma + 1) : data;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Missing GEMINI_API_KEY on the server." }, { status: 500 });
  }

  const body = (await req.json()) as VisualRequest;
  const {
    prompt,
    copy,
    referenceImageBase64,
    styleRefBase64,
    productImages = [],
    highQuality = false,
    aspectRatio = "1:1",
    imageSize = "1K",
  } = body;

  const ai = new GoogleGenAI({ apiKey });
  const modelName = highQuality ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (productImages.length > 0 && productImages[0]) {
    const mainProduct = stripDataUrl(productImages[0]);
    if (mainProduct) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: mainProduct } });
      parts.push({
        text: "[STRICT ASSET REPLICATION] Replicate this EXACT bottle of Huangguan Yellow Wine in the generation. NOTE: The bottle MUST be shown with its cap OPENED.",
      });
    }
  }

  const sceneContext = stripDataUrl(referenceImageBase64);
  if (sceneContext) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: sceneContext } });
  }

  const styleContext = stripDataUrl(styleRefBase64);
  if (styleContext) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: styleContext } });
  }

  const mandatoryVisualRules = `
[MANDATORY VISUAL CONSTRAINTS]:
1. Any glasses shown in the image MUST be Japanese-style glass cups (日式玻璃杯).
2. Use of goblets, wine glasses with stems, or high-heeled glasses is STRICTLY PROHIBITED.
3. The Huangguan Yellow Wine bottle MUST be depicted with its bottle cap OPENED.
  `.trim();

  const finalComposition = `${mandatoryVisualRules}\n\nVISUAL PROMPT: ${prompt}\nBRAND STORY/CONTEXT: ${copy}`;
  parts.push({ text: finalComposition });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(highQuality ? { imageSize } : {}),
        },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find((p) => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return Response.json({ imageUrl: `data:image/png;base64,${imagePart.inlineData.data}` });
    }
    return Response.json({ error: "Image generation failed." }, { status: 500 });
  } catch (error) {
    console.error("Visual Generation Error:", error);
    return Response.json({ error: "Visual generation failed." }, { status: 500 });
  }
}


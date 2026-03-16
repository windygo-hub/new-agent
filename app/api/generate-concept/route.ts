import { GoogleGenAI, Type } from "@google/genai";
import type {
  ContentCategory,
  UserPersona,
  LibraryItem,
  SellingPoint,
  ProductPhoto,
  VisualStyle,
} from "../../../types";

export const runtime = "nodejs";

type ConceptRequest = {
  scenario: string;
  category: ContentCategory;
  userPersona: UserPersona;
  imageBase64?: string | null;
  contextItems?: LibraryItem[];
  sellingPoints?: SellingPoint[];
  productPhotos?: ProductPhoto[];
  selectedStyle?: VisualStyle | null;
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

  const body = (await req.json()) as ConceptRequest;
  const {
    scenario,
    category,
    userPersona,
    imageBase64,
    contextItems = [],
    sellingPoints = [],
    productPhotos = [],
    selectedStyle,
  } = body;

  const ai = new GoogleGenAI({ apiKey });

  const pastSuccesses = contextItems
    .filter((i) => i.type === "generated")
    .slice(0, 3)
    .map((i) => i.copy)
    .join("\n---\n");

  const isPersonalDimension = ["LIFE_AESTHETIC", "LIFE_THOUGHT", "LIFE_DAILY"].includes(category);

  const styleInstruction = selectedStyle
    ? `\n【视觉风格要求】：当前用户选择了“${selectedStyle.name}”风格。
描述为：${selectedStyle.description}
在生成 visualSuggestion（配图建议）时，必须严格遵循该风格的光影、构图与调性逻辑。
建议包含关键词：${selectedStyle.prompt}`
    : "";

  const systemInstruction = isPersonalDimension
    ? `你是一位真实的生活分享达人。
【核心任务】：创作一段真实、有质感的生活朋友圈文案。每次必须提供 3 个不同的创意方案。
【品牌规范】：除非用户提供的场景描述中明确提到了“酒”或相关品牌，否则文案中严禁主动出现任何关于酒的内容。保持内容的纯粹。
【称谓规范】：若文案中涉及到品牌 or 黄酒，必须完整表述为“黄冠黄酒”，严禁使用“黄冠”、“黄冠PRO”等任何简写。
【文案规格】：每篇文案字数必须严格控制在 60-80 字之间。${styleInstruction}
【输出要求】：返回 JSON 格式，包含 3 个方案。`
    : `你是一位真实的“黄酒生活分享家”。
【核心任务】：为“黄冠黄酒”创作朋友圈文案。每次必须提供 3 个不同的创意方案。
【品牌规范】：必须使用全称“黄冠黄酒”，严禁使用“黄冠”、“黄冠PRO”等任何简写方式。
【创作原则】：将黄冠黄酒的价值自然融入生活场景。
【调性参考】：${pastSuccesses ? `参考该用户过往风格：\n${pastSuccesses}` : "风格自然、亲切、有质感，多用大白话，拒绝营销感。"}
【文案规格】：每篇文案字数必须严格控制在 60-80 字之间。${styleInstruction}
【输出要求】：返回 JSON 格式，包含 3 个方案。`;

  const prompt = `【当前身份】：${userPersona.name} (${userPersona.identity})\n【性格特质】：${userPersona.traits.join("。")}\n【创作场景】：${scenario}\n【内容维度】：${category}`;
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  const imageData = stripDataUrl(imageBase64);
  if (imageData) {
    parts.unshift({
      inlineData: { mimeType: "image/jpeg", data: imageData },
    });
  }

  if (!isPersonalDimension && sellingPoints.length > 0) {
    parts.push({
      text: `必须融入的品牌记忆点（注意品牌称谓规范）：${sellingPoints.map((s) => s.text).join("。")}`,
    });
  } else if (isPersonalDimension && sellingPoints.length > 0) {
    parts.push({
      text: `可选参考背景素材（仅在相关时自然提及，注意品牌称呼规范）：${sellingPoints
        .map((s) => s.text)
        .join("。")}`,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drafts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  copy: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                  commentScript: { type: Type.STRING },
                },
                required: ["label", "copy", "visualSuggestion", "commentScript"],
              },
            },
          },
          required: ["drafts"],
        },
        thinkingConfig: { thinkingBudget: 4096 },
      },
    });

    return Response.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Gemini Error:", error);
    return Response.json({ error: "Concept generation failed." }, { status: 500 });
  }
}


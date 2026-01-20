
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona, SellingPoint, ProductPhoto } from "../types";

async function compressImage(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1536; 
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
    };
  });
}

export async function generateCreativeConcept(
  scenario: string, 
  category: ContentCategory,
  userPersona: UserPersona,
  imageBase64?: string | null,
  contextItems: LibraryItem[] = [],
  sellingPoints: SellingPoint[] = [],
  productPhotos: ProductPhoto[] = []
): Promise<GeneratedConcept> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // 注入历史记忆：从 contextItems 中提取过往风格
  const pastSuccesses = contextItems
    .filter(i => i.type === 'generated')
    .slice(0, 3)
    .map(i => i.copy)
    .join('\n---\n');

  // 判断是否为个人日常维度 (维度 B)
  const isPersonalDimension = ['LIFE_AESTHETIC', 'LIFE_THOUGHT', 'LIFE_DAILY'].includes(category);

  const systemInstruction = isPersonalDimension 
    ? `你是一位真实的生活分享达人。
【核心任务】：创作一段真诚、有质感的生活朋友圈文案。必须提供 3 个不同的创意方案。
【品牌规范】：除非用户描述中明确提到，否则严禁主动出现酒类内容。**若提及品牌，必须使用全称“黄关黄酒”，严禁简写为“黄关”或“黄关PRO”。**
【创作原则】：专注于生活点滴、心情感悟或审美分享。保持内容的纯粹性和个人色彩。
【调性参考】：${pastSuccesses ? `参考过往文案的“叙事节奏和文字风格”：\n${pastSuccesses}` : '风格应自然、亲切、有质感，多用大白话，拒绝营销感。'}
【文案规格】：字数必须严格控制在 60-80 字之间。
【输出要求】：返回 JSON 格式，包含 3 个方案。`
    : `你是一位真实的“黄酒生活分享家”。
【核心任务】：为黄酒品牌创作朋友圈文案。必须提供 3 个不同的创意方案。
【品牌规范】：**必须使用全称“黄关黄酒”，严禁使用“黄关”、“黄关PRO”等任何简写。**
【创作原则】：将产品价值自然融入生活场景，展现品牌格调与专业性。
【调性参考】：${pastSuccesses ? `请参考该用户过往喜欢的文案风格：\n${pastSuccesses}` : '风格应干练、有质感、充满生活温情。'}
【文案规格】：字数必须严格控制在 60-80 字之间。生成 3 个风格各异的方案。
【输出要求】：返回 JSON 格式，包含 3 个方案。`;

  let prompt = `【当前身份】：${userPersona.name} (${userPersona.identity})\n【性格特质】：${userPersona.traits.join('、')}\n【创作场景】：${scenario}\n【内容维度】：${category}`;
  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    const compressed = await compressImage(imageBase64);
    parts.unshift({
      inlineData: { mimeType: 'image/jpeg', data: compressed }
    });
  }

  // 维度 A 强制融入卖点，维度 B 仅作为可选背景参考
  if (!isPersonalDimension && sellingPoints.length > 0) {
    parts.push({ text: `必须融入的品牌记忆点（注意品牌称呼规范）：${sellingPoints.map(s => s.text).join('、')}` });
  } else if (isPersonalDimension && sellingPoints.length > 0) {
    parts.push({ text: `可选参考背景素材（仅在相关时自然提及，注意品牌称呼规范）：${sellingPoints.map(s => s.text).join('、')}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
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
                  commentScript: { type: Type.STRING }
                },
                required: ["label", "copy", "visualSuggestion", "commentScript"]
              }
            }
          },
          required: ["drafts"]
        },
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Gemini Error:", e);
    throw new Error("方案生成失败，请稍后重试。");
  }
}

export async function generateVisual(
  prompt: string, 
  copy: string,
  referenceImageBase64?: string, 
  styleRefBase64?: string, 
  productImageBase64s: string[] = [], 
  highQuality: boolean = false,
  aspectRatio: AspectRatio = "1:1",
  imageSize: ImageSize = "1K"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const parts: any[] = [];

  if (productImageBase64s.length > 0) {
    const mainProduct = await compressImage(productImageBase64s[0]);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: mainProduct } });
    parts.push({ text: `[STRICT ASSET REPLICATION] Replicate this EXACT bottle.` });
  }

  if (referenceImageBase64) {
    const sceneContext = await compressImage(referenceImageBase64);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: sceneContext } });
  }

  if (styleRefBase64) {
    const styleContext = await compressImage(styleRefBase64);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: styleContext } });
  }

  const finalComposition = `VISUAL PROMPT: ${prompt}\nBRAND STORY: ${copy}`;
  parts.push({ text: finalComposition });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(highQuality ? { imageSize } : {})
        }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("图像生成失败。");
  } catch (e: any) {
    throw new Error("视觉资产生成异常。");
  }
}

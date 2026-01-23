
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona, SellingPoint, ProductPhoto, VisualStyle } from "../types";

async function compressImage(urlOrBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // 允许跨域加载
    if (urlOrBase64.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = urlOrBase64;
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
    img.onerror = (e) => {
      console.error("Image compression error:", e);
      reject(new Error("图片处理失败，请检查链接是否有效。"));
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
  productPhotos: ProductPhoto[] = [],
  selectedStyle?: VisualStyle | null
): Promise<GeneratedConcept> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const pastSuccesses = contextItems
    .filter(i => i.type === 'generated')
    .slice(0, 3)
    .map(i => i.copy)
    .join('\n---\n');

  const isPersonalDimension = ['LIFE_AESTHETIC', 'LIFE_THOUGHT', 'LIFE_DAILY'].includes(category);

  const styleInstruction = selectedStyle 
    ? `\n【视觉风格要求】：当前用户选择了“${selectedStyle.name}”风格。
描述为：${selectedStyle.description}
在生成 visualSuggestion（配图建议）时，必须严格遵循该风格的光影、构图与调性逻辑。
建议包含关键词：${selectedStyle.prompt}`
    : '';

  const systemInstruction = isPersonalDimension 
    ? `你是一位真实的生活分享达人。
【核心任务】：创作一段真诚、有质感的生活朋友圈文案。每次必须提供 3 个不同的创意方案。
【品牌规范】：除非用户提供的场景描述中明确提到了“酒”或相关品牌，否则文案中严禁主动出现任何关于酒的内容。保持内容的纯粹。
【称呼规范】：若文案中涉及到品牌 or 黄酒，必须完整表述为“黄关黄酒”，严禁使用“黄关”、“黄关PRO”等任何简写。
【文案规格】：每篇文案字数必须严格控制在 60-80 字之间。${styleInstruction}
【输出要求】：返回 JSON 格式，包含 3 个方案。`
    : `你是一位真实的“黄酒生活分享家”。
【核心任务】：为“黄关黄酒”创作朋友圈文案。每次必须提供 3 个不同的创意方案。
【品牌规范】：必须使用全称“黄关黄酒”，严禁使用“黄关”、“黄关PRO”等任何简写方式。
【创作原则】：将黄关黄酒的价值自然融入生活场景。
【调性参考】：${pastSuccesses ? `参考该用户过往风格：\n${pastSuccesses}` : '风格自然、亲切、有质感，多用大白话，拒绝营销感。'}
【文案规格】：每篇文案字数必须严格控制在 60-80 字之间。${styleInstruction}
【输出要求】：返回 JSON 格式，包含 3 个方案。`;

  let prompt = `【当前身份】：${userPersona.name} (${userPersona.identity})\n【性格特质】：${userPersona.traits.join('、')}\n【创作场景】：${scenario}\n【内容维度】：${category}`;
  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    const compressed = await compressImage(imageBase64);
    parts.unshift({
      inlineData: { mimeType: 'image/jpeg', data: compressed }
    });
  }

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
  productImageUrls: string[] = [], 
  highQuality: boolean = false,
  aspectRatio: AspectRatio = "1:1",
  imageSize: ImageSize = "1K"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const parts: any[] = [];

  // 处理产品图库（可能为外部 URL 或 Base64）
  if (productImageUrls.length > 0) {
    try {
      const mainProduct = await compressImage(productImageUrls[0]);
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: mainProduct } });
      parts.push({ text: `[STRICT ASSET REPLICATION] Replicate this EXACT bottle of Huangguan Yellow Wine in the generation.` });
    } catch (e) {
      console.warn("Product image compression failed, skipping visual prompt part for image.");
    }
  }

  if (referenceImageBase64) {
    try {
      const sceneContext = await compressImage(referenceImageBase64);
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: sceneContext } });
    } catch (e) {}
  }

  if (styleRefBase64) {
    try {
      const styleContext = await compressImage(styleRefBase64);
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: styleContext } });
    } catch (e) {}
  }

  const finalComposition = `VISUAL PROMPT: ${prompt}\nBRAND STORY/CONTEXT: ${copy}`;
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
    console.error("Visual Generation Error:", e);
    throw new Error("视觉资产生成异常。");
  }
}

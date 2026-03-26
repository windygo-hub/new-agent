import {
  GeneratedConcept,
  AspectRatio,
  ImageSize,
  LibraryItem,
  ContentCategory,
  UserPersona,
  SellingPoint,
  ProductPhoto,
  VisualStyle,
} from "../types";

const API_BASE = "/api";

async function compressImage(urlOrBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (urlOrBase64.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.src = urlOrBase64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const maxSize = 1536;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
    };
    img.onerror = (e) => {
      console.error("Image compression error:", e);
      reject(new Error("Image processing failed. Please check the URL."));
    };
  });
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || data?.message || "Request failed. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

async function postJsonStream<T>(
  path: string,
  body: unknown,
  handlers?: {
    onFirstChunk?: () => void;
    onChunk?: (chunk: string) => void;
  }
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.body) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const message = data?.error || data?.message || "Request failed. Please try again.";
      throw new Error(message);
    }
    return data as T;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasFirstChunk = false;

  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      const chunk = decoder.decode(value, { stream: !done });
      buffer += chunk;
      if (!hasFirstChunk && buffer.trim().length > 0) {
        hasFirstChunk = true;
        handlers?.onFirstChunk?.();
      }
      handlers?.onChunk?.(chunk);
    }
    if (done) break;
  }

  const data = buffer ? JSON.parse(buffer) : null;
  if (!response.ok) {
    const message = data?.error || data?.message || "Request failed. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

export async function generateCreativeConcept(
  scenario: string,
  category: ContentCategory,
  userPersona: UserPersona,
  imageBase64?: string | null,
  contextItems: LibraryItem[] = [],
  sellingPoints: SellingPoint[] = [],
  productPhotos: ProductPhoto[] = [],
  selectedStyle?: VisualStyle | null,
  streamHandlers?: {
    onFirstChunk?: () => void;
    onChunk?: (chunk: string) => void;
  }
): Promise<GeneratedConcept> {
  const compressed = imageBase64 ? await compressImage(imageBase64) : null;
  return postJsonStream<GeneratedConcept>(`${API_BASE}/generate-concept`, {
    scenario,
    category,
    userPersona,
    imageBase64: compressed,
    contextItems,
    sellingPoints,
    productPhotos,
    selectedStyle,
  }, streamHandlers);
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
  const compressedProducts = await Promise.all(
    productImageUrls.map(async (url) => {
      try {
        return await compressImage(url);
      } catch {
        return null;
      }
    })
  );

  const compressedRef = referenceImageBase64
    ? await compressImage(referenceImageBase64)
    : null;
  const compressedStyle = styleRefBase64 ? await compressImage(styleRefBase64) : null;

  const result = await postJson<{ imageUrl: string }>(`${API_BASE}/generate-visual`, {
    prompt,
    copy,
    referenceImageBase64: compressedRef,
    styleRefBase64: compressedStyle,
    productImages: compressedProducts.filter(Boolean),
    highQuality,
    aspectRatio,
    imageSize,
  });

  return result.imageUrl;
}

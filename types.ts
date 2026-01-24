
export enum WorkflowStep {
  SCENARIO_INPUT = 'SCENARIO_INPUT',
  CONCEPT_REVIEW = 'CONCEPT_REVIEW',
  FINAL_GENERATION = 'FINAL_GENERATION',
  LIBRARY = 'LIBRARY'
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export type ContentCategory = 
  | 'PRO' | 'TESTIMONIAL' | 'PROMO' 
  | 'LIFE_AESTHETIC' | 'LIFE_THOUGHT' | 'LIFE_DAILY';

export interface User {
  id: string;
  username: string;
  phone: string;
  lastLogin: number;
}

export interface UserPersona {
  id?: string;
  name?: string;
  identity: string;
  traits: string[];
  background: string;
  isSystem?: boolean;
}

export interface PersonaCategory {
  id: ContentCategory;
  name: string;
  description: string;
  icon: string;
  group: 'BRAND' | 'PERSONAL';
}

export interface LibraryItem {
  id: string;
  type: 'manual' | 'generated';
  copy: string;
  imageUrl?: string;
  commentScript?: string;
  category?: string;
  createdAt: number;
}

export interface SellingPoint {
  id: string;
  text: string;
}

export interface ProductPhoto {
  id: string;
  url: string;
  isPreset?: boolean;
  name?: string;
}

export interface StyleReference {
  id: string;
  url: string;
}

export interface VisualStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export const VISUAL_STYLES: VisualStyle[] = [
  {
    id: 'ZEN',
    name: '雅致闲适',
    description: '喝茶、品酒（独酌）、看书、新中式空间、静物摆拍。',
    prompt: 'Soft natural lighting, Minimalist composition, Wood texture, Steam, Tranquil atmosphere, Ceramic, Slow shutter (for movement).',
    icon: 'fa-wind'
  },
  {
    id: 'WARMTH',
    name: '人间烟火',
    description: '小聚、家庭聚餐、朋友碰杯、火锅/烧烤、夜市。',
    prompt: 'Warm ambient light, Cluttered but cozy, Depth of field, Bokeh, Happy emotions, Food photography, Cinematic warm tone.',
    icon: 'fa-fire-burner'
  },
  {
    id: 'NATURE',
    name: '自然野趣',
    description: '露营、徒步、户外野餐、自然风光背景的产品展示。',
    prompt: 'Golden hour, Sunlight rays, Fresh green, Wide angle, Aerial view, Outdoor lifestyle, Camping aesthetics.',
    icon: 'fa-mountain-sun'
  },
  {
    id: 'PREMIUM',
    name: '商务与礼赠',
    description: '正式宴请、送礼、商务洽谈、高端产品展示。',
    prompt: 'Studio lighting, Dark background, Reflections, Symmetry, Premium texture, Glass and metal, Sharp focus.',
    icon: 'fa-award'
  }
];

export const PRESET_PRODUCTS: ProductPhoto[] = [
  { id: 'preset_0', url: 'https://i.imgur.com/qmkVyyo.jpeg', name: '黄关气泡酒', isPreset: true },
  { id: 'preset_1', url: 'https://i.imgur.com/thBgYQf.jpeg', name: '传统坛装', isPreset: true },
  { id: 'preset_2', url: 'https://i.imgur.com/r7JkpUQ.jpeg', name: '桂花米酒', isPreset: true },
  { id: 'preset_3', url: 'https://i.imgur.com/hh3Wx87.jpeg', name: '金福 5年', isPreset: true },
  { id: 'preset_4', url: 'https://i.imgur.com/5aU0hDk.jpeg', name: '金福 8年', isPreset: true },
  { id: 'preset_5', url: 'https://i.imgur.com/6rAJCWG.jpeg', name: '玫瑰米酒', isPreset: true },
  { id: 'preset_6', url: 'https://i.imgur.com/AnfqaAT.jpeg', name: '青梅米酒', isPreset: true },
  { id: 'preset_7', url: 'https://i.imgur.com/5HOTuBG.jpeg', name: '桑葚米酒', isPreset: true },
];

export interface Draft {
  label: string;
  copy: string;
  visualSuggestion: string;
  commentScript: string;
}

export interface GeneratedConcept {
  drafts: Draft[];
  referenceImage?: string | null;
  selectedCategory?: string;
  userPersona?: UserPersona;
  selectedProducts?: ProductPhoto[];
  styleReferences?: StyleReference[];
  selectedStyle?: VisualStyle | null;
}

export interface GenerationResult {
  imageUrl: string;
  copy: string;
}

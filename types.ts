
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
}

export interface StyleReference {
  id: string;
  url: string;
}

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
}

export interface GenerationResult {
  imageUrl: string;
  copy: string;
}

// Shared domain types for the Speak2Design frontend.

export type Tier = 'free' | 'premium';
export type Language = 'English' | 'Urdu';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: Tier;
  usageCount: number;
}

export interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  styles: Record<string, string>;
  htmlContent: string;
}

export interface Project {
  _id: string;
  title: string;
  language: Language;
  canvasState: CanvasComponent[];
  updatedAt: string;
  createdAt: string;
}

export interface Template {
  _id: string;
  title: string;
  description: string;
  price: number;
  color?: string;
  author?: string;
  rating?: number;
  sales?: number;
  lang?: Language | 'Bilingual';
  language?: Language | 'Bilingual';
  category?: string;
  tags?: string[];
}

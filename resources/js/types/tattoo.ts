// Tipos que vienen del backend via Inertia props
export interface Character {
  id: number;
  name: string;
  description: string | null;
  glb_url: string;
  preview_url: string | null;
  emoji: string;
  tags: string | null;
}

export interface TattooDesign {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
}

// Estado de un decal confirmado en escena
export interface DecalState {
  id: string;
  designId: number;
  designName: string;
  imageUrl: string;
  color: string;
  size: number;
  rotation: number;
  intersectionPoint:  { x: number; y: number; z: number };
  intersectionNormal: { x: number; y: number; z: number };
  meshName: string;
}

// Tatuaje en previsualización (antes de confirmar)
export interface PendingTattoo {
  designId: number;
  imageUrl: string;
  color: string;
  size: number;
  rotation: number;
  intersectionPoint:  { x: number; y: number; z: number };
  intersectionNormal: { x: number; y: number; z: number };
  meshName: string;
}

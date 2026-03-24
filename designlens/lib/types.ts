export type TokenSet = {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  typography: Array<{
    role: string;
    size: string;
    weight: number;
    letterSpacing: string;
  }>;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ColorInfo = {
  hex: string;
  role: string;
  percentage: number;
};

export type TypographyInfo = {
  size: string;
  weight: number;
  letterSpacing: string;
  role: string;
};

export type LayoutInfo = {
  type: string;
  spacing: Record<string, string>;
  grid: string;
};

export type AnalysisResult = {
  id: string;
  imageHash: string;
  fileName: string;
  colors: ColorInfo[];
  typography: TypographyInfo[];
  layout: LayoutInfo;
  tokens: TokenSet;
  aiAvailable: boolean;
  createdAt: string;
};

export type ReviewIssue = {
  area: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
  bounds: BoundingBox;
};

export type ReviewResult = {
  score: number;
  issues: ReviewIssue[];
  improved: TokenSet;
};

export type EnhancementType = "color" | "spacing" | "typography" | "position" | "contrast";

export type Enhancement = {
  issueIndex: number;
  type: EnhancementType;
  before: string;
  after: string;
  bounds: BoundingBox;
  description: string;
};

export type EnhanceResult = {
  enhancements: Enhancement[];
  improvedScore: number;
};

export type ImageGenResult = {
  imageUrl: string;
  generationTime: number;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  references: ReferenceImage[];
  createdAt: string;
};

export type ReferenceImage = {
  id: string;
  fileName: string;
  filePath: string;
  status: "uploading" | "processing" | "analyzed" | "error";
  analysis?: AnalysisResult;
  error?: string;
  uploadedAt: string;
};

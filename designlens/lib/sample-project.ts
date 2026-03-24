import type { Project, AnalysisResult, ReferenceImage } from "./types";

const sampleAnalyses: Record<string, AnalysisResult> = {
  "fashion-ecommerce": {
    id: "analysis_sample_1",
    imageHash: "sample_fashion_ecommerce",
    fileName: "fashion-ecommerce.jpg",
    colors: [
      { hex: "#0A0A0A", role: "background", percentage: 45 },
      { hex: "#1A1A1A", role: "surface", percentage: 20 },
      { hex: "#C9A96E", role: "accent", percentage: 10 },
      { hex: "#FFFFFF", role: "text-primary", percentage: 10 },
      { hex: "#9A9A9A", role: "text-secondary", percentage: 8 },
      { hex: "#2C2420", role: "warm-neutral", percentage: 7 },
    ],
    typography: [
      { size: "48px", weight: 700, letterSpacing: "4px", role: "hero" },
      { size: "14px", weight: 400, letterSpacing: "2px", role: "nav" },
      { size: "12px", weight: 500, letterSpacing: "3px", role: "label" },
    ],
    layout: {
      type: "full-width editorial",
      spacing: { section: "60px", card: "20px", element: "12px" },
      grid: "full-bleed hero, 4-col category grid, 2-col about section",
    },
    tokens: {
      colors: {
        "--bg-deep": "#0A0A0A",
        "--bg-surface": "#1A1A1A",
        "--accent-gold": "#C9A96E",
        "--text-primary": "#FFFFFF",
        "--text-secondary": "#9A9A9A",
        "--warm-neutral": "#2C2420",
      },
      spacing: { "--space-sm": "12px", "--space-md": "20px", "--space-lg": "60px", "--space-xl": "80px" },
      radius: { "--radius-none": "0px", "--radius-sm": "2px" },
      typography: [
        { role: "hero", size: "48px", weight: 700, letterSpacing: "4px" },
        { role: "nav", size: "14px", weight: 400, letterSpacing: "2px" },
        { role: "label", size: "12px", weight: 500, letterSpacing: "3px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  "notion-landing": {
    id: "analysis_sample_2",
    imageHash: "sample_notion_landing",
    fileName: "notion-landing.jpg",
    colors: [
      { hex: "#191919", role: "background", percentage: 30 },
      { hex: "#2B2D31", role: "surface", percentage: 20 },
      { hex: "#FFFFFF", role: "text-primary", percentage: 15 },
      { hex: "#2383E2", role: "accent", percentage: 12 },
      { hex: "#9B9B9B", role: "text-secondary", percentage: 8 },
      { hex: "#F5E0B5", role: "highlight", percentage: 8 },
      { hex: "#37352F", role: "card-surface", percentage: 7 },
    ],
    typography: [
      { size: "56px", weight: 700, letterSpacing: "-1.5px", role: "hero" },
      { size: "18px", weight: 400, letterSpacing: "-0.2px", role: "body" },
      { size: "14px", weight: 500, letterSpacing: "0px", role: "button" },
    ],
    layout: {
      type: "single-column centered",
      spacing: { section: "64px", card: "24px", element: "16px" },
      grid: "max-width 1100px, centered hero, embedded product screenshot",
    },
    tokens: {
      colors: {
        "--bg": "#191919",
        "--surface": "#2B2D31",
        "--text": "#FFFFFF",
        "--accent": "#2383E2",
        "--text-muted": "#9B9B9B",
        "--highlight": "#F5E0B5",
      },
      spacing: { "--space-sm": "16px", "--space-md": "24px", "--space-lg": "64px" },
      radius: { "--radius-sm": "6px", "--radius-md": "12px", "--radius-lg": "16px" },
      typography: [
        { role: "hero", size: "56px", weight: 700, letterSpacing: "-1.5px" },
        { role: "body", size: "18px", weight: 400, letterSpacing: "-0.2px" },
        { role: "button", size: "14px", weight: 500, letterSpacing: "0px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:05:00.000Z",
  },
  "stripe-landing": {
    id: "analysis_sample_3",
    imageHash: "sample_stripe_landing",
    fileName: "stripe-landing.jpg",
    colors: [
      { hex: "#F6F9FC", role: "background", percentage: 30 },
      { hex: "#FFFFFF", role: "surface", percentage: 25 },
      { hex: "#635BFF", role: "accent", percentage: 12 },
      { hex: "#0A2540", role: "text-primary", percentage: 12 },
      { hex: "#425466", role: "text-secondary", percentage: 8 },
      { hex: "#FF7A00", role: "gradient-warm", percentage: 5 },
      { hex: "#FF3B6B", role: "gradient-pink", percentage: 5 },
      { hex: "#00D4AA", role: "success", percentage: 3 },
    ],
    typography: [
      { size: "52px", weight: 700, letterSpacing: "-1.2px", role: "hero" },
      { size: "20px", weight: 400, letterSpacing: "-0.2px", role: "body" },
      { size: "15px", weight: 600, letterSpacing: "0px", role: "button" },
      { size: "12px", weight: 500, letterSpacing: "0.5px", role: "label" },
    ],
    layout: {
      type: "single-column centered",
      spacing: { section: "80px", card: "32px", element: "16px" },
      grid: "max-width 1080px, centered hero, logo bar, feature sections",
    },
    tokens: {
      colors: {
        "--bg": "#F6F9FC",
        "--surface": "#FFFFFF",
        "--accent": "#635BFF",
        "--text": "#0A2540",
        "--text-muted": "#425466",
        "--success": "#00D4AA",
      },
      spacing: { "--space-sm": "16px", "--space-md": "32px", "--space-lg": "80px" },
      radius: { "--radius-sm": "6px", "--radius-md": "12px", "--radius-full": "999px" },
      typography: [
        { role: "hero", size: "52px", weight: 700, letterSpacing: "-1.2px" },
        { role: "body", size: "20px", weight: 400, letterSpacing: "-0.2px" },
        { role: "button", size: "15px", weight: 600, letterSpacing: "0px" },
        { role: "label", size: "12px", weight: 500, letterSpacing: "0.5px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:10:00.000Z",
  },
};

const sampleReferences: ReferenceImage[] = [
  {
    id: "ref_sample_1",
    fileName: "fashion-ecommerce.jpg",
    filePath: "/samples/fashion-ecommerce.jpg",
    status: "analyzed",
    analysis: sampleAnalyses["fashion-ecommerce"],
    uploadedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "ref_sample_2",
    fileName: "notion-landing.jpg",
    filePath: "/samples/notion-landing.jpg",
    status: "analyzed",
    analysis: sampleAnalyses["notion-landing"],
    uploadedAt: "2026-03-20T10:05:00.000Z",
  },
  {
    id: "ref_sample_3",
    fileName: "stripe-landing.jpg",
    filePath: "/samples/stripe-landing.jpg",
    status: "analyzed",
    analysis: sampleAnalyses["stripe-landing"],
    uploadedAt: "2026-03-20T10:10:00.000Z",
  },
];

export const SAMPLE_REVIEW_IMAGE = "/samples/linear-review.jpg";

export const SAMPLE_PROJECT: Project = {
  id: "sample",
  name: "Sample Project",
  color: "#6366F1",
  references: sampleReferences,
  createdAt: "2026-03-20T10:00:00.000Z",
};

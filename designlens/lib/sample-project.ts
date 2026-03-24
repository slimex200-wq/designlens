import type { Project, AnalysisResult, ReferenceImage } from "./types";

const sampleAnalyses: Record<string, AnalysisResult> = {
  "dashboard-dark": {
    id: "analysis_sample_1",
    imageHash: "sample_dashboard_dark",
    fileName: "dashboard-dark.svg",
    colors: [
      { hex: "#0F172A", role: "background", percentage: 35 },
      { hex: "#1E293B", role: "surface", percentage: 30 },
      { hex: "#6366F1", role: "accent", percentage: 12 },
      { hex: "#F8FAFC", role: "text-primary", percentage: 8 },
      { hex: "#94A3B8", role: "text-secondary", percentage: 8 },
      { hex: "#22C55E", role: "success", percentage: 4 },
      { hex: "#FBBF24", role: "warning", percentage: 3 },
    ],
    typography: [
      { size: "24px", weight: 700, letterSpacing: "-0.5px", role: "heading" },
      { size: "14px", weight: 500, letterSpacing: "-0.1px", role: "body" },
      { size: "12px", weight: 400, letterSpacing: "0px", role: "caption" },
    ],
    layout: {
      type: "sidebar + content",
      spacing: { section: "20px", card: "16px", element: "8px" },
      grid: "200px sidebar, flexible main with 3-col card grid",
    },
    tokens: {
      colors: {
        "--bg-deep": "#0F172A",
        "--bg-surface": "#1E293B",
        "--accent": "#6366F1",
        "--text-primary": "#F8FAFC",
        "--text-secondary": "#94A3B8",
        "--success": "#22C55E",
        "--warning": "#FBBF24",
      },
      spacing: { "--space-xs": "8px", "--space-sm": "16px", "--space-md": "20px", "--space-lg": "32px" },
      radius: { "--radius-sm": "6px", "--radius-md": "10px" },
      typography: [
        { role: "heading", size: "24px", weight: 700, letterSpacing: "-0.5px" },
        { role: "body", size: "14px", weight: 500, letterSpacing: "-0.1px" },
        { role: "caption", size: "12px", weight: 400, letterSpacing: "0px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  "landing-minimal": {
    id: "analysis_sample_2",
    imageHash: "sample_landing_minimal",
    fileName: "landing-minimal.svg",
    colors: [
      { hex: "#FAFAFA", role: "background", percentage: 40 },
      { hex: "#FFFFFF", role: "surface", percentage: 25 },
      { hex: "#1A1A1A", role: "text-primary", percentage: 15 },
      { hex: "#A3A3A3", role: "text-secondary", percentage: 10 },
      { hex: "#E5E5E5", role: "border", percentage: 5 },
      { hex: "#F5F5F5", role: "muted", percentage: 5 },
    ],
    typography: [
      { size: "48px", weight: 800, letterSpacing: "-2px", role: "hero" },
      { size: "16px", weight: 400, letterSpacing: "-0.2px", role: "body" },
      { size: "14px", weight: 600, letterSpacing: "-0.1px", role: "label" },
    ],
    layout: {
      type: "single-column centered",
      spacing: { section: "80px", card: "24px", element: "12px" },
      grid: "max-width 800px, centered, 3-col feature grid",
    },
    tokens: {
      colors: {
        "--bg": "#FAFAFA",
        "--surface": "#FFFFFF",
        "--text": "#1A1A1A",
        "--text-muted": "#A3A3A3",
        "--border": "#E5E5E5",
      },
      spacing: { "--space-sm": "12px", "--space-md": "24px", "--space-lg": "80px" },
      radius: { "--radius-sm": "6px", "--radius-md": "8px", "--radius-lg": "10px" },
      typography: [
        { role: "hero", size: "48px", weight: 800, letterSpacing: "-2px" },
        { role: "body", size: "16px", weight: 400, letterSpacing: "-0.2px" },
        { role: "label", size: "14px", weight: 600, letterSpacing: "-0.1px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:05:00.000Z",
  },
  "mobile-app": {
    id: "analysis_sample_3",
    imageHash: "sample_mobile_app",
    fileName: "mobile-app.svg",
    colors: [
      { hex: "#F0F4F8", role: "background", percentage: 25 },
      { hex: "#FFFFFF", role: "surface", percentage: 30 },
      { hex: "#4F46E5", role: "accent", percentage: 12 },
      { hex: "#1E293B", role: "text-primary", percentage: 10 },
      { hex: "#94A3B8", role: "text-secondary", percentage: 8 },
      { hex: "#D97706", role: "warning", percentage: 5 },
      { hex: "#16A34A", role: "success", percentage: 5 },
      { hex: "#F1F5F9", role: "muted", percentage: 5 },
    ],
    typography: [
      { size: "18px", weight: 600, letterSpacing: "-0.3px", role: "heading" },
      { size: "14px", weight: 400, letterSpacing: "0px", role: "body" },
      { size: "12px", weight: 500, letterSpacing: "0px", role: "caption" },
    ],
    layout: {
      type: "mobile single-column",
      spacing: { section: "16px", card: "12px", element: "8px" },
      grid: "full-width with 12px padding, 2-col card grid, bottom nav",
    },
    tokens: {
      colors: {
        "--bg": "#F0F4F8",
        "--surface": "#FFFFFF",
        "--accent": "#4F46E5",
        "--text": "#1E293B",
        "--text-muted": "#94A3B8",
        "--warning": "#D97706",
        "--success": "#16A34A",
      },
      spacing: { "--space-xs": "8px", "--space-sm": "12px", "--space-md": "16px" },
      radius: { "--radius-sm": "8px", "--radius-md": "12px", "--radius-lg": "24px" },
      typography: [
        { role: "heading", size: "18px", weight: 600, letterSpacing: "-0.3px" },
        { role: "body", size: "14px", weight: 400, letterSpacing: "0px" },
        { role: "caption", size: "12px", weight: 500, letterSpacing: "0px" },
      ],
    },
    aiAvailable: true,
    createdAt: "2026-03-20T10:10:00.000Z",
  },
};

const sampleReferences: ReferenceImage[] = [
  {
    id: "ref_sample_1",
    fileName: "dashboard-dark.svg",
    filePath: "/samples/dashboard-dark.svg",
    status: "analyzed",
    analysis: sampleAnalyses["dashboard-dark"],
    uploadedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "ref_sample_2",
    fileName: "landing-minimal.svg",
    filePath: "/samples/landing-minimal.svg",
    status: "analyzed",
    analysis: sampleAnalyses["landing-minimal"],
    uploadedAt: "2026-03-20T10:05:00.000Z",
  },
  {
    id: "ref_sample_3",
    fileName: "mobile-app.svg",
    filePath: "/samples/mobile-app.svg",
    status: "analyzed",
    analysis: sampleAnalyses["mobile-app"],
    uploadedAt: "2026-03-20T10:10:00.000Z",
  },
];

export const SAMPLE_REVIEW_IMAGE = "/samples/ui-review-sample.svg";

export const SAMPLE_PROJECT: Project = {
  id: "sample",
  name: "Sample Project",
  color: "#6366F1",
  references: sampleReferences,
  createdAt: "2026-03-20T10:00:00.000Z",
};

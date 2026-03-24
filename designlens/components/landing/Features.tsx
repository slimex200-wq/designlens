import { ScrollReveal } from "@/components/ui/ScrollReveal";

const svgProps = { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const featureIcons: Record<string, React.ReactNode> = {
  analyze: <svg {...svgProps}><circle cx="8.5" cy="8.5" r="5.5" /><line x1="12.5" y1="12.5" x2="17.5" y2="17.5" /></svg>,
  moodboard: <svg {...svgProps}><rect x="2" y="2" width="6.5" height="6.5" rx="1.5" /><rect x="11.5" y="2" width="6.5" height="6.5" rx="1.5" /><rect x="2" y="11.5" width="6.5" height="6.5" rx="1.5" /><rect x="11.5" y="11.5" width="6.5" height="6.5" rx="1.5" /></svg>,
  review: <svg {...svgProps}><path d="M3 10.5l5 5 9-11" /></svg>,
  tokens: <svg {...svgProps}><path d="M6.5 2v16M13.5 2v16" /><path d="M2 7h16M2 13h16" /></svg>,
  compare: <svg {...svgProps}><path d="M10 2v16" /><rect x="2" y="5" width="6" height="10" rx="1" /><rect x="12" y="5" width="6" height="10" rx="1" /></svg>,
  evolving: <svg {...svgProps}><polyline points="2 15 7 7 12 11 18 3" /><polyline points="13 3 18 3 18 8" /></svg>,
};

const features = [
  {
    iconKey: "analyze",
    title: "Reference Analysis",
    desc: "Upload any screenshot. AI extracts colors, typography, spacing, and layout patterns.",
  },
  {
    iconKey: "moodboard",
    title: "Moodboard Builder",
    desc: "Collect references and organize by project. AI finds common patterns across them.",
  },
  {
    iconKey: "review",
    title: "UI Review",
    desc: "Upload your UI and get actionable feedback on hierarchy, consistency, and accessibility.",
  },
  {
    iconKey: "tokens",
    title: "Design Tokens",
    desc: "Export CSS variables, Tailwind config, or JSON tokens directly into your codebase.",
  },
  {
    iconKey: "compare",
    title: "Before & After",
    desc: "Compare your original design with AI-enhanced versions side by side.",
  },
  {
    iconKey: "evolving",
    title: "Self-Evolving",
    desc: "The more you use it, the smarter it gets. Design trends from usage data feed back into the system.",
  },
];

export function Features() {
  return (
    <ScrollReveal>
      <section id="features" className="py-20 md:py-32 px-6 md:px-12 border-t border-border">
        <div className="text-center mb-[72px]">
          <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
            Features
          </div>
          <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-1.8px] leading-[1.1] text-[#F0F2F5]">
            Everything you need to
            <br />
            design with confidence
          </h2>
          <p className="mt-3 text-[15px] text-text-secondary max-w-[400px] mx-auto tracking-[-0.2px]">
            From reference analysis to design tokens, one seamless workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px max-w-[960px] mx-auto bg-border rounded-[14px] overflow-hidden">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-bg-surface px-7 py-9 transition-colors hover:bg-bg-elevated"
            >
              <div className="mb-4 text-text-tertiary">{featureIcons[f.iconKey]}</div>
              <h3 className="text-[15px] font-semibold mb-1.5 tracking-[-0.3px]">
                {f.title}
              </h3>
              <p className="text-[13px] text-text-secondary leading-[1.6] tracking-[-0.1px]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

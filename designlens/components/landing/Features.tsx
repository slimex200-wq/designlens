import { ScrollReveal } from "@/components/ui/ScrollReveal";

const features = [
  {
    icon: "\u2699",
    title: "Reference Analysis",
    desc: "Upload any screenshot. AI extracts colors, typography, spacing, and layout patterns.",
  },
  {
    icon: "\u25A3",
    title: "Moodboard Builder",
    desc: "Collect references and organize by project. AI finds common patterns across them.",
  },
  {
    icon: "\u2713",
    title: "UI Review",
    desc: "Upload your UI and get actionable feedback on hierarchy, consistency, and accessibility.",
  },
  {
    icon: "{ }",
    title: "Design Tokens",
    desc: "Export CSS variables, Tailwind config, or JSON tokens directly into your codebase.",
  },
  {
    icon: "\u2194",
    title: "Before & After",
    desc: "Compare your original design with AI-enhanced versions side by side.",
  },
  {
    icon: "\u21BB",
    title: "Self-Evolving",
    desc: "The more you use it, the smarter it gets. Design trends from usage data feed back into the system.",
  },
];

export function Features() {
  return (
    <ScrollReveal>
      <section id="features" className="py-32 px-12 border-t border-border">
        <div className="text-center mb-[72px]">
          <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
            Features
          </div>
          <h2 className="text-[44px] font-bold tracking-[-1.8px] leading-[1.1] text-[#F0F2F5]">
            Everything you need to
            <br />
            design with confidence
          </h2>
          <p className="mt-3 text-[15px] text-text-secondary max-w-[400px] mx-auto tracking-[-0.2px]">
            From reference analysis to design tokens, one seamless workflow.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-px max-w-[960px] mx-auto bg-border rounded-[14px] overflow-hidden">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-bg-surface px-7 py-9 transition-colors hover:bg-bg-elevated"
            >
              <div className="text-xl mb-4 text-text-tertiary">{f.icon}</div>
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

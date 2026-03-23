import { ScrollReveal } from "@/components/ui/ScrollReveal";

const steps = [
  {
    num: "01",
    title: "Upload References",
    desc: "Drag in screenshots from sites you love. Paste URLs. Build your library.",
  },
  {
    num: "02",
    title: "Auto Analyze",
    desc: "Colors, fonts, spacing, layout patterns extracted and organized automatically.",
  },
  {
    num: "03",
    title: "Build System",
    desc: "Generate a unified design system from multiple references. Export as tokens.",
  },
  {
    num: "04",
    title: "Get Feedback",
    desc: "Upload your UI. AI compares against your system and suggests improvements.",
  },
];

export function Workflow() {
  return (
    <ScrollReveal>
      <section className="py-32 px-12 border-t border-border">
        <div className="max-w-[960px] mx-auto">
          <div className="grid grid-cols-2 gap-16 mb-[72px] items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
                How it works
              </div>
              <h2 className="text-[44px] font-bold tracking-[-1.8px] leading-[1.1] text-[#F0F2F5]">
                From reference
                <br />
                to refined UI
              </h2>
            </div>
            <p className="text-[15px] text-text-secondary leading-[1.7] tracking-[-0.2px]">
              Upload references you love. Build a design system from them. Then let AI review your work against that system.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-px bg-border rounded-[14px] overflow-hidden">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-bg-surface px-6 py-8 transition-colors hover:bg-bg-elevated relative"
              >
                <div className="text-[44px] font-extrabold tracking-[-2px] text-text-tertiary opacity-30 mb-4">
                  {s.num}
                </div>
                <h3 className="text-sm font-semibold mb-1.5 tracking-[-0.2px]">
                  {s.title}
                </h3>
                <p className="text-[12px] text-text-secondary leading-[1.5]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

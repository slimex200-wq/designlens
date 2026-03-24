import { ScrollReveal } from "@/components/ui/ScrollReveal";

const bars = [
  { label: "Dark + single accent", pct: 78 },
  { label: "Sans-serif headlines", pct: 65 },
  { label: "Single-column hero", pct: 52 },
  { label: "Grid card features", pct: 47 },
  { label: "Tight letter-spacing", pct: 41 },
];

const bullets = [
  "Trending color combinations from community data",
  "Popular layout patterns updated in real-time",
  "App UI evolves based on aggregated design trends",
  "Seasonal design trend reports",
];

export function Evolving() {
  return (
    <ScrollReveal>
      <section className="py-20 md:py-32 px-6 md:px-12 border-t border-border">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text */}
          <div>
            <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
              Self-evolving
            </div>
            <h2 className="text-[44px] font-bold tracking-[-1.8px] leading-[1.1] mb-4 text-[#F0F2F5]">
              Gets better
              <br />
              the more you use it
            </h2>
            <p className="text-[15px] text-text-secondary leading-[1.7] mb-6 tracking-[-0.2px]">
              Every reference you analyze, every UI you review — the system learns. Usage data feeds back into design trend insights and UI improvements.
            </p>
            <ul className="flex flex-col gap-3">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="text-[13px] text-text-secondary flex items-center gap-2.5 tracking-[-0.1px]"
                >
                  <span className="w-1 h-1 rounded-full bg-accent shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="bg-bg-surface border border-border rounded-[14px] p-7 flex flex-col gap-4">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-col gap-1">
                <div className="text-[11px] text-text-tertiary flex justify-between">
                  <span>{b.label}</span>
                  <span>{b.pct}%</span>
                </div>
                <div className="h-2 rounded bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-accent to-accent/30"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

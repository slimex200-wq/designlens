"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-8 lg:px-12 pt-[100px] md:pt-[120px] pb-20">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-[12px] text-text-secondary tracking-[-0.2px] mb-10 animate-[fadeIn_0.6s_ease]">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        {t("badge")}
      </div>

      {/* Heading */}
      <h1 className="text-[clamp(32px,7vw,72px)] font-extrabold tracking-[-2.5px] leading-[1.0] mb-5 text-[#F0F2F5] animate-[fadeInUp_0.7s_ease_0.1s_both]">
        {t("headingLine1")}
        <br />
        {t("headingLine2")} <span className="text-accent">{t("headingHighlight")}</span>
      </h1>

      {/* Description */}
      <p className="text-base text-text-secondary max-w-[440px] leading-[1.7] mb-10 tracking-[-0.2px] animate-[fadeInUp_0.7s_ease_0.25s_both]">
        {t("description")}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 animate-[fadeInUp_0.7s_ease_0.4s_both]">
        <Link
          href="/app"
          className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-[#F0F2F5] text-bg-deep hover:opacity-85 hover:-translate-y-px transition-all"
        >
          {t("ctaPrimary")}
        </Link>
        <Link
          href="#features"
          className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-transparent text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all"
        >
          {t("ctaSecondary")}
        </Link>
      </div>

      {/* Product Preview */}
      <div className="mt-16 w-full max-w-[960px] animate-[fadeInUp_0.8s_ease_0.55s_both] hidden md:block">
        <div className="rounded-[14px] overflow-hidden border border-border bg-bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.5),0_0_0_1px_var(--border)]">
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-deep">
            <span className="w-2.5 h-2.5 rounded-full bg-text-tertiary" />
            <span className="w-2.5 h-2.5 rounded-full bg-text-tertiary" />
            <span className="w-2.5 h-2.5 rounded-full bg-text-tertiary" />
            <span className="ml-3 text-[11px] text-text-tertiary bg-bg-surface px-3 py-1 rounded flex-1 text-center">
              {t("browserUrl")}
            </span>
          </div>

          {/* Body */}
          <div className="grid grid-cols-[240px_1fr] min-h-[380px]">
            {/* Sidebar */}
            <div className="border-r border-border p-5 flex flex-col gap-4">
              <div>
                <h5 className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary mb-2.5 font-semibold">
                  {t("previewProject")}
                </h5>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] bg-accent-dim text-accent border border-accent-border">
                  <span className="w-4 h-4 rounded border border-accent-border flex items-center justify-center text-[9px]">
                    &#9670;
                  </span>
                  {t("mySaasRedesign")}
                </div>
              </div>

              <div>
                <h5 className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary mb-2.5 font-semibold">
                  {t("previewReferences")}
                </h5>
                <div className="w-full h-12 rounded-md mb-1.5 border border-border bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
                <div className="w-full h-12 rounded-md mb-1.5 border border-border bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]" />
                <div className="w-full h-12 rounded-md mb-1.5 border border-border bg-gradient-to-br from-[#1a1520] to-[#0f0a15]" />
              </div>

              <div>
                <h5 className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary mb-2.5 font-semibold">
                  {t("previewTools")}
                </h5>
                <SidebarItem icon="&#9881;">Analyze</SidebarItem>
                <SidebarItem icon="&#9635;">Moodboard</SidebarItem>
                <SidebarItem icon="&#10003;">Review</SidebarItem>
                <SidebarItem icon={"{ }"}>Tokens</SidebarItem>
              </div>
            </div>

            {/* Main */}
            <div className="p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold tracking-[-0.3px]">
                  {t("previewTitle")}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-dim text-accent border border-accent-border font-medium">
                  {t("previewBadge")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AnalysisCard title="Colors">
                  <div className="flex gap-1.5 flex-wrap">
                    {["#6366f1", "#0f172a", "#f8fafc", "#1e293b", "#334155"].map((c) => (
                      <div
                        key={c}
                        className="w-7 h-7 rounded-md border border-white/[0.06]"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </AnalysisCard>

                <AnalysisCard title="Typography">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold">{t("previewHeading")}</span>
                      <span className="text-[10px] text-text-tertiary">700 / 18px</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[13px] text-text-secondary">{t("previewBody")}</span>
                      <span className="text-[10px] text-text-tertiary">400 / 13px</span>
                    </div>
                  </div>
                </AnalysisCard>

                <AnalysisCard title="Design Tokens">
                  <div className="flex flex-wrap gap-1">
                    {["--primary: #6366f1", "--bg: #0f172a", "--radius: 8px", "--gap: 16px"].map((tok) => (
                      <span
                        key={tok}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-dim text-accent border border-accent-border"
                      >
                        {tok}
                      </span>
                    ))}
                  </div>
                </AnalysisCard>

                <AnalysisCard title="Spacing">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 rounded-full bg-accent-dim border border-accent-border w-[80%]" />
                    <div className="h-1.5 rounded-full bg-accent-dim border border-accent-border w-[55%]" />
                    <div className="h-1.5 rounded-full bg-accent-dim border border-accent-border w-[35%]" />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-tertiary mt-2">
                    <span>Section: 96px</span>
                    <span>Card: 24px</span>
                    <span>Element: 8px</span>
                  </div>
                </AnalysisCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SidebarItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-text-secondary">
      <span
        className="w-4 h-4 rounded border border-border flex items-center justify-center text-[9px] emoji-text"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      {children}
    </div>
  );
}

function AnalysisCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-deep border border-border rounded-[10px] p-4">
      <h4 className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-3 font-semibold">
        {title}
      </h4>
      {children}
    </div>
  );
}

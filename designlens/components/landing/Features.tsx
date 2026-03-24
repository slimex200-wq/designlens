"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const featureKeys = [
  { icon: "\u2699", titleKey: "referenceAnalysis", descKey: "referenceAnalysisDesc" },
  { icon: "\u25A3", titleKey: "moodboardBuilder", descKey: "moodboardBuilderDesc" },
  { icon: "\u2713", titleKey: "uiReview", descKey: "uiReviewDesc" },
  { icon: "{ }", titleKey: "designTokens", descKey: "designTokensDesc" },
  { icon: "\u2194", titleKey: "beforeAfter", descKey: "beforeAfterDesc" },
  { icon: "\u21BB", titleKey: "selfEvolving", descKey: "selfEvolvingDesc" },
] as const;

export function Features() {
  const t = useTranslations("features");

  return (
    <ScrollReveal>
      <section id="features" className="py-20 md:py-32 px-4 md:px-8 lg:px-12 border-t border-border">
        <div className="text-center mb-12 md:mb-[72px]">
          <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
            {t("sectionLabel")}
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold tracking-[-1.8px] leading-[1.1] text-[#F0F2F5]">
            {t("headingLine1")}
            <br />
            {t("headingLine2")}
          </h2>
          <p className="mt-3 text-[15px] text-text-secondary max-w-[400px] mx-auto tracking-[-0.2px]">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px max-w-[960px] mx-auto bg-border rounded-[14px] overflow-hidden">
          {featureKeys.map((f) => (
            <div
              key={f.titleKey}
              className="bg-bg-surface px-7 py-9 transition-colors hover:bg-bg-elevated"
            >
              <div className="text-xl mb-4 text-text-tertiary emoji-text">{f.icon}</div>
              <h3 className="text-[15px] font-semibold mb-1.5 tracking-[-0.3px]">
                {t(f.titleKey)}
              </h3>
              <p className="text-[13px] text-text-secondary leading-[1.6] tracking-[-0.1px]">
                {t(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const stepKeys = [
  { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
  { num: "04", titleKey: "step4Title", descKey: "step4Desc" },
] as const;

export function Workflow() {
  const t = useTranslations("workflow");

  return (
    <ScrollReveal>
      <section className="py-20 md:py-32 px-4 md:px-8 lg:px-12 border-t border-border">
        <div className="max-w-[960px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-12 md:mb-[72px] items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
                {t("sectionLabel")}
              </div>
              <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold tracking-[-1.8px] leading-[1.1] text-[#F0F2F5]">
                {t("headingLine1")}
                <br />
                {t("headingLine2")}
              </h2>
            </div>
            <p className="text-[15px] text-text-secondary leading-[1.7] tracking-[-0.2px]">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-[14px] overflow-hidden">
            {stepKeys.map((s) => (
              <div
                key={s.num}
                className="bg-bg-surface px-6 py-8 transition-colors hover:bg-bg-elevated relative"
              >
                <div className="text-[44px] font-extrabold tracking-[-2px] text-text-tertiary opacity-30 mb-4">
                  {s.num}
                </div>
                <h3 className="text-sm font-semibold mb-1.5 tracking-[-0.2px]">
                  {t(s.titleKey)}
                </h3>
                <p className="text-[12px] text-text-secondary leading-[1.5]">
                  {t(s.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const barKeys = ["bar1", "bar2", "bar3", "bar4", "bar5"] as const;
const barPcts = [78, 65, 52, 47, 41];
const bulletKeys = ["bullet1", "bullet2", "bullet3", "bullet4"] as const;

export function Evolving() {
  const t = useTranslations("evolving");

  return (
    <ScrollReveal>
      <section className="py-20 md:py-32 px-4 md:px-8 lg:px-12 border-t border-border">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text */}
          <div>
            <div className="text-[11px] uppercase tracking-[2px] text-text-tertiary mb-4 font-semibold">
              {t("sectionLabel")}
            </div>
            <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold tracking-[-1.8px] leading-[1.1] mb-4 text-[#F0F2F5]">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
            </h2>
            <p className="text-[15px] text-text-secondary leading-[1.7] mb-6 tracking-[-0.2px]">
              {t("description")}
            </p>
            <ul className="flex flex-col gap-3">
              {bulletKeys.map((key) => (
                <li
                  key={key}
                  className="text-[13px] text-text-secondary flex items-center gap-2.5 tracking-[-0.1px]"
                >
                  <span className="w-1 h-1 rounded-full bg-accent shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="bg-bg-surface border border-border rounded-[14px] p-7 flex flex-col gap-4">
            {barKeys.map((key, i) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="text-[11px] text-text-tertiary flex justify-between">
                  <span>{t(key)}</span>
                  <span>{barPcts[i]}%</span>
                </div>
                <div className="h-2 rounded bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-accent to-accent/30"
                    style={{ width: `${barPcts[i]}%` }}
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

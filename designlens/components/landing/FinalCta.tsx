"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <ScrollReveal>
      <section className="py-20 md:py-32 lg:py-40 px-4 md:px-8 lg:px-12 text-center border-t border-border">
        <h2 className="text-[32px] md:text-[44px] lg:text-[56px] font-extrabold tracking-[-2.5px] leading-[1.0] mb-4 text-[#F0F2F5]">
          {t("headingLine1")}
          <br />
          {t("headingLine2")}
        </h2>
        <p className="text-[15px] text-text-secondary mb-10">
          {t("description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-[#F0F2F5] text-bg-deep hover:opacity-85 hover:-translate-y-px transition-all"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/app"
            className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-transparent text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </section>
    </ScrollReveal>
  );
}

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/ui/LocaleToggle";

export function Nav() {
  const t = useTranslations("nav");

  const links = [
    { label: t("features"), href: "#features" },
    { label: t("pricing"), href: "#pricing" },
    { label: t("docs"), href: "#docs" },
    { label: t("blog"), href: "#blog" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 lg:px-12 h-16 bg-bg-deep/85 backdrop-blur-xl border-b border-border">
      <span className="text-lg font-bold tracking-[-0.5px] text-text-primary">
        DesignLens
      </span>

      <div className="hidden md:flex gap-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="text-text-secondary text-[13px] font-medium tracking-[-0.2px] hover:text-text-primary transition-colors px-3 py-2.5 min-h-[44px] flex items-center"
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <LocaleToggle />
        <Link
          href="#"
          className="hidden md:flex text-text-secondary text-[13px] font-medium hover:text-text-primary transition-colors px-3 py-2.5 min-h-[44px] items-center"
        >
          {t("logIn")}
        </Link>
        <Link
          href="/app"
          className="bg-text-primary text-bg-deep px-[18px] py-2.5 rounded-md text-[13px] font-semibold hover:opacity-85 transition-opacity min-h-[44px] flex items-center"
        >
          {t("getStarted")}
        </Link>
      </div>
    </nav>
  );
}

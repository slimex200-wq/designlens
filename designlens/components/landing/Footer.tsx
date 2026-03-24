"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const columns = [
  { titleKey: "product", linkKeys: ["features", "pricing", "changelog"] },
  { titleKey: "resources", linkKeys: ["docs", "api", "blog"] },
  { titleKey: "company", linkKeys: ["about", "careers", "contact"] },
  { titleKey: "legal", linkKeys: ["privacy", "terms"] },
] as const;

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-[960px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {columns.map((col) => (
          <div key={col.titleKey}>
            <h4 className="text-[12px] font-semibold mb-3 text-text-secondary">
              {t(col.titleKey)}
            </h4>
            {col.linkKeys.map((key) => (
              <Link
                key={key}
                href="#"
                className="block text-[12px] text-text-tertiary py-1.5 hover:text-text-secondary transition-colors"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

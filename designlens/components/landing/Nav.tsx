"use client";

import Link from "next/link";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Blog", href: "#blog" },
];

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16 bg-bg-deep/85 backdrop-blur-xl border-b border-border">
      <span className="text-lg font-bold tracking-[-0.5px] text-text-primary">
        DesignLens
      </span>

      <div className="flex gap-8">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="text-text-secondary text-[13px] font-medium tracking-[-0.2px] hover:text-text-primary transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="#"
          className="text-text-secondary text-[13px] font-medium hover:text-text-primary transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/app"
          className="bg-text-primary text-bg-deep px-[18px] py-[7px] rounded-md text-[13px] font-semibold hover:opacity-85 transition-opacity"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

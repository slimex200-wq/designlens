import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function FinalCta() {
  return (
    <ScrollReveal>
      <section className="py-40 px-12 text-center border-t border-border">
        <h2 className="text-[56px] font-extrabold tracking-[-2.5px] leading-[1.0] mb-4 text-[#F0F2F5]">
          Stop guessing.
          <br />
          Start designing.
        </h2>
        <p className="text-[15px] text-text-secondary mb-10">
          Free to start. No credit card required.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="#"
            className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-[#F0F2F5] text-bg-deep hover:opacity-85 hover:-translate-y-px transition-all"
          >
            Get Started Free
          </Link>
          <Link
            href="#"
            className="px-7 py-3 rounded-lg text-sm font-semibold tracking-[-0.2px] bg-transparent text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all"
          >
            View Demo
          </Link>
        </div>
      </section>
    </ScrollReveal>
  );
}

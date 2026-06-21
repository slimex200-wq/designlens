"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { ScanSearch, LayoutGrid, ClipboardCheck, Braces, type LucideIcon } from "lucide-react";

export function HelpModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("help");
  const tc = useTranslations("common");

  const tools: Array<{ Icon: LucideIcon; title: string; desc: string }> = [
    { Icon: ScanSearch, title: t("analyzeTitle"), desc: t("analyzeDesc") },
    { Icon: LayoutGrid, title: t("moodboardTitle"), desc: t("moodboardDesc") },
    { Icon: ClipboardCheck, title: t("reviewTitle"), desc: t("reviewDesc") },
    { Icon: Braces, title: t("tokensTitle"), desc: t("tokensDesc") },
  ];

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  const shortcuts: Array<{ key: string; desc: string }> = [
    { key: "Esc", desc: t("shortcutEsc") },
    { key: "Tab", desc: t("shortcutTab") },
  ];

  return (
    <Modal title={t("title")} onClose={onClose} closeLabel={tc("close")}>
      <div className="flex flex-col gap-6">
        <p className="text-[12px] text-text-secondary leading-relaxed">{t("intro")}</p>

        {/* Tools */}
        <section>
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-2.5">
            {t("toolsTitle")}
          </div>
          <div className="flex flex-col gap-3">
            {tools.map((tool) => (
              <div key={tool.title} className="flex gap-3">
                <span className="w-5 flex-shrink-0 mt-0.5 flex justify-center text-accent-text">
                  <tool.Icon size={15} strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[13px] font-medium text-text-primary">{tool.title}</div>
                  <div className="text-[11px] text-text-tertiary leading-relaxed mt-0.5">
                    {tool.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Workflow */}
        <section>
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-2.5">
            {t("workflowTitle")}
          </div>
          <ol className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 items-start text-[12px] text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-bg-elevated border border-border text-[10px] flex items-center justify-center flex-shrink-0 text-text-tertiary font-medium">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-px bg-border" />

        {/* Shortcuts */}
        <section>
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-2.5">
            {t("shortcutsTitle")}
          </div>
          <div className="flex flex-col gap-2">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center gap-3 text-[12px]">
                <kbd className="px-2 h-6 flex items-center rounded border border-border bg-bg-elevated text-[10px] font-mono text-text-secondary flex-shrink-0">
                  {s.key}
                </kbd>
                <span className="text-text-tertiary leading-relaxed">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

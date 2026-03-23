import Link from "next/link";

const columns = [
  { title: "Product", links: ["Features", "Pricing", "Changelog"] },
  { title: "Resources", links: ["Docs", "API", "Blog"] },
  { title: "Company", links: ["About", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="flex justify-between max-w-[960px] mx-auto px-12 py-12">
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-[12px] font-semibold mb-3 text-text-secondary">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link}
                href="#"
                className="block text-[12px] text-text-tertiary mb-1.5 hover:text-text-secondary transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

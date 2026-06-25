import { siteConfig } from "@/config";

export default function NoticeBoard() {
  if (!siteConfig.noticeText) return null;

  return (
    <section id="home" className="pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-accent px-2 py-0.5 rounded bg-accent/10">
            Notice
          </span>
          <div className="overflow-hidden flex-1">
            <p className="text-sm text-text-secondary whitespace-nowrap animate-marquee">
              {siteConfig.noticeText}
            </p>
          </div>
          {siteConfig.noticeLink && (
            <a
              href={siteConfig.noticeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {siteConfig.noticeLinkText || "Learn More"} &rarr;
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

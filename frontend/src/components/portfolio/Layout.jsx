import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "@/components/portfolio/TopBar";
import CommandPalette from "@/components/portfolio/CommandPalette";
import Footer from "@/components/portfolio/Footer";
import { api, endpoints } from "@/lib/api";

/**
 * Layout wraps every page: TopBar (with palette trigger), body, footer.
 * Also mounts the global command palette + a hidden node that exposes the
 * resume URL to the palette (so it can open external without a hook).
 */
export default function Layout({ children }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const { pathname } = useLocation();

  useEffect(() => {
    api.get(endpoints.resume).then((r) => setResumeUrl(r.data.url)).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll to top on route change (except when landing on hash)
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <span id="__resume-url__" data-url={resumeUrl} className="hidden" aria-hidden />
      <TopBar onOpenPalette={() => setPaletteOpen(true)} />
      <main data-testid="page-main">{children}</main>
      <Footer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

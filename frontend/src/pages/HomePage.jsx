import { useState } from "react";
import Layout from "@/components/portfolio/Layout";
import Hero from "@/components/portfolio/Hero";
import SystemStatus from "@/components/portfolio/SystemStatus";
import About from "@/components/portfolio/About";
import Experience from "@/components/portfolio/Experience";
import Projects from "@/components/portfolio/Projects";
import ProjectDetail from "@/components/portfolio/ProjectDetail";
import Skills from "@/components/portfolio/Skills";
import Contact from "@/components/portfolio/Contact";
import Terminal from "@/components/portfolio/Terminal";

export default function HomePage() {
  const [openProject, setOpenProject] = useState(null);

  return (
    <Layout>
      <div data-testid="home-page">
        <Hero />
        <SystemStatus />
        <About />
        <Experience />
        <Projects onOpen={setOpenProject} />
        <Skills />
        <Terminal />
        <Contact />
        <ProjectDetail projectId={openProject} onClose={() => setOpenProject(null)} />
      </div>
    </Layout>
  );
}

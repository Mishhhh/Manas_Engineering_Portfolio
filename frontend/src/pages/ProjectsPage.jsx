import { useState } from "react";
import Layout from "@/components/portfolio/Layout";
import Projects from "@/components/portfolio/Projects";
import ProjectDetail from "@/components/portfolio/ProjectDetail";

export default function ProjectsPage() {
  const [openProject, setOpenProject] = useState(null);
  return (
    <Layout>
      <div data-testid="projects-page">
        <Projects onOpen={setOpenProject} />
        <ProjectDetail projectId={openProject} onClose={() => setOpenProject(null)} />
      </div>
    </Layout>
  );
}

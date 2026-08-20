import Layout from "@/components/portfolio/Layout";
import Resume from "@/components/portfolio/Resume";

export default function ResumePage() {
  return (
    <Layout>
      <div data-testid="resume-page">
        <Resume />
      </div>
    </Layout>
  );
}

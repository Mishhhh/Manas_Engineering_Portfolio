import Layout from "@/components/portfolio/Layout";
import PaymentSimulator from "@/components/labs/PaymentSimulator";

export default function PaymentSimulatorPage() {
  return (
    <Layout>
      <div data-testid="payment-simulator-page">
        <PaymentSimulator />
      </div>
    </Layout>
  );
}

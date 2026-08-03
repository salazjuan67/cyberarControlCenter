import { Header } from "@/components/layout/Header";
import { NewsletterPanel } from "@/components/newsletter/NewsletterPanel";

export default function NewsletterPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Newsletter"
        subtitle="Envío de actualizaciones por email vía Resend"
        badge="Comunicaciones"
      />
      <div className="p-4 md:p-6 max-w-6xl">
        <NewsletterPanel />
      </div>
    </div>
  );
}

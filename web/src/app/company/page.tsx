import { TercioFormationView } from "@/components/company/tercio-formation-view";
import { PageTransition } from "@/components/game/page-transition";

export const metadata = {
  title: "Tercio · Formacion | Tercio: Sangre y Acero",
};

export default function CompanyPage() {
  return (
    <PageTransition>
      <TercioFormationView />
    </PageTransition>
  );
}

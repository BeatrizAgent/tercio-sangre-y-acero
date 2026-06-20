import { StubComingSoon } from "@/components/ui/stub-coming-soon";

export default function CityChurchPage() {
  return (
    <StubComingSoon
      title="Iglesia de la ciudad"
      description="La iglesia de la ciudad redirige hoy al capellan del campamento. Esta vista dedicada se habilitara mas adelante."
      icon="cityChurch"
      backHref="/church"
      backLabel="Volver al capellan"
    />
  );
}

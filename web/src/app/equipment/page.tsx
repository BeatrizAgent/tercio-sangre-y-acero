import { StubComingSoon } from "@/components/ui/stub-coming-soon";

export default function EquipmentPage() {
  return (
    <StubComingSoon
      title="Equipo"
      description="El equipo del soldado se administra hoy desde el maniqui en la hoja de servicio. Esta vista dedicada estara disponible en una iteracion futura."
      icon="armory"
      backHref="/soldier"
      backLabel="Volver a la hoja de servicio"
    />
  );
}

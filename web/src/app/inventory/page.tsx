import { StubComingSoon } from "@/components/ui/stub-coming-soon";

export default function InventoryPage() {
  return (
    <StubComingSoon
      title="Inventario"
      description="El inventario del soldado vive hoy dentro de la hoja de servicio. Esta vista independiente se habilitara en una iteracion futura."
      icon="inventory"
      backHref="/soldier"
      backLabel="Volver a la hoja de servicio"
    />
  );
}

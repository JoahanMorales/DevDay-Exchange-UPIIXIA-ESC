import { Link } from "react-router-dom";
import { Button, PageHeader, PageLayout, Surface } from "../../lib/ui";

/** Unknown URL inside the shell: say what happened and give the way back. */
export function NotFound() {
  return (
    <PageLayout recipe="flow">
      <PageHeader title="No encontramos esta página" context={location.pathname} />
      <Surface>
        <p className="mb-5 text-lg">La dirección no existe o cambió. Vuelve al inicio o abre una de las vistas del menú.</p>
        <Link to="/">
          <Button size="lg">Ir al inicio</Button>
        </Link>
      </Surface>
    </PageLayout>
  );
}

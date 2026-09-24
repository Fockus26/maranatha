import { PROJECTS } from "@/lib/projectsData";
import { getRaisedRecord, withRaised } from "@/lib/projectsRaised";
import { ProyectosClient } from "./ProyectosClient";

/**
 * `/proyectos`: la parte interactiva (tabs, vista lista/grilla) vive en
 * `ProyectosClient`; acá, en el servidor, se le suma a cada proyecto lo
 * recaudado con pagos confirmados.
 */
export default async function ProyectosPage() {
  const raised = await getRaisedRecord();
  return (
    <ProyectosClient projects={PROJECTS.map((p) => withRaised(p, raised))} />
  );
}

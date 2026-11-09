/**
 * Lista de correos con acceso al dashboard (`ADMIN_EMAILS`, separados por
 * comas). Tener cuenta no alcanza: el correo tiene que estar aquí.
 */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().has(String(email).toLowerCase());
}

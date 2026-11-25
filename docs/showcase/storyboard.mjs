// Tráiler del portafolio (skill project-showcase). Una escena continua de 8–12 s que
// termina donde empieza: la home, el formulario de diezmo (monto y frecuencia) y de vuelta.
// Se graba contra `qa:local` (base local, cuentas de pago ficticias), nunca contra producción.
export const start = "/";

// No se graba: oculta el indicador de desarrollo de Next y pausa el carrusel del hero
// (cambia cada 6 s) para que el último cuadro sea igual al primero.
export async function setup(page) {
  await page.addInitScript(() => {
    // El script corre antes de que exista <html>: el estilo espera al documento.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    });
    const timer = setInterval(() => {
      const pause = document.querySelector(
        'button[aria-label="Pausar cambio automático de destacados"]',
      );
      if (pause) pause.click();
      else if (document.querySelector('button[aria-label^="Reanudar"]'))
        clearInterval(timer);
    }, 150);
  });
}

export async function scene(page, h) {
  await h.pause(1500);
  await page.getByRole("button", { name: "Ofrendar" }).first().click();
  await h.pause(1600);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^Monto 50/ }).click();
  await h.pause(1400);
  await dialog.getByText("Mensual", { exact: true }).click();
  await h.pause(1600);
  await page.keyboard.press("Escape");
  // El foco vuelve a "Ofrendar": se suelta para que el anillo no rompa el bucle.
  await page.evaluate(() => document.activeElement?.blur());
  await h.pause(1800);
}

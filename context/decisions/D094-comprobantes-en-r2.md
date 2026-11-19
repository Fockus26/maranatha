# D094 · Backend · Comprobantes de pago en un bucket privado de Cloudflare R2, uno por entorno · Implementado (sin claves aún)

**Decisión:** los comprobantes (JPG, PNG, WebP, PDF, ≤ 4 MB) se guardan en **Cloudflare R2** (API S3) en vez de la
tabla `payment_receipts` de D082. Un bucket privado por entorno (producción y preview), con un token de R2 limitado a
"Object Read & Write" sobre ese bucket. `lib/payments/receipts.ts` firma las peticiones con `aws4fetch` (2.5 kB, sin el
SDK de AWS) y mantiene la misma interfaz: `uploadReceipt`, `getReceipt`, `deleteReceipt`. El panel los sigue sirviendo
por `/dashboard/comprobantes/[id]` tras verificar al admin: el bucket nunca es público ni se firma una URL para el
navegador, y al leer se vuelve a validar el tipo por los bytes.
- **Sin `R2_*`** (QA local, desarrollo) se usa la tabla, como antes: `qa:local` no necesita una cuenta de Cloudflare.
- **Lectura con respaldo:** si R2 devuelve 404, se busca en la tabla. Cubre los subidos antes del cambio hasta que
  `scripts/receipts-to-r2.ts --copy` los mueva (verifica el md5 de cada uno; `--delete-rows` los borra de la tabla).
- **La tabla se queda** por ahora: quitarla (y el respaldo) es una migración aparte cuando la tabla esté vacía en
  producción.

**Por qué:** César (2026-11-19) prefiere los archivos en un bucket y no dentro de la base. R2 porque ya administra
`fockus.dev` en Cloudflare, no cobra la salida y su capa gratis (10 GB) sobra para decenas de comprobantes al mes.

**Cambia respecto de D082:** los comprobantes salen del respaldo nocturno de `kit-db` (`b2:kit-backup`). R2 replica los
objetos dentro de Cloudflare; si se quiere una copia fuera, es una tarea aparte (p. ej. `rclone` nocturno al mismo
Backblaze).

**Alternativas descartadas:** Backblaze B2 (ya existe la cuenta, pero la descarga tiene cuota y mezcla los respaldos con
datos vivos), disco del VPS (fuera del respaldo y Vercel, el respaldo, no lo ve), el SDK de AWS (`@aws-sdk/client-s3`,
mucho más peso para cuatro llamadas).

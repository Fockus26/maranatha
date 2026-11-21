# D136 · Componentes · Pagos y agenda del panel: diálogos de `dialog`, avisos con `toast()` y campos con `Field` · Implementado

**Decisión:**
- `DashboardPayments`: los diálogos de rechazo y de tasas pasan a `Dialog` de shadcn (444 y 600 px, el `xs`/`sm` de MUI; relleno de la primitiva, como `ConfirmDialog`), abiertos sin `DialogTrigger` → guardan y devuelven el foco (D129). Con `pending` no se cierran (Escape ni clic fuera) y los botones quedan deshabilitados: el doble clic sigue bloqueado. Las Server Actions (`approvePayment`, `rejectPayment`, `saveFallbackRates`, `getReceiptLink`) y cuándo se llaman no cambian.
- `Snackbar` + `Alert filled` → `toast.success` / `toast.error` de sonner (5 s, el `Toaster` de `app/layout.tsx`), en pagos y agenda. El `Alert` de error de carga → `Alert severity="error"`.
- `TextField` → `Field` + `Input`/`Textarea` (alto 40 px de la primitiva; el MUI pequeño medía 37,1 px; etiqueta fija encima en lugar de flotante). Agenda: `RadioGroup` de la primitiva con nombre (`aria-labelledby` a la leyenda "Tipo de evento"), `TextField select` → `Select` dentro de `Field`.
- Botones: "Tasas de cambio" y "Ver comprobante" `variant="action"`; Rechazar con `color="error"` (outlined en la fila, contained en el diálogo) y Cancelar/Cerrar/Anterior con `variant="text" color="inherit"` (API de D139). `ConfirmDialog` destructivo pasa también a `color="error"`. Cada botón de fila conserva su `aria-label`.

**Por qué:** cierra la migración del panel de datos; solo quedan para la ola 5 las piezas compartidas de MUI (tema, `fieldStyles`, `outlinedActionSx`), que ya no importa ningún archivo del panel.
**Alternativa descartada:** conservar el relleno de 14 px de los diálogos de MUI: los dos diálogos se abren junto a `ConfirmDialog` (ya en la primitiva, 28 px) y se verían distintos entre sí.

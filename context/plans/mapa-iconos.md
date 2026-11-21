# Mapa de íconos MUI → lucide-react (y tipografía MUI → clases) — ola 2 (W4, D121)

> Hecho sobre `origin/main` @ dd080a4 con `lucide-react` 1.77.0. Cada nombre lucide se comprobó contra
> el paquete instalado (`import * as L from "lucide-react"`). 63 íconos distintos de
> `@mui/icons-material` en `app/` y `components/` (`git grep -h "@mui/icons-material/" -- app components`).

## Reglas

- Import: `import { X } from "lucide-react"` (nombre en PascalCase, tal cual la tabla).
- **Lucide ≥ 1.0 no trae logos de marca**: Instagram y YouTube salen de `components/ui/brand-icons.tsx`
  (`InstagramIcon`, `YoutubeIcon`; mismos trazos que MUI, MIT).
- Todo ícono decorativo lleva `aria-hidden` (lucide ya lo pone solo si no hay `aria-label` ni hijos; escríbelo
  igual en los compuestos). El nombre accesible lo lleva el botón o el enlace.
- Lucide es de **trazo** (outline, 2 px en 24); los `*Rounded` de MUI son **rellenos**. Donde el ícono MUI es
  sólido y la forma importa (corazón, burbuja, carpeta), la columna "Nota" dice si se rellena con
  `fill-current`.
- Un ícono dentro de un botón (`button.tsx`) no necesita clase de tamaño de más: pon `size-*` según la tabla.
- Con `shrink-0` cuando va en una fila flex.

## Tamaños

El `fontSize` de MUI se vuelve `size-*` (el espaciado de Tailwind es 4 px por unidad: `size-5` = 20 px).

| MUI | px | clase |
|---|---|---|
| `fontSize="small"` (35 usos) | 20 | `size-5` |
| `fontSize="medium"` (por defecto) | 24 | `size-6` |
| `fontSize="large"` (0 usos) | 35 | no se usa |
| `fontSize="inherit"` (2 usos) | 1em | el `size-*` que iguale al texto que acompaña (p. ej. `size-4` junto a `text-16`) |
| `sx={{ fontSize: fontScale[11] }}` | 11 | `size-2.75` |
| `fontScale[12]` (9 usos) | 12 | `size-3` |
| `fontScale[13]` (14 usos) | 13 | `size-3.25` |
| `fontScale[14]` / `typography.size.small` | 14 | `size-3.5` |
| `fontScale[15]` | 15 | `size-3.75` |
| `fontScale[16]` / `typography.size.body` | 16 | `size-4` |
| `fontScale[18]` / `sx={{ fontSize: 18 }}` | 18 | `size-4.5` |
| `fontScale[20]` | 20 | `size-5` |
| `sx={{ fontSize: 40 }}` / `fontScale[40]` | 40 | `size-10` |
| `fontScale[56]` | 56 | `size-14` |

Un `sx` con más cosas (`color`, `mb`, `ml: "auto"`, `flexShrink: 0`) se reparte: color → `text-*`, márgenes →
`mb-*`/`ml-auto`, `flexShrink: 0` → `shrink-0`.

**Trampa mientras MUI conviva:** un ícono de `@mui/icons-material` que recibe `className` (p. ej. el que
`EmptyState` recibe por la prop `icon`) conserva su `font-size` de Emotion (sin capa), que le gana a `size-*`:
el compuesto lo fija con `size-*!` (importante). Un ícono lucide dentro de un componente ya migrado no lo
necesita.

## Mapa

| MUI (`@mui/icons-material/…`) | lucide | Usos | Nota |
|---|---|---|---|
| `CloseRounded` | `X` | 8 | |
| `Instagram` | `InstagramIcon` (`components/ui/brand-icons`) | 5 | lucide 1.x no trae marcas; mismo trazo que MUI |
| `YouTube` | `YoutubeIcon` (`components/ui/brand-icons`) | 2 | ídem |
| `OpenInNewRounded` | `ExternalLink` | 4 | |
| `AddRounded` | `Plus` | 4 | |
| `MenuRounded` | `Menu` | 3 | |
| `FolderRounded` | `Folder` | 3 | MUI sólido → trazo; `fill-current` si se quiere sólido |
| `DeleteOutlineRounded` | `Trash2` | 3 | |
| `ChevronRightRounded` | `ChevronRight` | 3 | |
| `ChevronLeftRounded` | `ChevronLeft` | 3 | |
| `CheckRounded` | `Check` | 3 | |
| `VolunteerActivismRounded` | `HandHeart` | 2 | mano con corazón, igual concepto |
| `SearchOffRounded` | `SearchX` | 2 | |
| `ScheduleRounded` | `Clock` | 2 | |
| `PlayArrowRounded` | `Play` | 2 | MUI sólido; `fill-current` para igualarlo |
| `LogoutRounded` | `LogOut` | 2 | |
| `HomeRounded` | `House` | 2 | `Home` también existe como alias |
| `FavoriteBorderRounded` | `Heart` | 2 | contorno = igual |
| `EventBusyRounded` | `CalendarX` | 2 | |
| `EditRounded` | `Pencil` | 2 | |
| `ContentCopyRounded` | `Copy` | 2 | |
| `AttachFileRounded` | `Paperclip` | 2 | |
| `ArrowBackRounded` | `ArrowLeft` | 2 | |
| `WifiOffRounded` | `WifiOff` | 1 | |
| `WarningAmberRounded` | `TriangleAlert` | 1 | |
| `VisibilityRounded` | `Eye` | 1 | |
| `VisibilityOffRounded` | `EyeOff` | 1 | |
| `ViewListRounded` | `List` | 1 | |
| `VerifiedUserRounded` | `ShieldCheck` | 1 | |
| `UndoRounded` | `Undo2` | 1 | |
| `SpaceDashboardRounded` | `LayoutDashboard` | 1 | |
| `ShieldRounded` | `Shield` | 1 | MUI sólido; `fill-current` si se quiere sólido |
| `SelfImprovementRounded` | `PersonStanding` | 1 | **cambia de forma**: no hay persona meditando en lucide (`ServiceAreas`) |
| `SearchRounded` | `Search` | 1 | |
| `RefreshRounded` | `RefreshCw` | 1 | |
| `ReceiptLongRounded` | `ReceiptText` | 1 | |
| `PlayCircleRounded` | `CirclePlay` | 1 | MUI sólido; el trazo cambia de peso |
| `PeopleRounded` | `Users` | 1 | |
| `PaymentsRounded` | `Banknote` | 1 | existe (también `HandCoins`) |
| `PauseRounded` | `Pause` | 1 | MUI sólido; `fill-current` para igualarlo |
| `LightModeRounded` | `Sun` | 1 | W1 (`ThemeToggle`) |
| `DarkModeRounded` | `Moon` | 1 | W1 (`ThemeToggle`) |
| `ImageRounded` | `Image` | 1 | |
| `HourglassEmptyRounded` | `Hourglass` | 1 | |
| `GroupsRounded` | `UsersRound` | 1 | |
| `GridViewRounded` | `LayoutGrid` | 1 | |
| `FavoriteRounded` | `Heart` | 1 | **`fill-current`** (MUI sólido) |
| `ExploreRounded` | `Compass` | 1 | |
| `ExpandMoreRounded` | `ChevronDown` | 1 | |
| `EventRounded` | `Calendar` | 1 | |
| `ErrorOutlineRounded` | `CircleAlert` | 1 | |
| `CurrencyExchangeRounded` | `ArrowLeftRight` | 1 | cambia de forma (MUI: moneda con flechas); sin equivalente exacto |
| `CollectionsRounded` | `Images` | 1 | |
| `ChildCareRounded` | `Baby` | 1 | |
| `CheckCircleOutlineRounded` | `CircleCheck` | 1 | |
| `ChatBubbleRounded` | `MessageCircle` | 1 | MUI sólido; `fill-current` para igualarlo |
| `ChatBubbleOutlineRounded` | `MessageCircle` | 1 | contorno = igual |
| `CalendarMonthRounded` | `CalendarDays` | 1 | `DateField` (W2) |
| `BuildRounded` | `Wrench` | 1 | |
| `ArrowForwardRounded` | `ArrowRight` | 1 | |

Íconos que **no** están en el mapa porque ya no hay equivalente MUI en uso, pero que la fase necesita: `Calendar`,
`ChevronLeft`, `ChevronRight`, `Clock` (selectores de `DateField`/`TimeField`, W2); `X` (cierre de dialog, W3);
`Check`, `Circle` (radio/select, W2); `CircleAlert`/`CircleCheck`/`Info`/`TriangleAlert` (alert, W3; `Info` existe).

## Tipografía: `Typography variant` de MUI → clases

Valores de `theme/theme.ts` (`getTypographyOptions`) y de `app/tokens.css`. Un `Typography` sin `variant`
es `body1`; sin `component` renderiza la etiqueta de la fila. Las familias son `font-heading` (Sora) y
`font-body` (Inter); el color por defecto del texto es `text-foreground` (`text.primary`) y el secundario
`text-muted-foreground` (`text.secondary`).

| `variant` (etiqueta) | clases | Notas |
|---|---|---|
| `h1` (`h1`) | `font-heading font-extrabold text-h1 leading-h1` | 36 px móvil, 60 desde 600, 72 desde 1920 (`text-h1` ya trae los tres) |
| `h2` (`h2`) | `font-heading font-bold text-h2 leading-h2` | 28 / 44 / 52 |
| `h3` (`h3`) | `font-heading font-semibold text-h3 leading-h3` | 22 / 30 / 36 |
| `h4` (`h4`) | `font-heading font-semibold text-h4 leading-h4` | 18 / 22 / 26 |
| `h5` (`h5`) | `font-body font-normal text-24 leading-h4` | sin personalizar en el tema (por defecto MUI: 24 px, 400, interlineado 1,334; `leading-h4` = 1,25, el más cercano); 0 usos |
| `h6` (`h6`) | `font-body font-medium text-20 leading-body` | por defecto MUI (20 px, 500; interlineado 1,6); 0 usos |
| `subtitle1` (`h6`) | `font-body font-normal text-16 leading-body` | por defecto MUI; 0 usos |
| `subtitle2` (`h6`) | `font-body font-medium text-14 leading-small` | por defecto MUI; 0 usos |
| `body1` (`p`) | `font-body font-normal text-body-lg leading-body` | 18 px (20 desde 1920) |
| `body2` (`p`) | `font-body font-normal text-body leading-body` | 16 px (18 desde 1920) |
| `caption` (`span`) | `font-body font-normal text-small leading-small` | 14 px |
| `overline` (`span`) | `font-body font-normal text-12 uppercase leading-small` | por defecto MUI (12 px, mayúsculas, interlineado 2,66, tracking 0,083em); 0 usos |
| `button` | ya está en `button.tsx` | 14 px, 500, sin mayúsculas |

- **Tracking:** MUI deja `letter-spacing` en h1 (−0,01562em), h2 (−0,00833em), h4 (0,00735em) y los
  subtítulos por defecto; el sitio casi no usa `variant`, así que **no se traduce** (diferencia menor: −0,9 px a
  60 px en h1). Si una zona usa `variant="h1"` y se nota, es un token que falta (`tracking-*`).
- `sx={{ fontSize: fontScale[n] }}` → `text-n` (`text-13`, `text-10.5`…); `fontWeight` → `font-*`;
  `fontFamily: typography.fontFamily.heading` → `font-heading`; `lineHeight: 1.6` → `leading-body`.
- Los `Typography` de las zonas pasan casi siempre `sx` con tamaño propio: en ese caso solo se traduce el `sx`
  (el `variant` y su tamaño ya los pisaba).
- Falta una combinación repetida: **ninguna**; no se añadió `@utility` de texto en `globals.css`.

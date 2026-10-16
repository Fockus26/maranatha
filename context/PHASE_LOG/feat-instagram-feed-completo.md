# feat/instagram-feed-completo

**Qué:** feed de Behold aprovechado completo — srcset 400–2000 px (antes 400 px fijo), visor
`InstagramPostDialog` (carrusel completo, reels reproducibles con fallback a Instagram,
likes/comentarios, fecha, hashtags), color dominante como placeholder, foto de perfil y
seguidores en el panel de cuenta. Like/comentar: imposible vía Behold → botón a Instagram.

**Verificado:** tests unitarios (`tests/unit/instagram.test.ts`), typecheck, biome de los
archivos tocados, build, normalización contra los feeds reales de Maranatha y JEF.

**No verificado:** render en navegador / capturas / axe — no había servidor de Maranatha
corriendo (el de :3000 es otro proyecto) y levantarlo lo autoriza César.

**Pendiente:** `BEHOLD_FEED_EVANGELIO`; cargar las 3 env vars en Vercel y VPS.

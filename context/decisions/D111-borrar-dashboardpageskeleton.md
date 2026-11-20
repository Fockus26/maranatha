# D111 · Componentes · Se borra `DashboardPageSkeleton.tsx` (sin uso desde D102) · Implementado

**Decisión:** `components/ui/DashboardPageSkeleton.tsx` se borra en la ola 1 de la migración a shadcn. Corrige la parte de D102 que decía "ahora sin uso, no se borra".
**Por qué:** César lo pidió al planear la fase (2026-11-20): `git grep DashboardPageSkeleton` solo daba el propio archivo y migrarlo a shadcn era trabajo sin destino.

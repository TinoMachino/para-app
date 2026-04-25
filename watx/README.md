# Veintiuno MVP

Veintiuno es una aplicación PARA construida sobre atproto/Bluesky para validar participación cívica digital. Este repositorio contiene la base técnica del backend y las lexicons necesarias para operar el MVP sobre PDS, AppView y clientes compatibles.

El estado actual es **MVP para validación controlada**: hay funcionalidad base lista para pruebas internas y pilotos acotados, pero no debe tratarse como un producto cívico completo ni como una plataforma de participación oficial de extremo a extremo.

La regla de producto para este MVP es clara: **no removeremos nada de la interfaz de usuario**. Si una superficie aparece en el cliente pero no pertenece al MVP, se debe limitar la funcionalidad: bloquear acciones incompletas, usar estados deshabilitados, mostrar datos en modo lectura o marcarla como pendiente. La UI puede anticipar el producto futuro, pero el backend y la operación deben prometer solo lo que está listo para validación.

## Alcance del MVP

### PARA base social

Incluido en el MVP:

- Posts PARA y lectura de contenido indexado.
- Timeline, author feed, thread y consulta por lista de posts.
- Metadata social de posts PARA.
- Estadísticas básicas de perfil PARA.
- Compatibilidad con reglas existentes de visibilidad, bloqueos y mutes donde ya están conectadas.

No incluido como promesa de MVP:

- Recomendación avanzada.
- Moderación cívica especializada más allá de las reglas ya conectadas.
- Métricas públicas definitivas o dashboards de impacto.

### Perfiles y comunidades

Incluido en el MVP:

- Perfiles con agregados PARA disponibles en AppView.
- Boards/comunidades en modo básico.
- Governance visible principalmente como estado de lectura y resumen.
- Modelo actual de figura pública/validación manual donde ya esté soportado.

Limitado en el MVP:

- Administración completa de comunidades.
- Invitaciones, membresía granular y permisos avanzados.
- Flujos institucionales completos.
- Auditoría formal de gobernanza.

### Cabildeo

Incluido en el MVP:

- Crear y leer records de Cabildeo desde PDS cuando las lexicons lo permiten.
- Listar y ver Cabildeos indexados desde AppView.
- Listar posiciones de un Cabildeo.
- Agregados de posiciones, votos, delegaciones y contexto del viewer.
- Ranking estable con paginación por cursor.
- Votos y delegación vía records, con lectura agregada en AppView.

Limitado en el MVP:

- El ciclo completo propuesta -> deliberación -> votación -> resolución -> publicación oficial todavía no es una garantía de producto.
- La operación debe validar manualmente comunidades, roles y datos semilla para pruebas controladas.
- Las acciones que el cliente muestre pero que no tengan ruta completa deben quedar bloqueadas o claramente pendientes.

### Cabildeo live

Incluido en el MVP:

- Presencia live para Cabildeos elegibles.
- Host con live status externo activo.
- Participantes que se unen a una sesión activa.
- Expiración de presencia por TTL.
- Ranking boost para Cabildeos live activos.
- Preview de participantes con filtrado por visibilidad/bloqueos.
- Hidratación de perfil con `cabildeoLive` cuando aplica.

Limitado en el MVP:

- Live significa presencia y enlace externo, no streaming nativo.
- No hay grabaciones, chat live dedicado, moderación live en tiempo real ni notificaciones live avanzadas como promesa de MVP.
- La experiencia debe tolerar que `cabildeoLive` no exista y que `participantPreviewDids.length` no sea igual a `activeParticipantCount`.

## Funcionalidad visible pero limitada en MVP

Estas superficies pueden seguir apareciendo en la interfaz, pero no deben presentarse como listas para producción completa:

- Acciones avanzadas de comunidad, creación/administración completa de boards, invitaciones y membresía granular.
- Governance avanzado, roles institucionales, auditoría formal y permisos administrativos completos.
- Discourse intelligence, sentiment y topics como lectura, demo o datos derivados, no como análisis cívico final.
- Highlights/anotaciones como superficie experimental si el cliente las muestra.
- Live como presencia/enlace externo, no como plataforma de transmisión.
- Métricas públicas, dashboards y reportes como exploración futura.

La implementación de cliente debe preferir estados explícitos: disabled, read-only, coming soon, pendiente de validación o requiere rol. No se debe esconder la dirección de producto, pero tampoco permitir acciones sin contrato backend y operativo claro.

## Plan futuro, no MVP

- Verificación INE y pruebas de elegibilidad con zero-knowledge.
- Gobernanza avanzada con roles institucionales, auditoría formal y flujos administrativos completos.
- Ciclo completo de Cabildeo: propuesta, deliberación, votación, resolución y publicación oficial.
- Streaming nativo, grabaciones, notificaciones live avanzadas y moderación live en tiempo real.
- Analítica/discurso avanzado, resúmenes, sentimiento y recomendaciones como producto confiable.
- Escalamiento multi-comunidad/regional.
- Métricas públicas, dashboards y reportes de impacto.
- Experiencias de cliente más guiadas para usuarios, moderadores, comunidades e instituciones.

## Base técnica

Este repositorio deriva de la implementación TypeScript de AT Protocol y del backend `app.bsky`. Veintiuno usa esa base para agregar lexicons y rutas PARA.

Servicios principales:

- `pds`: Personal Data Server para hospedar repos de cuentas atproto.
- `bsky`: AppView para servir APIs `app.bsky.*` y vistas PARA indexadas.
- Lexicons: esquemas `com.para.*` y extensiones relacionadas bajo `lexicons/`.
- Data-plane: consultas e índices que alimentan feeds, perfiles, Cabildeos, comunidades, highlights y discourse.

Paquetes importantes:

- `packages/pds`: validación, escritura y lectura de records.
- `packages/bsky`: APIs AppView, hidratación, vistas y data-plane.
- `packages/api`: cliente TypeScript generado.
- `packages/dev-infra`: servicios Docker para pruebas locales.

## Desarrollo local

Requisitos:

- Node 22, usando `.nvmrc`.
- `pnpm`.
- Docker para pruebas que usan Postgres y Redis.
- `jq` para algunos comandos del entorno de desarrollo.

Comandos útiles:

```shell
nvm use
pnpm install

pnpm --filter @atproto/bsky test -- tests/views/para-feed.test.ts
pnpm --filter @atproto/bsky test -- tests/data-plane/para-queries.test.ts
pnpm --filter @atproto/bsky exec tsc --build tsconfig.build.json

make run-dev-env
```

Para pruebas de integración PDS/PARA, usar el set enfocado de read-after-write antes de considerar un release candidate.

## Notas operativas

- El MVP debe proteger comportamiento PARA ya existente; no hacer cambios amplios en feed, perfiles, governance o PDS sin pruebas enfocadas.
- Las lexicons y clientes generados solo se deben regenerar cuando el cambio lo requiera explícitamente.
- Las superficies no MVP deben mantenerse visibles solo si tienen estado limitado claro.
- Producción requiere validación manual del flujo completo y rollback documentado.

## Licencia

Este proyecto conserva la licencia dual MIT y Apache 2.0 heredada de la base atproto:

- MIT License (`LICENSE-MIT.txt`)
- Apache License, Version 2.0 (`LICENSE-APACHE.txt`)

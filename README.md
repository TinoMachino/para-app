# Veintiuno

**Empoderando la participación cívica digital sobre AT Protocol.**

Veintiuno es una plataforma de gobernanza comunitaria y participación cívica construida sobre la base técnica de [atproto](https://atproto.com/). Este repositorio contiene el AppView, el Data-plane y los Lexicons necesarios para habilitar mecanismos de democracia directa y deliberativa de manera descentralizada.

---

## 🌟 Misión
Nuestra misión es validar y escalar la participación cívica digital mediante herramientas que garanticen la integridad del voto, la transparencia en la gobernanza y la soberanía de los datos de los ciudadanos.

## 🚀 Estado del Proyecto: Hardened MVP
Actualmente nos encontramos en una fase de **MVP Fortalecido (Hardened)**. El sistema ha sido optimizado para el rendimiento y la seguridad de tipos, permitiendo validaciones controladas con una base técnica robusta.

### Logros Recientes:
- **Optimización SQL**: Filtrado de comunidades y gobernanza a nivel de base de datos (eliminando filtrado costoso en memoria).
- **Integridad del Voto**: Implementación de reglas de elegibilidad y protecciones anti-fraude en el indexador.
- **Seguridad de Tipos**: Cobertura completa de tipos en el core del AppView (Zero-Error Build).

---

## 📖 Documentación

- **[Roadmap](ROADMAP.md)**: Conoce nuestras fases de desarrollo hacia la producción masiva.
- **[Guía de Contribución](CONTRIBUTING.md)**: ¿Quieres ayudar? Lee esto primero.
- **[Dev Ops & Infra](PARA_BACKEND_DEVOPS.md)**: Guía para administradores de sistemas.

---

## 🛠️ Alcance Funcional

### 1. Gobernanza Comunitaria
- Boards de comunidad con metadatos de gobernanza (estados, flairs, conteos).
- Filtrado avanzado por estado de la comunidad y categorías (territorio, política, etc.).
- Resumen de gobernanza hidratado en tiempo real desde el data-plane.

### 2. Participación Cívica (Cabildeo)
- Ciclo de vida de propuestas y votaciones.
- Sistema de delegación de voto y agregación de posiciones.
- **Cabildeo Live**: Presencia en tiempo real para sesiones activas.

### 3. Base Social (PARA Social)
- Integración completa con el feed social de Bluesky/atproto.
- Metadata social enriquecida para perfiles y posts orientados a la cívica.

---

## 💻 Desarrollo

### Requisitos
- **Node**: >= 22 (ver `.nvmrc`)
- **Package Manager**: `pnpm`
- **Infra**: Docker (Postgres + Redis)

### Comandos Rápidos
```bash
# Instalar dependencias
pnpm install

# Verificar tipos (Paquete principal)
pnpm --filter @atproto/bsky exec tsc --build tsconfig.build.json

# Ejecutar entorno de desarrollo local
make run-dev-env

# Ejecutar tests de integración
pnpm --filter @atproto/bsky test -- tests/views/para-feed.test.ts
```

---

## 🏛️ Licencia

Este proyecto conserva la licencia dual heredada de la base atproto:

- **MIT License** ([LICENSE-MIT.txt](watx/LICENSE-MIT.txt))
- **Apache License, Version 2.0** ([LICENSE-APACHE.txt](watx/LICENSE-APACHE.txt))

---

*Construido con ❤️ por la comunidad de PARA.*

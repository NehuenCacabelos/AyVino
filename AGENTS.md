# Constitución del Proyecto AyVino

1. **Stack**: Backend en .NET Core (C#) y Frontend desacoplado en `src/frontend`.
2. **Base de Datos**: Cambios de esquema estructurados únicamente mediante `FluentMigrator`.
3. **Calidad**: Cero advertencias de compilador, tipado estricto y manejo global de excepciones.
4. **Límites**: Desacoplamiento estricto; la capa API no expone entidades de dominio, usa DTOs.
5. **Tests**: Cada nueva funcionalidad debe incluir sus respectivos tests en el directorio `tests`.
6. **Agente**: Reglas de desarrollo en `AGENTS.md` y flujos complejos en `.agents/skills/`.

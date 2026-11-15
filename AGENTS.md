# Constitución del Proyecto AyVino

1. **Stack**: Backend en .NET Core (C#) y Frontend desacoplado en `src/frontend`.
2. **Base de Datos**: Cambios de esquema estructurados únicamente mediante `FluentMigrator`.
3. **Calidad**: Cero advertencias de compilador, tipado estricto y manejo global de excepciones.
4. **Límites**: Desacoplamiento estricto; la capa API no expone entidades de dominio, usa DTOs.
5. **Tests**: Cada nueva funcionalidad debe incluir sus respectivos tests en el directorio `tests`.
6. **Agente**: Reglas de desarrollo en `AGENTS.md` y flujos complejos en `.agents/skills/`.
7. **Documentación Viva**: Toda nueva funcionalidad, endpoint, cambio de esquema o vista debe reflejarse y documentarse automáticamente en su carpeta correspondiente dentro de `docs/` como parte de la definición de terminado (DoD).

## Reglas Permanentes de Desarrollo Frontend (Algoritmos y Programación III - Instituto Hilet)

8. **Inmutabilidad y Estado Derivado (Bloque 2)**:
   - Prohibido mutar objetos o arreglos directamente (cero `push`, `splice`, `sort()` in-place). Toda mutación debe generar una nueva referencia mediante spread operator (`...`) o métodos puros (`map`, `filter`).
   - Siempre que el siguiente estado dependa del anterior, es obligatorio usar la forma funcional: `setEstado(prev => ...)`.
   - Prohibido guardar en `useState` valores que se puedan derivar o calcular a partir de props u otros estados durante el renderizado.
   - Todo formulario debe ser controlado (`value` + `onChange`) y usar `e.preventDefault()` en el envío. Ningún input controlado puede inicializarse en `null` o `undefined`.

9. **Ciclo de Vida y Capa HTTP (Bloque 3)**:
   - Todo `useEffect` debe tener un array de dependencias exhaustivo y basarse en variables primitivas estables, nunca en objetos completos si solo se necesita una propiedad.
   - Prohibido usar `useEffect` para sincronizar estado derivado.
   - Todo listener (`addEventListener`), timer o suscripción persistente debe retornar obligatoriamente su función de saneamiento (`cleanup`).
   - Las listas renderizadas con `.map()` deben tener obligatoriamente un atributo `key` determinista y único del dominio (queda terminantemente prohibido usar el índice del array como key en colecciones dinámicas).

10. **Enrutamiento y Composición (Bloque 4)**:
   - Todas las rutas se definen mediante la API centralizada `createBrowserRouter` + `<RouterProvider>`.
   - Las vistas que compartan navegación o footer deben estructurarse bajo un Layout común utilizando `<Outlet />`. Prohibido importar barras de navegación de forma individual en cada página.
   - La navegación interna se hace exclusivamente con `<Link>` o `<NavLink>` (con `isActive`). Prohibido usar tags `<a href>` para rutas internas.
   - En flujos de autenticación o acciones transaccionales, las redirecciones imperativas con `navigate()` deben evaluar el uso de `{ replace: true }`.

11. **Persistencia y Almacenamiento (Bloque 5)**:
   - Toda lectura sincrónica de `localStorage` o `sessionStorage` vinculada a un estado debe realizarse exclusivamente mediante inicialización perezosa (`useState(() => { ... })`) encapsulada en `try/catch`.
   - Todo proveedor de contexto (`Context.Provider`) debe suministrar un `value` memoizado mediante `useMemo` para evitar sobre-reconciliaciones en cascada.


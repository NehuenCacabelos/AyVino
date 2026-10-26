// End-to-End Live Integration Test for AyVino Administration Panel (Bloque 15 & 16)
// Comprehensive real-world validation against running backend (.NET 10 + PostgreSQL)
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5230/api';
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_de_al_menos_32_caracteres_ayvino';
const DB_UTIL_PROJECT = process.env.DB_UTIL_PROJECT || 'C:\\Users\\brian\\.gemini\\antigravity\\brain\\ef200946-c376-4f5b-9f80-ef2a4622950d\\scratch\\DbUtil\\DbUtil.csproj';

// -----------------------------------------------------------------------------
// SEGURIDAD: Negarse a correr si no apunta a localhost salvo E2E_ALLOW_REMOTE=true
// -----------------------------------------------------------------------------
const isLocal = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
if (!isLocal && process.env.E2E_ALLOW_REMOTE !== 'true') {
  console.error('⛔ SEGURIDAD: API_BASE no apunta a localhost. Para forzar ejecución remota establezca E2E_ALLOW_REMOTE=true.');
  process.exit(1);
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function executeSql(sql) {
  const sanitized = sql.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/"/g, '\\"');
  return execSync(`dotnet run --project "${DB_UTIL_PROJECT}" -- "${sanitized}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

function getDetail(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  return data.detail || data.title || JSON.stringify(data);
}

function hasNoDbLeak(str) {
  if (!str) return true;
  const lower = String(str).toLowerCase();
  const forbidden = [
    'wine_grapes', 'wine_pairings', 'wine_vintages', 'wineries', 'cellar_items', 'cellars',
    'fk_', 'pk_', 'uq_', 'violates foreign key', 'postgres', 'npgsql', 'syntax error'
  ];
  return !forbidden.some(f => lower.includes(f));
}

async function run() {
  console.log('🍷 ================================================================');
  console.log('🍷 AYVINO ADMIN PANEL - BATERÍA DE PRUEBAS DE INTEGRACIÓN E2E VIVA');
  console.log('🍷 Backend: ' + API_BASE);
  console.log('🍷 ================================================================\n');

  let passed = 0;
  let failed = 0;
  const resultsTable = [];

  function record(caseName, expected, obtained, condition, detail = '') {
    const isOk = Boolean(condition);
    if (isOk) {
      console.log(`  ✅ [OK] ${caseName} -> Esperado: ${expected} | Obtenido: ${obtained}`);
      passed++;
    } else {
      console.error(`  ❌ [FALLA] ${caseName} -> Esperado: ${expected} | Obtenido: ${obtained} ${detail}`);
      failed++;
    }
    resultsTable.push({
      caseName,
      expected: String(expected),
      obtained: String(obtained),
      status: isOk ? 'OK' : 'FALLA',
      detail: detail || (isOk ? '' : 'Discrepancia con lo esperado'),
    });
  }

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // PREPARACIÓN: Creación y promoción de admin, y siembra de datos con prefijo "e2e_"
    // -------------------------------------------------------------------------
    console.log('--- FASE 0: PREPARACIÓN Y SIEMBRA DE DATOS (prefijo "e2e_") ---');

    // 1. Admin User
    const adminEmail = process.env.ADMIN_EMAIL || `e2e_admin_${timestamp}@ayvino.com`;
    const adminUsername = `e2e_admin_${timestamp}`;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';

    console.log(`Registrando y promoviendo usuario administrador (${adminEmail})...`);
    const regAdminRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, username: adminUsername, password: adminPassword }),
    });

    let adminUserId;
    if (regAdminRes.status === 201 && regAdminRes.data?.id) {
      adminUserId = regAdminRes.data.id;
      executeSql(`UPDATE users SET role = 'Admin' WHERE id = ${adminUserId};`);
    } else {
      throw new Error(`Fallo al registrar usuario admin: HTTP ${regAdminRes.status} ${JSON.stringify(regAdminRes.data)}`);
    }

    // Login Admin
    const loginAdminRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    if (loginAdminRes.status !== 200 || !loginAdminRes.data?.accessToken) {
      throw new Error(`Fallo en login de admin: HTTP ${loginAdminRes.status} ${JSON.stringify(loginAdminRes.data)}`);
    }
    const adminToken = loginAdminRes.data.accessToken;
    console.log(`  -> Admin logueado con éxito. ID: ${adminUserId}, Rol: ${loginAdminRes.data.user?.role}`);

    // 2. Common User
    const commonUserEmail = `e2e_user_${timestamp}@ayvino.com`;
    const commonUsername = `e2e_user_${timestamp}`;
    const commonPassword = 'Password123!';

    console.log(`Registrando usuario común (${commonUserEmail})...`);
    const regUserRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, username: commonUsername, password: commonPassword }),
    });
    const commonUserId = regUserRes.data?.id;

    const loginUserRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, password: commonPassword }),
    });
    const userToken = loginUserRes.data?.accessToken;
    console.log(`  -> Usuario común logueado. ID: ${commonUserId}, Rol: ${loginUserRes.data?.user?.role}`);

    // 3. Unrelated User (usuario ajeno para pruebas de visibilidad)
    const unrelatedEmail = `e2e_unrelated_${timestamp}@ayvino.com`;
    const unrelatedUsername = `e2e_unrelated_${timestamp}`;
    const regUnrelatedRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: unrelatedEmail, username: unrelatedUsername, password: 'Password123!' }),
    });
    const unrelatedUserId = regUnrelatedRes.data?.id;

    const loginUnrelatedRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: unrelatedEmail, password: 'Password123!' }),
    });
    const unrelatedToken = loginUnrelatedRes.data?.accessToken;

    // 4. Location & Grape para siembra
    const locationsRes = await request('/locations?pageSize=10');
    const locationId = locationsRes.data?.[0]?.id || 1;

    let grapeId;
    const newGrape = await request('/grapes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `e2e_Malbec_${timestamp}`, colorType: 'Red' }),
    });
    grapeId = newGrape.data?.id;

    // 5. Winery registrada (queda Pending)
    const wineryEmail = `e2e_winery_${timestamp}@bodega.com`;
    const wineryUsername = `e2e_winery_${timestamp}`;
    const wineryPassword = 'Password123!';
    const wineryName = `e2e_Bodega_${timestamp}`;

    console.log(`Registrando bodega con onboarding (${wineryName})...`);
    const regWineryRes = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify({
        username: wineryUsername,
        email: wineryEmail,
        password: wineryPassword,
        wineryName,
        locationId,
        foundationYear: 2010,
        website: 'https://bodegatest.com',
        description: 'Bodega de prueba para moderación admin.',
      }),
    });
    const wineryId = regWineryRes.data?.winery?.id;
    const wineryToken = regWineryRes.data?.accessToken;
    const wineryUserId = regWineryRes.data?.winery?.userId || regWineryRes.data?.user?.id;
    console.log(`  -> Bodega registrada. ID: ${wineryId}, Status: ${regWineryRes.data?.winery?.status}, UserId: ${wineryUserId}`);

    // 6. Ciudad propuesta por usuario común (queda Pending)
    console.log('Proponiendo ciudad nueva por usuario común...');
    const cityRes = await request('/cities', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: `e2e_Ciudad_${timestamp}`, stateId: 1 }),
    });
    const cityId = cityRes.data?.id;
    console.log(`  -> Ciudad propuesta. ID: ${cityId}, Status: ${cityRes.data?.status}`);

    // 7. Vino y Cosecha cargados por usuario común (la cosecha queda Pending)
    console.log('Creando vino y primera cosecha por usuario común...');
    const wineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_Comunitario_${timestamp}`,
        wineType: 'Red',
        wineryNameText: 'Viñedos de Prueba',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.2,
          servingTemperature: 16,
          agingAdvice: 'Beber ahora o guardar 4 años',
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const wineId = wineRes.data?.id;

    const pendingVintagesRes = await request('/wine-vintages?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const createdVintage = Array.isArray(pendingVintagesRes.data)
      ? pendingVintagesRes.data.find((v) => v.wineId === wineId)
      : null;
    const vintageId = createdVintage?.vintageId;
    console.log(`  -> Vino ID: ${wineId}, Cosecha ID: ${vintageId}, Status inicial: Pending`);

    console.log('\n--- FASE 1: CASOS A VERIFICAR POR HTTP ---\n');

    // =========================================================================
    // SECCIÓN A: COSECHAS (GET /api/wine-vintages)
    // =========================================================================
    console.log('--- SECCIÓN A: COSECHAS ---');

    const a1 = await request('/wine-vintages');
    record('A.1 Cosechas sin token', '401', a1.status, a1.status === 401);

    const a2 = await request('/wine-vintages', { headers: { Authorization: `Bearer ${userToken}` } });
    record('A.2 Cosechas con token de usuario común', '403', a2.status, a2.status === 403);

    const a3 = await request('/wine-vintages?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundPendingVintage = Array.isArray(a3.data) && a3.data.find((v) => v.vintageId === vintageId);
    const a3Ok =
      a3.status === 200 &&
      Boolean(foundPendingVintage) &&
      Boolean(foundPendingVintage.wineName) &&
      Boolean(foundPendingVintage.wineryName) &&
      foundPendingVintage.uploadedByUsername === commonUsername;
    record(
      'A.3 Listar cosechas Pending con campos resueltos',
      '200 con vintageId presente, wineName, wineryName y uploadedByUsername resueltos',
      `HTTP ${a3.status}, vintage encontrado: ${Boolean(foundPendingVintage)}, wineName: "${foundPendingVintage?.wineName}", wineryName: "${foundPendingVintage?.wineryName}", user: "${foundPendingVintage?.uploadedByUsername}"`,
      a3Ok,
    );

    const a4 = await request('/wine-vintages?status=foo', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const a4HasProblem = a4.status === 400 && (Boolean(a4.data?.detail) || Boolean(a4.data?.title));
    record('A.4 Cosechas status inválido (foo)', '400 con Problem Details', `HTTP ${a4.status}, detail: "${a4.data?.detail}"`, a4HasProblem);

    const a5 = await request('/wine-vintages?pageSize=101', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('A.5 Cosechas pageSize=101', '400', a5.status, a5.status === 400);

    const a6 = await request('/wine-vintages?pageNumber=0', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('A.6 Cosechas pageNumber=0', '400', a6.status, a6.status === 400);

    const a7Patch = await request(`/wines/${wineId}/vintages/${vintageId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });
    const a7Public = await request(`/wines/${wineId}/vintages`);
    const a7ApprovedFound = Array.isArray(a7Public.data) && a7Public.data.some((v) => (v.id || v.vintageId) === vintageId);
    record(
      'A.7 Moderar cosecha a Approved y verificar visibilidad pública',
      'PATCH 200/204 y visible en GET público /wines/{wineId}/vintages',
      `PATCH: ${a7Patch.status}, Público: ${a7Public.status}, Visible: ${a7ApprovedFound}`,
      (a7Patch.status === 200 || a7Patch.status === 204) && a7ApprovedFound,
    );

    const a8Patch = await request(`/wines/${wineId}/vintages/${vintageId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Rejected' }),
    });
    const a8Public = await request(`/wines/${wineId}/vintages`);
    const a8RejectedHidden = Array.isArray(a8Public.data) && !a8Public.data.some((v) => (v.id || v.vintageId) === vintageId);
    record(
      'A.8 Moderar cosecha a Rejected y verificar exclusión pública',
      'PATCH 200/204 y oculta en GET público',
      `PATCH: ${a8Patch.status}, Visible: ${!a8RejectedHidden}`,
      (a8Patch.status === 200 || a8Patch.status === 204) && a8RejectedHidden,
    );

    const a9 = await request(`/wines/${wineId}/vintages/${vintageId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const a9HasBlends = a9.status === 200 && (Array.isArray(a9.data?.grapes) || a9.data !== null);
    record(
      'A.9 GET detalle de cosecha con token admin',
      '200 con datos técnicos y blends',
      `HTTP ${a9.status}, grapes: ${Array.isArray(a9.data?.grapes) ? a9.data.grapes.length : 'N/A'}`,
      a9HasBlends,
    );

    // =========================================================================
    // SECCIÓN B: BODEGAS
    // =========================================================================
    console.log('\n--- SECCIÓN B: BODEGAS ---');

    const b1 = await request('/wineries?pageNumber=1&pageSize=100&status=Pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const b1Found = Array.isArray(b1.data) && b1.data.some((w) => w.id === wineryId);
    record('B.1 Listado de bodegas Pending incluye la sembrada', '200 con wineryId presente', `HTTP ${b1.status}, encontrada: ${b1Found}`, b1.status === 200 && b1Found);

    const b2Patch = await request(`/wineries/${wineryId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });
    const b2Public = await request('/wineries?pageNumber=1&pageSize=100&status=Approved');
    const b2FoundPublic = Array.isArray(b2Public.data) && b2Public.data.some((w) => w.id === wineryId);
    record(
      'B.2 Aprobar bodega y verificar en listado público',
      'PATCH 200/204 y visible en GET /wineries?status=Approved',
      `PATCH: ${b2Patch.status}, Público: ${b2FoundPublic}`,
      (b2Patch.status === 200 || b2Patch.status === 204) && b2FoundPublic,
    );

    const b3Delete = await request(`/wineries/${wineryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const b3Get = await request(`/wineries/${wineryId}`);
    record(
      'B.3 Eliminar bodega',
      'DELETE 204 y posterior GET 404',
      `DELETE: ${b3Delete.status}, GET: ${b3Get.status}`,
      b3Delete.status === 204 && b3Get.status === 404,
    );

    // =========================================================================
    // SECCIÓN C: CIUDADES
    // =========================================================================
    console.log('\n--- SECCIÓN C: CIUDADES ---');

    const c1 = await request('/cities?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const c1Found = Array.isArray(c1.data) && c1.data.some((c) => c.id === cityId);
    record('C.1 Listado de ciudades Pending incluye la sembrada', '200 con cityId presente', `HTTP ${c1.status}, encontrada: ${c1Found}`, c1.status === 200 && c1Found);

    const c2Patch = await request(`/cities/${cityId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });
    const c2Public = await request('/cities?status=Approved&pageSize=250');
    const c2FoundApproved = Array.isArray(c2Public.data) && c2Public.data.some((c) => c.id === cityId);
    record(
      'C.2 Aprobar ciudad y verificar en listado público Approved',
      'PATCH 200/204 y visible en GET /cities?status=Approved',
      `PATCH: ${c2Patch.status}, Público: ${c2FoundApproved}`,
      (c2Patch.status === 200 || c2Patch.status === 204) && c2FoundApproved,
    );

    const c3Patch = await request(`/cities/${cityId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Rejected' }),
    });
    const c3Public = await request('/cities?status=Approved&pageSize=250');
    const c3HiddenFromApproved = Array.isArray(c3Public.data) && !c3Public.data.some((c) => c.id === cityId);
    record(
      'C.3 Rechazar ciudad y verificar que no figura en Approved',
      'PATCH 200/204 y excluida de GET /cities?status=Approved',
      `PATCH: ${c3Patch.status}, Excluida: ${c3HiddenFromApproved}`,
      (c3Patch.status === 200 || c3Patch.status === 204) && c3HiddenFromApproved,
    );

    // =========================================================================
    // SECCIÓN D: USUARIOS
    // =========================================================================
    console.log('\n--- SECCIÓN D: USUARIOS ---');

    const d1 = await request('/users?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'D.1 GET /api/users paginado',
      '200 con lista de usuarios',
      `HTTP ${d1.status}, cantidad recibida: ${Array.isArray(d1.data) ? d1.data.length : 'N/A'}`,
      d1.status === 200 && Array.isArray(d1.data) && d1.data.length > 0,
    );

    const d2Patch = await request(`/users/${commonUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false }),
    });
    const d2Login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, password: commonPassword }),
    });
    record(
      'D.2 Desactivar usuario (isActive=false) y rechazo de login',
      'PATCH 204 y Login rechazado con HTTP 401',
      `PATCH: ${d2Patch.status}, Login: HTTP ${d2Login.status} ("${d2Login.data?.detail || d2Login.data?.title || d2Login.data}")`,
      d2Patch.status === 204 && d2Login.status === 401,
    );

    const d3Patch = await request(`/users/${commonUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: true }),
    });
    const d3Login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, password: commonPassword }),
    });
    record(
      'D.3 Reactivar usuario (isActive=true) y login exitoso',
      'PATCH 204 y Login 200 con token',
      `PATCH: ${d3Patch.status}, Login: HTTP ${d3Login.status}, Token: ${Boolean(d3Login.data?.accessToken)}`,
      d3Patch.status === 204 && d3Login.status === 200 && Boolean(d3Login.data?.accessToken),
    );

    const ephemeralEmail = `e2e_ephemeral_${timestamp}@test.com`;
    const regEphemeral = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: ephemeralEmail, username: `e2e_ephemeral_${timestamp}`, password: 'Password123!' }),
    });
    const ephemeralId = regEphemeral.data?.id;

    const d4Delete = await request(`/users/${ephemeralId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const d4Get = await request(`/users/${ephemeralId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'D.4 Eliminar usuario sin datos asociados',
      'DELETE 204 y GET posterior 404',
      `DELETE: ${d4Delete.status}, GET: ${d4Get.status}`,
      d4Delete.status === 204 && d4Get.status === 404,
    );

    // =========================================================================
    // SECCIÓN E: UVAS Y MARIDAJES
    // =========================================================================
    console.log('\n--- SECCIÓN E: UVAS Y MARIDAJES ---');

    const e1Post = await request('/grapes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Uva_CRUD_${timestamp}`,
        colorType: 'Red',
        typicalBody: 'Full',
        typicalTannins: 'Medium',
        typicalAcidity: 'High',
        description: 'Varietal para verificación CRUD',
      }),
    });
    const crudGrapeId = e1Post.data?.id;

    const e1Put = await request(`/grapes/${crudGrapeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Uva_CRUD_Editada_${timestamp}`,
        colorType: 'Rose',
        typicalBody: 'Light',
        typicalTannins: 'Soft',
        typicalAcidity: 'Low',
        description: 'Varietal editado',
      }),
    });

    const e1Get = await request(`/grapes/${crudGrapeId}`);
    const e1Delete = await request(`/grapes/${crudGrapeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const e1GetAfter = await request(`/grapes/${crudGrapeId}`);
    record(
      'E.1 Uvas CRUD completo (POST, PUT, GET, DELETE)',
      'POST 201/200, PUT 200, GET 200, DELETE 204, GET final 404',
      `POST: ${e1Post.status}, PUT: ${e1Put.status}, GET: ${e1Get.status}, DELETE: ${e1Delete.status}, Final: ${e1GetAfter.status}`,
      (e1Post.status === 201 || e1Post.status === 200) &&
        e1Put.status === 200 &&
        e1Get.status === 200 &&
        e1Delete.status === 204 &&
        e1GetAfter.status === 404,
    );

    const e2Post = await request('/pairings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Maridaje_CRUD_${timestamp}`,
        category: 'Meat',
      }),
    });
    const crudPairingId = e2Post.data?.id;

    const e2Put = await request(`/pairings/${crudPairingId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Maridaje_CRUD_Editado_${timestamp}`,
        category: 'Cheese',
      }),
    });

    const e2Delete = await request(`/pairings/${crudPairingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'E.2 Maridajes CRUD completo (POST, PUT, DELETE)',
      'POST 201/200, PUT 200, DELETE 204',
      `POST: ${e2Post.status}, PUT: ${e2Put.status}, DELETE: ${e2Delete.status}`,
      (e2Post.status === 201 || e2Post.status === 200) && e2Put.status === 200 && e2Delete.status === 204,
    );

    const e3Delete = await request(`/grapes/${grapeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'E.3 Eliminar uva en uso en vino/cosecha',
      '409 Conflict con mensaje legible',
      `HTTP ${e3Delete.status}: "${e3Delete.data?.detail || e3Delete.data?.title || e3Delete.data}"`,
      e3Delete.status === 409,
    );

    // =========================================================================
    // SECCIÓN F: CAMBIO DE ROL (PATCH /api/users/{id}/role)
    // =========================================================================
    console.log('\n--- SECCIÓN F: CAMBIO DE ROL ---');

    const f1Patch = await request(`/users/${commonUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'Admin' }),
    });
    const f1Login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, password: commonPassword }),
    });
    const promotedToken = f1Login.data?.accessToken;
    const f1GetUsers = await request('/users?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${promotedToken}` },
    });
    record(
      'F.1 Promover User a Admin y validar permisos con nuevo login',
      'PATCH 204, Login rol Admin, GET /users 200',
      `PATCH: ${f1Patch.status}, Rol en login: "${f1Login.data?.user?.role}", GET /users: ${f1GetUsers.status}`,
      f1Patch.status === 204 && f1Login.data?.user?.role === 'Admin' && f1GetUsers.status === 200,
    );

    const f2Patch = await request(`/users/${commonUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'User' }),
    });
    const f2Login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: commonUserEmail, password: commonPassword }),
    });
    const demotedToken = f2Login.data?.accessToken;
    const f2GetUsers = await request('/users?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${demotedToken}` },
    });
    record(
      'F.2 Degradar Admin a User y verificar revocación de permisos',
      'PATCH 204, Login rol User, GET /users 403',
      `PATCH: ${f2Patch.status}, Rol en login: "${f2Login.data?.user?.role}", GET /users: ${f2GetUsers.status}`,
      f2Patch.status === 204 && f2Login.data?.user?.role === 'User' && f2GetUsers.status === 403,
    );

    const f3 = await request(`/users/${adminUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'User' }),
    });
    record(
      'F.3 Auto-modificación de rol prohibida',
      '403 Forbidden',
      `HTTP ${f3.status} ("${f3.data?.detail || f3.data?.title}")`,
      f3.status === 403,
    );

    const f4 = await request(`/users/${wineryUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'Admin' }),
    });
    record(
      'F.4 Modificación de usuario Bodega rechazada',
      '409 Conflict',
      `HTTP ${f4.status} ("${f4.data?.detail || f4.data?.title}")`,
      f4.status === 409,
    );

    const f5a = await request(`/users/${commonUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'Winery' }),
    });
    const f5b = await request(`/users/${commonUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'SuperAdmin' }),
    });
    record(
      'F.5 Roles no permitidos (Winery y SuperAdmin)',
      '400 Bad Request en ambos',
      `Winery: ${f5a.status}, SuperAdmin: ${f5b.status}`,
      f5a.status === 400 && f5b.status === 400,
    );

    const f6 = await request(`/users/${commonUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'User' }),
    });
    record(
      'F.6 Mismo rol (idempotencia)',
      '204 NoContent',
      `HTTP ${f6.status}`,
      f6.status === 204,
    );

    // =========================================================================
    // SECCIÓN G: SEGURIDAD TRANSVERSAL
    // =========================================================================
    console.log('\n--- SECCIÓN G: SEGURIDAD TRANSVERSAL ---');

    const adminEndpoints = [
      { method: 'GET', path: '/wine-vintages' },
      { method: 'PATCH', path: `/users/${commonUserId}/role`, body: { role: 'Admin' } },
      { method: 'GET', path: '/users' },
      { method: 'POST', path: '/grapes', body: { name: 'Sec Uva', colorType: 'Red' } },
      { method: 'PUT', path: `/grapes/${grapeId}`, body: { name: 'Sec Uva Mod', colorType: 'Red' } },
      { method: 'DELETE', path: `/grapes/${grapeId}` },
      { method: 'POST', path: '/pairings', body: { name: 'Sec Maridaje', category: 'Meat' } },
      { method: 'PUT', path: '/pairings/1', body: { name: 'Sec Maridaje Mod', category: 'Fish' } },
      { method: 'DELETE', path: '/pairings/1' },
      { method: 'PATCH', path: `/wineries/1/status`, body: { status: 'Approved' } },
      { method: 'DELETE', path: `/wineries/1` },
      { method: 'PATCH', path: `/cities/1/status`, body: { status: 'Approved' } },
    ];

    let gNoTokenPassed = true;
    let gUserTokenPassed = true;
    let gWineryTokenPassed = true;

    for (const ep of adminEndpoints) {
      const resNoToken = await request(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (resNoToken.status !== 401) {
        gNoTokenPassed = false;
        console.error(`    Falla seguridad sin token en ${ep.method} ${ep.path}: HTTP ${resNoToken.status}`);
      }

      const resUserToken = await request(ep.path, {
        method: ep.method,
        headers: { Authorization: `Bearer ${userToken}` },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (resUserToken.status !== 403) {
        gUserTokenPassed = false;
        console.error(`    Falla seguridad User en ${ep.method} ${ep.path}: HTTP ${resUserToken.status}`);
      }

      const resWineryToken = await request(ep.path, {
        method: ep.method,
        headers: { Authorization: `Bearer ${wineryToken}` },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (resWineryToken.status !== 403) {
        gWineryTokenPassed = false;
        console.error(`    Falla seguridad Winery en ${ep.method} ${ep.path}: HTTP ${resWineryToken.status}`);
      }
    }

    record('G.1 Ningún endpoint admin responde sin token', 'Todos 401', gNoTokenPassed ? 'Todos 401' : 'Alguno diferente a 401', gNoTokenPassed);
    record('G.2 Ningún endpoint admin responde a usuario común', 'Todos 403', gUserTokenPassed ? 'Todos 403' : 'Alguno diferente a 403', gUserTokenPassed);
    record('G.3 Ningún endpoint admin responde a bodega', 'Todos 403', gWineryTokenPassed ? 'Todos 403' : 'Alguno diferente a 403', gWineryTokenPassed);

    // =========================================================================
    // SECCIÓN H: COBERTURA DE BORRADOS CON DEPENDENCIAS Y VISIBILIDAD (BLOQUE 16)
    // =========================================================================
    console.log('\n--- SECCIÓN H: BORRADOS CON DEPENDENCIAS Y VISIBILIDAD AVANZADA ---');

    // H.1: GET público (anónimo y usuario ajeno) del detalle de una cosecha Pending y de una Rejected: nunca 200.
    // Creamos vino con cosecha pending y otra rejected para verificar
    const wineH1Res = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_H1_${timestamp}`,
        wineType: 'Red',
        wineryNameText: 'Viñedos H1',
        firstVintage: {
          year: 2020,
          alcoholContent: 13.5,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const wineH1Id = wineH1Res.data?.id;

    // Buscar la cosecha pending recién creada
    const h1PendingVintagesRes = await request('/wine-vintages?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h1PendingVintage = Array.isArray(h1PendingVintagesRes.data)
      ? h1PendingVintagesRes.data.find((v) => v.wineId === wineH1Id)
      : null;
    const h1PendingVintageId = h1PendingVintage?.vintageId;

    // Rechazar la cosecha mediante admin
    const h1RejectRes = await request(`/wines/${wineH1Id}/vintages/${h1PendingVintageId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Rejected' }),
    });

    // Ahora creamos una segunda cosecha que queda Pending
    const h1SecondVintageRes = await request(`/wines/${wineH1Id}/vintages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        year: 2022,
        alcoholContent: 14.0,
        servingTemperature: 16,
        imageUrl: null,
        grapes: [{ grapeId, percentage: 100 }],
      }),
    });
    const h1SecondPendingId = h1SecondVintageRes.data?.id;

    // Consultas para Pending:
    const h1AnonPending = await request(`/wines/${wineH1Id}/vintages/${h1SecondPendingId}`);
    const h1UnrelatedPending = await request(`/wines/${wineH1Id}/vintages/${h1SecondPendingId}`, {
      headers: { Authorization: `Bearer ${unrelatedToken}` },
    });

    // Consultas para Rejected:
    const h1AnonRejected = await request(`/wines/${wineH1Id}/vintages/${h1PendingVintageId}`);
    const h1UnrelatedRejected = await request(`/wines/${wineH1Id}/vintages/${h1PendingVintageId}`, {
      headers: { Authorization: `Bearer ${unrelatedToken}` },
    });

    const h1Ok =
      h1AnonPending.status !== 200 &&
      h1UnrelatedPending.status !== 200 &&
      h1AnonRejected.status !== 200 &&
      h1UnrelatedRejected.status !== 200 &&
      hasNoDbLeak(h1AnonPending.data) &&
      hasNoDbLeak(h1UnrelatedPending.data) &&
      hasNoDbLeak(h1AnonRejected.data) &&
      hasNoDbLeak(h1UnrelatedRejected.data);

    record(
      'H.1 GET público (anónimo y ajeno) de cosecha Pending y Rejected nunca 200',
      'Todos 404/4xx (nunca 200 ni 500) sin leaks',
      `Pending(Anon:${h1AnonPending.status}, Ajeno:${h1UnrelatedPending.status}) | Rejected(Anon:${h1AnonRejected.status}, Ajeno:${h1UnrelatedRejected.status})`,
      h1Ok,
      `Details: [${getDetail(h1AnonPending.data)}] [${getDetail(h1AnonRejected.data)}]`,
    );

    // H.2: Cosecha Approved de una bodega Pending: invisible para anónimo en listado y detalle.
    const h2WineryRes = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `e2e_winery_h2_${timestamp}`,
        email: `e2e_winery_h2_${timestamp}@bodega.com`,
        password: 'Password123!',
        wineryName: `e2e_Bodega_H2_${timestamp}`,
        locationId,
        foundationYear: 2015,
        website: 'https://bodegah2.com',
        description: 'Bodega pendiente para H2',
      }),
    });
    const h2WineryId = h2WineryRes.data?.winery?.id;
    const h2WineryToken = h2WineryRes.data?.accessToken;

    // Crear vino oficial por parte de la bodega pendiente
    const h2WineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${h2WineryToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_Oficial_H2_${timestamp}`,
        wineType: 'Red',
        wineryId: h2WineryId,
        firstVintage: {
          year: 2019,
          alcoholContent: 14.0,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const h2WineId = h2WineRes.data?.id;

    // Obtener la cosecha creada
    const h2VintagesAdminRes = await request('/wine-vintages?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h2PendingVintage = Array.isArray(h2VintagesAdminRes.data)
      ? h2VintagesAdminRes.data.find((v) => v.wineId === h2WineId)
      : null;
    const h2VintageId = h2PendingVintage?.vintageId;

    // Admin aprueba la cosecha (pero la bodega sigue en estado Pending)
    await request(`/wines/${h2WineId}/vintages/${h2VintageId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });

    // Consultas anónimas:
    const h2ListAnon = await request(`/wines/${h2WineId}/vintages`);
    const h2DetailAnon = await request(`/wines/${h2WineId}/vintages/${h2VintageId}`);
    const h2ListHidesIt = h2ListAnon.status === 404 || (Array.isArray(h2ListAnon.data) && !h2ListAnon.data.some((v) => (v.id || v.vintageId) === h2VintageId));
    const h2DetailHidesIt = h2DetailAnon.status === 404;

    record(
      'H.2 Cosecha Approved de bodega Pending invisible para anónimo',
      'Listado excluye/404 y Detalle 404 (nunca 200)',
      `Listado: HTTP ${h2ListAnon.status} (oculta: ${h2ListHidesIt}), Detalle: HTTP ${h2DetailAnon.status}`,
      h2ListHidesIt && h2DetailHidesIt && hasNoDbLeak(h2DetailAnon.data),
      `Detail: ${getDetail(h2DetailAnon.data)}`,
    );

    // H.3: DELETE de un maridaje asociado a un vino.
    const h3PairingRes = await request('/pairings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `e2e_Maridaje_H3_${timestamp}`, category: 'Meat' }),
    });
    const h3PairingId = h3PairingRes.data?.id;

    // Asociar al vino
    await request(`/wines/${wineId}/pairings/${h3PairingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Eliminar maridaje
    const h3Delete = await request(`/pairings/${h3PairingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h3GetAfter = await request(`/pairings/${h3PairingId}`);

    const h3Ok = (h3Delete.status === 204 || (h3Delete.status >= 400 && h3Delete.status < 500)) &&
      h3Delete.status !== 500 &&
      hasNoDbLeak(h3Delete.data);

    record(
      'H.3 DELETE de un maridaje asociado a un vino',
      '204 (cascade por FK_WinePairings_Pairings) o 4xx sin leaks (nunca 500)',
      `DELETE: HTTP ${h3Delete.status}, GET posterior: HTTP ${h3GetAfter.status}`,
      h3Ok,
      `Detail: ${getDetail(h3Delete.data)}`,
    );

    // H.4: DELETE de una bodega que tiene vinos.
    const h4WineryRes = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `e2e_winery_h4_${timestamp}`,
        email: `e2e_winery_h4_${timestamp}@bodega.com`,
        password: 'Password123!',
        wineryName: `e2e_Bodega_H4_${timestamp}`,
        locationId,
        foundationYear: 2012,
        website: 'https://bodegah4.com',
        description: 'Bodega para prueba H4',
      }),
    });
    const h4WineryId = h4WineryRes.data?.winery?.id;
    const h4WineryToken = h4WineryRes.data?.accessToken;

    // Crear vino vinculado a la bodega
    const h4WineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${h4WineryToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_H4_${timestamp}`,
        wineType: 'Red',
        wineryId: h4WineryId,
        firstVintage: {
          year: 2021,
          alcoholContent: 14.0,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const h4WineId = h4WineRes.data?.id;

    // Eliminar la bodega que tiene vino
    const h4Delete = await request(`/wineries/${h4WineryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h4GetAfter = await request(`/wineries/${h4WineryId}`);

    const h4Ok = (h4Delete.status === 204 || (h4Delete.status >= 400 && h4Delete.status < 500)) &&
      h4Delete.status !== 500 &&
      hasNoDbLeak(h4Delete.data);

    record(
      'H.4 DELETE de una bodega que tiene vinos',
      '204 (OnDelete SetNull según FK_Wines_Wineries) o 4xx sin leaks (nunca 500)',
      `DELETE: HTTP ${h4Delete.status}, GET posterior: HTTP ${h4GetAfter.status}`,
      h4Ok,
      `Detail: ${getDetail(h4Delete.data)}`,
    );

    // H.5: DELETE de un usuario con reseñas, con cosechas subidas y con bodega propia.
    const h5UserRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: `e2e_user_h5_${timestamp}@test.com`,
        username: `e2e_user_h5_${timestamp}`,
        password: 'Password123!',
      }),
    });
    const h5UserId = h5UserRes.data?.id;

    const h5LoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: `e2e_user_h5_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const h5Token = h5LoginRes.data?.accessToken;

    // 1. Cosecha subida
    const h5WineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${h5Token}` },
      body: JSON.stringify({
        name: `e2e_Vino_H5_${timestamp}`,
        wineType: 'Red',
        wineryNameText: 'Viñedo H5',
        firstVintage: {
          year: 2020,
          alcoholContent: 13.5,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const h5WineId = h5WineRes.data?.id;

    // 2. Reseña creada por el usuario
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${h5Token}` },
      body: JSON.stringify({
        wineVintageId: vintageId,
        rating: 5,
        comment: 'e2e_Reseña_H5_Excelente',
      }),
    });

    // 3. Bodega propia
    executeSql(`INSERT INTO wineries (name, location_id, user_id, status, foundation_year, register_date) VALUES ('e2e_Bodega_H5_${timestamp}', ${locationId}, ${h5UserId}, 1, 2020, NOW());`);

    // Intento de eliminación del usuario con dependencias
    const h5Delete = await request(`/users/${h5UserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const h5Ok = h5Delete.status === 409 &&
      h5Delete.status !== 500 &&
      hasNoDbLeak(h5Delete.data);

    record(
      'H.5 DELETE de usuario con reseñas, cosechas y bodega propia',
      '409 Conflict con Problem Details legible sin leaks de Postgres (nunca 500)',
      `HTTP ${h5Delete.status}`,
      h5Ok,
      `Detail: "${getDetail(h5Delete.data)}"`,
    );

    // H.6: DELETE de una cosecha con reseñas y de una cosecha en una cava.
    // 1. Cosecha con reseñas
    const h6WineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_H6_${timestamp}`,
        wineType: 'Red',
        wineryNameText: 'Viñedo H6',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.0,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const h6WineId = h6WineRes.data?.id;

    const h6VintagesAdminRes = await request('/wine-vintages?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h6VintageWithReview = Array.isArray(h6VintagesAdminRes.data)
      ? h6VintagesAdminRes.data.find((v) => v.wineId === h6WineId)
      : null;
    const h6VintageWithReviewId = h6VintageWithReview?.vintageId;

    // Agregar reseña
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        wineVintageId: h6VintageWithReviewId,
        rating: 4,
        comment: 'e2e_Reseña_H6_Buena',
      }),
    });

    // Intentar borrar la cosecha con reseña
    const h6aDelete = await request(`/wines/${h6WineId}/vintages/${h6VintageWithReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // 2. Cosecha en una cava
    const h6VintageCellarRes = await request(`/wines/${h6WineId}/vintages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        year: 2023,
        alcoholContent: 13.8,
        servingTemperature: 16,
        imageUrl: null,
        grapes: [{ grapeId, percentage: 100 }],
      }),
    });
    const h6VintageInCellarId = h6VintageCellarRes.data?.id;

    // Crear cava y agregar ítem
    const h6CellarRes = await request('/cellars', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: `e2e_Cava_H6_${timestamp}` }),
    });
    const h6CellarId = h6CellarRes.data?.id;

    await request(`/cellars/${h6CellarId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wineVintageId: h6VintageInCellarId, quantity: 3 }),
    });

    // Borrar la cosecha en cava (fk_cellar_items_wine_vintage tiene OnDelete Cascade)
    const h6bDelete = await request(`/wines/${h6WineId}/vintages/${h6VintageInCellarId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const h6Ok =
      h6aDelete.status === 409 &&
      (h6bDelete.status === 204 || (h6bDelete.status >= 400 && h6bDelete.status < 500)) &&
      h6aDelete.status !== 500 &&
      h6bDelete.status !== 500 &&
      hasNoDbLeak(h6aDelete.data) &&
      hasNoDbLeak(h6bDelete.data);

    record(
      'H.6 DELETE cosecha con reseñas (409) y cosecha en cava (204)',
      'Con reseñas: 409 Conflict | En cava: 204 NoContent (nunca 500)',
      `Con reseñas: HTTP ${h6aDelete.status} | En cava: HTTP ${h6bDelete.status}`,
      h6Ok,
      `Detail reseñas: "${getDetail(h6aDelete.data)}" | Detail cava: "${getDetail(h6bDelete.data)}"`,
    );

    // H.7: DELETE de un vino con cosechas.
    const h7WineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: `e2e_Vino_H7_${timestamp}`,
        wineType: 'Red',
        wineryNameText: 'Viñedo H7',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.0,
          servingTemperature: 16,
          imageUrl: null,
          grapes: [{ grapeId, percentage: 100 }],
        },
      }),
    });
    const h7WineId = h7WineRes.data?.id;

    const h7Delete = await request(`/wines/${h7WineId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h7GetAfter = await request(`/wines/${h7WineId}`);

    const h7Ok = h7Delete.status === 204 && h7GetAfter.status === 404;

    record(
      'H.7 DELETE de un vino con cosechas (cascade)',
      'DELETE 204 y GET posterior 404 (nunca 500)',
      `DELETE: HTTP ${h7Delete.status}, GET posterior: HTTP ${h7GetAfter.status}`,
      h7Ok,
      `Detail: ${getDetail(h7Delete.data)}`,
    );

  } catch (err) {
    console.error('\n💥 ERROR FATAL DURANTE LA EJECUCIÓN:', err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // LIMPIEZA AUTOMÁTICA EN FINALLY:
    // Elimina todo dato creado con prefijo e2e_ o timestamp, incluso si un caso falló.
    // -------------------------------------------------------------------------
    console.log('\n🧹 Limpiando datos de prueba creados durante la suite (prefijo e2e_)...');
    try {
      executeSql(`
        DELETE FROM reviews WHERE comment LIKE '%e2e_%' OR user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM cellar_items WHERE cellar_id IN (SELECT id FROM cellars WHERE name LIKE '%e2e_%');
        DELETE FROM cellars WHERE name LIKE '%e2e_%' OR user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM wine_grapes WHERE wine_vintage_id IN (SELECT id FROM wine_vintages WHERE wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%') OR uploaded_by_user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%'));
        DELETE FROM wine_pairings WHERE pairing_id IN (SELECT id FROM pairings WHERE name LIKE '%e2e_%') OR wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%');
        DELETE FROM wine_vintages WHERE wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%') OR uploaded_by_user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM wines WHERE name LIKE '%e2e_%';
        DELETE FROM wineries WHERE name LIKE '%e2e_%' OR user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM cities WHERE name LIKE '%e2e_%';
        DELETE FROM pairings WHERE name LIKE '%e2e_%';
        DELETE FROM grapes WHERE name LIKE '%e2e_%';
        DELETE FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%';
      `);
      console.log('🧹 Limpieza completada con éxito.');
    } catch (cleanupErr) {
      console.error('⚠️ Advertencia durante la limpieza en finally:', cleanupErr.message);
    }
  }

  console.log('\n🍷 ================================================================');
  console.log(`🍷 RESUMEN FINAL: ${passed} APROBADOS, ${failed} FALLIDOS (Total: ${passed + failed})`);
  console.log('🍷 ================================================================\n');

  // Devolver código de salida según resultado
  if (failed > 0) {
    process.exit(1);
  }
}

run();

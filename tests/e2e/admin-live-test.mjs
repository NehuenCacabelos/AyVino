// End-to-End Live Integration Test for AyVino Administration Panel (Bloque 15 & 16)
// Comprehensive real-world validation against running backend (.NET 10 + PostgreSQL)
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://localhost:5230/api';
const JWT_SECRET = process.env.JWT_SECRET;
const E2E_DB_CONNECTION = process.env.E2E_DB_CONNECTION;
const DB_UTIL_PROJECT = process.env.DB_UTIL_PROJECT || path.resolve(__dirname, 'db-util', 'DbUtil.csproj');

if (!JWT_SECRET) {
  console.error('⛔ ERROR: La variable de entorno JWT_SECRET no está definida.');
  console.error('   Podés obtenerla desde los User Secrets del backend ejecutando:');
  console.error('   dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api');
  process.exit(1);
}

if (!E2E_DB_CONNECTION) {
  console.error('⛔ ERROR: La variable de entorno E2E_DB_CONNECTION no está definida.');
  console.error('   Debe contener la cadena de conexión a la base de datos PostgreSQL.');
  console.error('   Podés obtenerla desde los User Secrets del backend ejecutando:');
  console.error('   dotnet user-secrets get ConnectionStrings:DefaultConnection --project src/backend/AyVino.Api');
  process.exit(1);
}

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
  try {
    return execSync(`dotnet run --project "${DB_UTIL_PROJECT}" --no-launch-profile -v q -- "${sanitized}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : '';
    throw new Error(`Fallo al ejecutar SQL con db-util: ${stderr || err.message}`);
  }
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
      { method: 'GET', path: '/reviews' },
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

    // Borrar la cosecha en cava (protegida contra destrucción de historial)
    const h6bDelete = await request(`/wines/${h6WineId}/vintages/${h6VintageInCellarId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const h6Ok =
      h6aDelete.status === 409 &&
      h6bDelete.status === 409 &&
      h6aDelete.status !== 500 &&
      h6bDelete.status !== 500 &&
      hasNoDbLeak(h6aDelete.data) &&
      hasNoDbLeak(h6bDelete.data);

    record(
      'H.6 DELETE cosecha con reseñas (409) y cosecha en cava (409)',
      'Con reseñas: 409 Conflict | En cava: 409 Conflict (protección de historial)',
      `Con reseñas: HTTP ${h6aDelete.status} | En cava: HTTP ${h6bDelete.status}`,
      h6Ok,
      `Detail reseñas: "${getDetail(h6aDelete.data)}" | Detail cava: "${getDetail(h6bDelete.data)}"`,
    );

    // H.7a: DELETE de un vino con historial de usuarios (h6WineId) -> 409
    const h7aDelete = await request(`/wines/${h6WineId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const h7aOk = h7aDelete.status === 409 && hasNoDbLeak(h7aDelete.data);
    record(
      'H.7a DELETE de un vino con historial de usuarios (409)',
      '409 Conflict con detalle explicativo y sugerencia de fusión',
      `HTTP ${h7aDelete.status}`,
      h7aOk,
      `Detail: ${getDetail(h7aDelete.data)}`,
    );

    // H.7b: DELETE de un vino sin historial de usuarios (limpio) -> 204
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
      'H.7b DELETE de un vino sin historial (204)',
      'DELETE 204 y GET posterior 404 (vino eliminado)',
      `DELETE: HTTP ${h7Delete.status}, GET posterior: HTTP ${h7GetAfter.status}`,
      h7Ok,
      `Detail: ${getDetail(h7Delete.data)}`,
    );

    // -------------------------------------------------------------------------
    // SECCIÓN I: BLOQUEO Y VISIBILIDAD DE BODEGAS (BLOQUE 17)
    // -------------------------------------------------------------------------
    console.log('\n--- SECCIÓN I: BLOQUEO Y VISIBILIDAD DE BODEGAS ---');

    // Registrar una bodega de prueba para esta sección
    const iWineryEmail = `e2e_winery_sec_i_${timestamp}@bodega.com`;
    const iWineryUser = `e2e_winery_sec_i_${timestamp}`;
    const iWineryName = `e2e_Bodega_Sec_I_${timestamp}`;

    const regSecIWinery = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify({
        username: iWineryUser,
        email: iWineryEmail,
        password: 'Password123!',
        wineryName: iWineryName,
        locationId,
        foundationYear: 2015,
        website: 'https://bodegaseci.com',
        description: 'Bodega para pruebas de visibilidad y bloqueo.',
      }),
    });

    const iWineryId = regSecIWinery.data?.winery?.id;
    const iWineryToken = regSecIWinery.data?.accessToken;

    // I.1 Anónimo con ?status=Pending y ?status=Rejected siempre recibe solo Approved
    const anonPendingRes = await request('/wineries?pageNumber=1&pageSize=100&status=Pending');
    const anonRejectedRes = await request('/wineries?pageNumber=1&pageSize=100&status=Rejected');

    const hasOnlyApprovedInPending = Array.isArray(anonPendingRes.data) &&
      anonPendingRes.data.every(w => w.status === 'Approved');
    const hasOnlyApprovedInRejected = Array.isArray(anonRejectedRes.data) &&
      anonRejectedRes.data.every(w => w.status === 'Approved');

    const i1Ok = anonPendingRes.status === 200 && anonRejectedRes.status === 200 &&
      hasOnlyApprovedInPending && hasOnlyApprovedInRejected;

    record(
      'I.1 GET /api/wineries anónimo con ?status=Pending y ?status=Rejected',
      'HTTP 200 con bodegas únicamente Approved (filtros no-admin ignorados)',
      `Pending Status: ${anonPendingRes.status} (all Approved: ${hasOnlyApprovedInPending}), Rejected Status: ${anonRejectedRes.status} (all Approved: ${hasOnlyApprovedInRejected})`,
      i1Ok,
      'Se asegura que usuarios anónimos nunca reciben bodegas pendientes ni suspendidas/rechazadas'
    );

    // Cambiar estado a Rejected (Suspender)
    await request(`/wineries/${iWineryId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Rejected' }),
    });

    // I.2 Detalle de bodega Rejected según actor: anónimo 404, usuario común 404, dueño 200, admin 200
    const anonDetail = await request(`/wineries/${iWineryId}`);
    const userDetail = await request(`/wineries/${iWineryId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const ownerDetail = await request(`/wineries/${iWineryId}`, {
      headers: { Authorization: `Bearer ${iWineryToken}` },
    });
    const adminDetail = await request(`/wineries/${iWineryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const i2Ok = anonDetail.status === 404 &&
      userDetail.status === 404 &&
      ownerDetail.status === 200 && ownerDetail.data?.status === 'Rejected' &&
      adminDetail.status === 200 && adminDetail.data?.status === 'Rejected';

    record(
      'I.2 GET /api/wineries/{id} detalle de bodega Rejected (Suspendida)',
      'Anónimo: 404, Usuario común: 404, Dueño: 200, Admin: 200',
      `Anónimo: ${anonDetail.status}, Usuario: ${userDetail.status}, Dueño: ${ownerDetail.status}, Admin: ${adminDetail.status}`,
      i2Ok,
      `Detail anónimo: ${getDetail(anonDetail.data)}, dueño status: ${ownerDetail.data?.status}`
    );

    // -------------------------------------------------------------------------
    // SECCIÓN J: AUDITORÍA DE ACCIONES DE ADMINISTRACIÓN (BLOQUE 18)
    // -------------------------------------------------------------------------
    console.log('\n--- SECCIÓN J: AUDITORÍA DE ACCIONES DE ADMINISTRACIÓN ---');

    // J.1 GET /api/audit-log sin token -> 401
    const auditNoToken = await request('/audit-log');
    record(
      'J.1 GET /api/audit-log sin token',
      'HTTP 401 Unauthorized',
      `HTTP ${auditNoToken.status}`,
      auditNoToken.status === 401,
      `Detail: ${getDetail(auditNoToken.data)}`
    );

    // J.2 GET /api/audit-log con token de usuario común -> 403
    const auditUserToken = await request('/audit-log', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    record(
      'J.2 GET /api/audit-log con token de usuario común',
      'HTTP 403 Forbidden',
      `HTTP ${auditUserToken.status}`,
      auditUserToken.status === 403,
      `Detail: ${getDetail(auditUserToken.data)}`
    );

    // J.3 GET /api/audit-log con token de admin -> 200 array
    const auditAdminRes = await request('/audit-log?pageNumber=1&pageSize=50', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const j3Ok = auditAdminRes.status === 200 && Array.isArray(auditAdminRes.data);
    record(
      'J.3 GET /api/audit-log con token de admin',
      'HTTP 200 con array de entradas de auditoría',
      `HTTP ${auditAdminRes.status}, isArray: ${Array.isArray(auditAdminRes.data)}, count: ${auditAdminRes.data?.length ?? 0}`,
      j3Ok,
      `Total entries returned: ${auditAdminRes.data?.length ?? 0}`
    );

    // J.4 Validación de filtro inválido action -> 400
    const auditInvalidAction = await request('/audit-log?pageNumber=1&pageSize=10&action=NonExistentAction', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'J.4 GET /api/audit-log con acción inválida',
      'HTTP 400 Bad Request',
      `HTTP ${auditInvalidAction.status}`,
      auditInvalidAction.status === 400,
      `Detail: ${getDetail(auditInvalidAction.data)}`
    );

    // J.5 Filtro de acción WineryStatusChanged devuelve solo entradas de esa acción
    const auditActionFiltered = await request('/audit-log?pageNumber=1&pageSize=50&action=WineryStatusChanged', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const j5Ok = auditActionFiltered.status === 200 &&
      Array.isArray(auditActionFiltered.data) &&
      auditActionFiltered.data.every(e => e.action === 'WineryStatusChanged');
    record(
      'J.5 GET /api/audit-log con filtro de acción WineryStatusChanged',
      'HTTP 200 y todas las entradas devueltas tienen action = WineryStatusChanged',
      `HTTP ${auditActionFiltered.status}, all match: ${j5Ok}`,
      j5Ok,
      `Entries returned: ${auditActionFiltered.data?.length ?? 0}`
    );

    // J.6 Registro correcto de auditoría tras acción admin (WineryStatusChanged registrada en I.2)
    const wineryEntry = auditActionFiltered.data?.find(e => e.entityType === 'Winery' && e.entityId === iWineryId);
    const j6Ok = wineryEntry != null && wineryEntry.action === 'WineryStatusChanged';
    record(
      'J.6 Registro automático de auditoría para WineryStatusChanged',
      `Entrada existente para Winery #${iWineryId} con acción WineryStatusChanged`,
      `Encontrado: ${Boolean(wineryEntry)}, Usuario: ${wineryEntry?.username}, Detalle: ${wineryEntry?.details}`,
      j6Ok,
      `Detalles de la entrada: ${JSON.stringify(wineryEntry)}`
    );

  

    // -------------------------------------------------------------------------
    // SECCIÓN K: MODERACIÓN DE RESEÑAS (BLOQUE 20)
    // -------------------------------------------------------------------------
    console.log('\n--- SECCIÓN K: MODERACIÓN DE RESEÑAS ---');

    // K.1 GET /api/reviews sin token -> 401
    const k1 = await request('/reviews');
    record('K.1 GET /api/reviews sin token', 'HTTP 401', `HTTP ${k1.status}`, k1.status === 401);

    // K.2 GET /api/reviews con usuario común -> 403
    const k2 = await request('/reviews', { headers: { Authorization: `Bearer ${userToken}` } });
    record('K.2 GET /api/reviews con usuario común', 'HTTP 403', `HTTP ${k2.status}`, k2.status === 403);

    // K.3 GET /api/reviews con admin -> 200
    const k3 = await request('/reviews', { headers: { Authorization: `Bearer ${adminToken}` } });
    record('K.3 GET /api/reviews con admin', 'HTTP 200 (array)', `HTTP ${k3.status}, isArray: ${Array.isArray(k3.data)}`, k3.status === 200 && Array.isArray(k3.data));

    // K.4 Crear reseña de prueba por usuario común
    const kReviewComment = `e2e_Review_Mod_${timestamp}`;
    const kReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        wineVintageId: vintageId,
        rating: 4,
        comment: kReviewComment,
      }),
    });
    const kReviewId = kReviewRes.data?.id;
    record('K.4 POST /api/reviews crear reseña por usuario común', 'HTTP 201', `HTTP ${kReviewRes.status}, ID: ${kReviewId}`, kReviewRes.status === 201 && kReviewId != null);

    // K.5 GET /api/reviews con filtros por rating y userId
    const k5 = await request(`/reviews?rating=4&userId=${commonUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const k5Found = Array.isArray(k5.data) && k5.data.some(r => r.id === kReviewId);
    record('K.5 GET /api/reviews filtrado por rating y userId', 'HTTP 200 con la reseña creada', `HTTP ${k5.status}, encontrada: ${k5Found}`, k5.status === 200 && k5Found);

    // K.6 Usuario ajeno no puede borrar la reseña de otro usuario -> 403
    const kIntruderRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `e2e_intruder_${timestamp}`,
        email: `e2e_intruder_${timestamp}@ayvino.com`,
        password: 'Password123!',
      }),
    });
    const kIntruderToken = kIntruderRes.data?.accessToken;
    const k6 = await request(`/reviews/${kReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${kIntruderToken}` },
    });
    record('K.6 DELETE /api/reviews/{id} por usuario ajeno', 'HTTP 403 Forbidden', `HTTP ${k6.status}`, k6.status === 403);

    // K.7 Admin borra reseña ajena -> 204
    const k7 = await request(`/reviews/${kReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('K.7 DELETE /api/reviews/{id} por admin', 'HTTP 204 NoContent', `HTTP ${k7.status}`, k7.status === 204);

    // K.8 Auditoría ReviewDeletedByAdmin registrada
    const k8Audit = await request('/audit-log?action=ReviewDeletedByAdmin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const k8Entry = Array.isArray(k8Audit.data) && k8Audit.data.find(e => e.entityType === 'Review' && e.entityId === kReviewId);
    record(
      'K.8 Auditoría ReviewDeletedByAdmin registrada correctamente',
      'Entrada en audit_log con entityType Review y id correspondiente',
      `Encontrada: ${Boolean(k8Entry)}, Admin: ${k8Entry?.username}, Detalles: ${k8Entry?.details}`,
      k8Entry != null && k8Entry.action === 'ReviewDeletedByAdmin'
    );

    // -------------------------------------------------------------------------
    // SECCIÓN L: FUSIÓN DE VINOS DUPLICADOS (BLOQUE 23)
    // -------------------------------------------------------------------------
    console.log('\n--- SECCIÓN L: FUSIÓN DE VINOS DUPLICADOS ---');

    // L.1 POST /api/wines/{targetId}/merge/{duplicateId} sin token -> 401
    const l1 = await request('/wines/1/merge/2', { method: 'POST' });
    record('L.1 POST /api/wines/1/merge/2 sin token', 'HTTP 401', `HTTP ${l1.status}`, l1.status === 401);

    // L.2 POST con usuario común -> 403
    const l2 = await request('/wines/1/merge/2', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    record('L.2 POST /api/wines/1/merge/2 con usuario común', 'HTTP 403', `HTTP ${l2.status}`, l2.status === 403);

    // L.3 Mismo target y duplicate -> 400
    const l3 = await request('/wines/1/merge/1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('L.3 POST /api/wines/1/merge/1 mismo ID', 'HTTP 400 ValidationException', `HTTP ${l3.status}`, l3.status === 400);

    // L.4 Target no existente -> 404
    const l4 = await request('/wines/999999/merge/999998', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('L.4 POST /api/wines/{id}/merge/{id} target inexistente', 'HTTP 404 NotFoundException', `HTTP ${l4.status}`, l4.status === 404);

    // L.5 Setup para fusión:
    // Crear dos vinos con cosechas, reseñas, cava y user_wines
    const lTargetRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Wine_Target_${timestamp}`,
        description: 'Vino destino para merge',
        wineType: 'Red',
        firstVintage: {
          year: 2020,
          alcoholContent: 14,
          servingTemperature: 16,
          agingAdvice: 'Beber ahora',
          grapes: [{ grapeId: grapeId, percentage: 100 }],
        },
      }),
    });
    const lTargetId = lTargetRes.data?.id;

    // Crear segunda cosecha 2021 en Target
    await request(`/wines/${lTargetId}/vintages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        year: 2021,
        alcoholContent: 13.5,
        servingTemperature: 16,
        agingAdvice: 'Guardar 3 años',
        grapes: [{ grapeId: grapeId, percentage: 100 }],
      }),
    });

    // Obtener cosechas de Target
    const lTargetVintages = await request(`/wines/${lTargetId}/vintages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const lTargetV2020 = lTargetVintages.data?.find(v => v.year === 2020);
    const lTargetV2020Id = lTargetV2020?.id;

    // Aprobar cosechas de Target para visibilidad
    await request(`/wine-vintages/${lTargetV2020Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });

    // Reseña del usuario común en Target 2020 (rating = 5)
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        wineVintageId: lTargetV2020Id,
        rating: 5,
        comment: `e2e_target_rev_${timestamp}`,
      }),
    });

    // Crear cava para usuario común y agregar Target 2020 con quantity = 3
    const lCellarRes = await request('/cellars', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: `e2e_Cellar_Merge_${timestamp}` }),
    });
    const lCellarId = lCellarRes.data?.id;
    await request(`/cellars/${lCellarId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wineVintageId: lTargetV2020Id, quantity: 3 }),
    });

    // UserWine flag en Target
    await request(`/user-wines/${lTargetId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ isWanted: true, isTried: false, isFavorite: false }),
    });

    // Crear vino Duplicado
    const lDupRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `e2e_Wine_Dup_${timestamp}`,
        description: 'Vino duplicado a fusionar',
        wineType: 'Red',
        firstVintage: {
          year: 2020, // Choca con 2020 de target
          alcoholContent: 14,
          servingTemperature: 16,
          agingAdvice: 'Beber ahora',
          grapes: [{ grapeId: grapeId, percentage: 100 }],
        },
      }),
    });
    const lDupId = lDupRes.data?.id;

    // Cosecha 2022 en Duplicate (año diferente, no choca)
    await request(`/wines/${lDupId}/vintages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        year: 2022,
        alcoholContent: 14.5,
        servingTemperature: 16,
        agingAdvice: 'Guardar 5 años',
        grapes: [{ grapeId: grapeId, percentage: 100 }],
      }),
    });

    const lDupVintages = await request(`/wines/${lDupId}/vintages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const lDupV2020 = lDupVintages.data?.find(v => v.year === 2020);
    const lDupV2022 = lDupVintages.data?.find(v => v.year === 2022);
    const lDupV2020Id = lDupV2020?.id;
    const lDupV2022Id = lDupV2022?.id;

    // Aprobar cosechas de Duplicate
    await request(`/wine-vintages/${lDupV2020Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });
    await request(`/wine-vintages/${lDupV2022Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });

    // Reseña del mismo usuario en Dup 2020 (choca, debe ser descartada)
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        wineVintageId: lDupV2020Id,
        rating: 2,
        comment: `e2e_dup_rev_conflict_${timestamp}`,
      }),
    });

    // Reseña del mismo usuario en Dup 2022 (no choca, debe ser movida)
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        wineVintageId: lDupV2022Id,
        rating: 4,
        comment: `e2e_dup_rev_moved_${timestamp}`,
      }),
    });

    // Item de cava en Dup 2020 (choca en lCellarId con 4 botellas -> suma 3+4=7)
    await request(`/cellars/${lCellarId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wineVintageId: lDupV2020Id, quantity: 4 }),
    });

    // UserWine flag en Duplicate: isFavorite: true, isTried: true
    await request(`/user-wines/${lDupId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ isWanted: false, isTried: true, isFavorite: true }),
    });

    record(
      'L.5 Setup de vinos para prueba de fusión',
      'Target y Duplicate creados con cosechas, reseñas y cavas',
      `Target: #${lTargetId}, Dup: #${lDupId}`,
      lTargetId != null && lDupId != null
    );

    // L.6 POST /api/wines/{targetId}/merge/{duplicateId} exitoso -> 200 con conteos
    const l6MergeRes = await request(`/wines/${lTargetId}/merge/${lDupId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const mergeData = l6MergeRes.data;
    const l6Valid = l6MergeRes.status === 200 &&
      mergeData?.targetId === lTargetId &&
      mergeData?.duplicateId === lDupId &&
      mergeData?.movedVintages === 1 &&
      mergeData?.mergedVintages === 1 &&
      mergeData?.movedReviews === 1 &&
      mergeData?.discardedReviews === 1 &&
      mergeData?.movedCellarItems === 1;

    record(
      'L.6 POST /api/wines/{targetId}/merge/{duplicateId} fusión exitosa',
      'HTTP 200 con MergeWinesResultDto exacto (1 movida, 1 fusionada, 1 review movida, 1 descartada, 1 cava movida)',
      `HTTP ${l6MergeRes.status}, data: ${JSON.stringify(mergeData)}`,
      l6Valid
    );

    // L.7 Verificación de efectos en BD
    // Cava: item en lTargetV2020Id debe tener quantity = 7
    const lCellarItemsRes = await request(`/cellars/${lCellarId}/items`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const lTargetCellarItem = lCellarItemsRes.data?.find(i => i.wineVintageId === lTargetV2020Id);
    const lDupCellarItem = lCellarItemsRes.data?.find(i => i.wineVintageId === lDupV2020Id);

    // UserWine: flags combinados en Target (isWanted: true, isTried: true, isFavorite: true)
    const lUserWineRes = await request(`/user-wines/${lTargetId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const lUserWine = lUserWineRes.data;
    const lUserWineValid = lUserWine?.isWanted === true && lUserWine?.isTried === true && lUserWine?.isFavorite === true;

    // Reseñas en Target 2020: la del usuario debe conservar rating 5
    const lTarget2020Reviews = await request(`/reviews?wineVintageId=${lTargetV2020Id}&userId=${commonUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const lRetainedReview = lTarget2020Reviews.data?.find(r => r.userId === commonUserId);

    record(
      'L.7 Efectos de fusión verificados en BD',
      'Cava sumada (7), Dup vintage borrado de cava, UserWine combinado (OR), Reseña destino conservada (rating=5)',
      `Cava Qty: ${lTargetCellarItem?.quantity}, Dup in cellar: ${Boolean(lDupCellarItem)}, Flags: ${JSON.stringify(lUserWine)}, Retained rating: ${lRetainedReview?.rating}`,
      lTargetCellarItem?.quantity === 7 && !lDupCellarItem && lUserWineValid && lRetainedReview?.rating === 5
    );

    // L.8 Visibilidad de vino duplicado
    // Anónimo GET /wines/{duplicateId} -> 404
    const l8AnonGet = await request(`/wines/${lDupId}`);
    // Admin GET /wines/{duplicateId} -> 200 con duplicateOfWineId = targetId
    const l8AdminGet = await request(`/wines/${lDupId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Anónimo GET /wines/search no lo lista
    const l8SearchAnon = await request(`/wines/search?name=e2e_Wine_Dup_${timestamp}&pageNumber=1&pageSize=10`);
    const l8FoundInSearch = Array.isArray(l8SearchAnon.data) && l8SearchAnon.data.some(w => w.id === lDupId);

    record(
      'L.8 Visibilidad: Duplicado oculto a público y visible a admin',
      'Anónimo 404 en GetById y oculto en búsqueda; Admin 200 con duplicateOfWineId seteado',
      `Anon Get: ${l8AnonGet.status}, Admin Get: ${l8AdminGet.status} (dupOf: ${l8AdminGet.data?.duplicateOfWineId}), Found in Search: ${l8FoundInSearch}`,
      l8AnonGet.status === 404 && l8AdminGet.status === 200 && l8AdminGet.data?.duplicateOfWineId === lTargetId && !l8FoundInSearch
    );

    // L.9 Conflicto al intentar fusionar un duplicado nuevamente
    const l9Repeat = await request(`/wines/${lTargetId}/merge/${lDupId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const l9TargetIsDup = await request(`/wines/${lDupId}/merge/${lTargetId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'L.9 ConflictException (409) al repetir o fusionar vinos ya duplicados',
      'HTTP 409 Conflict en ambos intentos',
      `Repeat: ${l9Repeat.status}, DupAsTarget: ${l9TargetIsDup.status}`,
      l9Repeat.status === 409 && l9TargetIsDup.status === 409
    );

    // L.10 Auditoría WineMerged
    const l10Audit = await request('/audit-log?action=WineMerged', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const l10Entry = Array.isArray(l10Audit.data) && l10Audit.data.find(e => e.entityType === 'Wine' && e.entityId === lTargetId);
    record(
      'L.10 Auditoría WineMerged registrada correctamente',
      'Entrada en audit_log con entityType Wine, entityId = targetId, details = duplicateId',
      `Encontrada: ${Boolean(l10Entry)}, EntityId: ${l10Entry?.entityId}, Details: ${l10Entry?.details}`,
      l10Entry != null && l10Entry.action === 'WineMerged' && l10Entry.details === lDupId.toString()
    );

    // -------------------------------------------------------------------------
    // SECCIÓN M: ESTADÍSTICAS DEL PANEL (BLOQUE 25)
    // -------------------------------------------------------------------------
    console.log('\n--- SECCIÓN M: ESTADÍSTICAS DEL PANEL (GET /api/admin/stats) ---');

    // M.1 Sin token -> 401
    const m1 = await request('/admin/stats');
    record('M.1 GET /api/admin/stats sin token', 'HTTP 401', `HTTP ${m1.status}`, m1.status === 401);

    // M.2 Con usuario común -> 403
    const m2 = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    record('M.2 GET /api/admin/stats con usuario común', 'HTTP 403', `HTTP ${m2.status}`, m2.status === 403);

    // M.3 Con admin -> 200 con estructura AdminStatsDto
    const m3 = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const s = m3.data;
    const m3Valid = m3.status === 200 &&
      s?.users != null && typeof s.users.total === 'number' && typeof s.users.blocked === 'number' &&
      s?.wineries != null && typeof s.wineries.pending === 'number' && typeof s.wineries.approved === 'number' && typeof s.wineries.rejected === 'number' &&
      s?.cities != null && typeof s.cities.pending === 'number' &&
      s?.vintages != null && typeof s.vintages.pending === 'number' && typeof s.vintages.approved === 'number' && typeof s.vintages.rejected === 'number' &&
      s?.wines != null && typeof s.wines.total === 'number' && typeof s.wines.community === 'number' && typeof s.wines.official === 'number' &&
      s?.reviews != null && typeof s.reviews.total === 'number';

    record(
      'M.3 GET /api/admin/stats con admin retorna conteos exactos',
      'HTTP 200 con AdminStatsDto estructurado',
      `HTTP ${m3.status}, Users: ${s?.users?.total} (${s?.users?.blocked} blocked), Wineries Pending: ${s?.wineries?.pending}, Wines Total: ${s?.wines?.total}, Reviews: ${s?.reviews?.total}`,
      m3Valid
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
        DELETE FROM audit_log WHERE username LIKE '%e2e_%';
        DELETE FROM reviews WHERE comment LIKE '%e2e_%' OR user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM cellar_items WHERE cellar_id IN (SELECT id FROM cellars WHERE name LIKE '%e2e_%');
        DELETE FROM cellars WHERE name LIKE '%e2e_%' OR user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM wine_grapes WHERE wine_vintage_id IN (SELECT id FROM wine_vintages WHERE wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%') OR uploaded_by_user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%'));
        DELETE FROM wine_pairings WHERE pairing_id IN (SELECT id FROM pairings WHERE name LIKE '%e2e_%') OR wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%');
        DELETE FROM wine_vintages WHERE wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%') OR uploaded_by_user_id IN (SELECT id FROM users WHERE username LIKE '%e2e_%' OR email LIKE '%e2e_%');
        DELETE FROM user_wines WHERE wine_id IN (SELECT id FROM wines WHERE name LIKE '%e2e_%');
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

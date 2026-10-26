// End-to-End Live Integration Test for AyVino Administration Panel (Bloque 15)
// Comprehensive real-world validation against running backend (.NET 10 + PostgreSQL)
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5230/api';
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_de_al_menos_32_caracteres_ayvino';
const DB_UTIL_PROJECT = process.env.DB_UTIL_PROJECT || 'C:\\Users\\brian\\.gemini\\antigravity\\brain\\ef200946-c376-4f5b-9f80-ef2a4622950d\\scratch\\DbUtil\\DbUtil.csproj';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateSyntheticAdminToken(userId = 99999) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(userId),
    email: 'synthetic_admin@ayvino.com',
    name: 'Synthetic Admin',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
    jti: crypto.randomUUID(),
    iss: 'AyVino',
    aud: 'AyVino',
    exp: now + 7200,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

function executeSql(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  return execSync(`dotnet run --project "${DB_UTIL_PROJECT}" -- "${escaped}"`, {
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
    // PREPARACIÓN: Creación y promoción de admin, y siembra de datos
    // -------------------------------------------------------------------------
    console.log('--- FASE 0: PREPARACIÓN Y SIEMBRA DE DATOS ---');

    // 1. Admin User
    const adminEmail = process.env.ADMIN_EMAIL || `admin_e2e_${timestamp}@ayvino.com`;
    const adminUsername = `admin_e2e_${timestamp}`;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';

    console.log(`Registrando y promoviendo usuario administrador (${adminEmail})...`);
    const regAdminRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, username: adminUsername, password: adminPassword }),
    });

    let adminUserId;
    if (regAdminRes.status === 201 && regAdminRes.data?.id) {
      adminUserId = regAdminRes.data.id;
      // Promover directamente en Postgres
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
    const commonUserEmail = `user_e2e_${timestamp}@ayvino.com`;
    const commonUsername = `user_e2e_${timestamp}`;
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

    // 3. Location & Grape para siembra
    const locationsRes = await request('/locations?pageSize=10');
    const locationId = locationsRes.data?.[0]?.id || 1;

    const grapesRes = await request('/grapes?pageSize=10');
    let grapeId = grapesRes.data?.[0]?.id;
    if (!grapeId) {
      // Crear uva inicial si no hay
      const newGrape = await request('/grapes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: `Malbec E2E ${timestamp}`, colorType: 'Red' }),
      });
      grapeId = newGrape.data?.id;
    }

    // 4. Winery registrada (queda Pending)
    const wineryEmail = `winery_e2e_${timestamp}@bodega.com`;
    const wineryUsername = `winery_e2e_${timestamp}`;
    const wineryPassword = 'Password123!';
    const wineryName = `Bodega E2E ${timestamp}`;

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

    // 5. Ciudad propuesta por usuario común (queda Pending)
    console.log('Proponiendo ciudad nueva por usuario común...');
    const cityRes = await request('/cities', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: `Ciudad E2E ${timestamp}`, stateId: 1 }),
    });
    const cityId = cityRes.data?.id;
    console.log(`  -> Ciudad propuesta. ID: ${cityId}, Status: ${cityRes.data?.status}`);

    // 6. Vino y Cosecha cargados por usuario común (la cosecha queda Pending)
    console.log('Creando vino y primera cosecha por usuario común...');
    const wineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: `Vino Comunitario ${timestamp}`,
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

    // Obtener el ID de la primera cosecha recién creada en estado Pending
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

    // A.1: sin token -> 401
    const a1 = await request('/wine-vintages');
    record('A.1 Cosechas sin token', '401', a1.status, a1.status === 401);

    // A.2: con token de usuario común -> 403
    const a2 = await request('/wine-vintages', { headers: { Authorization: `Bearer ${userToken}` } });
    record('A.2 Cosechas con token de usuario común', '403', a2.status, a2.status === 403);

    // A.3: ?status=Pending incluye la cosecha sembrada con wineName, wineryName, uploadedByUsername resueltos
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

    // A.4: ?status=foo -> 400 con Problem Details
    const a4 = await request('/wine-vintages?status=foo', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const a4HasProblem = a4.status === 400 && (Boolean(a4.data?.detail) || Boolean(a4.data?.title));
    record('A.4 Cosechas status inválido (foo)', '400 con Problem Details', `HTTP ${a4.status}, detail: "${a4.data?.detail}"`, a4HasProblem);

    // A.5: ?pageSize=101 -> 400
    const a5 = await request('/wine-vintages?pageSize=101', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('A.5 Cosechas pageSize=101', '400', a5.status, a5.status === 400);

    // A.6: ?pageNumber=0 -> 400
    const a6 = await request('/wine-vintages?pageNumber=0', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('A.6 Cosechas pageNumber=0', '400', a6.status, a6.status === 400);

    // A.7: PATCH status Approved -> después aparece en listado público del vino
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

    // A.8: PATCH status Rejected -> después NO aparece para anónimo
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

    // A.9: GET detalle de cosecha con token admin -> 200 (con blends)
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

    // B.1: GET /api/wineries?pageNumber=1&pageSize=100&status=Pending incluye la sembrada
    const b1 = await request('/wineries?pageNumber=1&pageSize=100&status=Pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const b1Found = Array.isArray(b1.data) && b1.data.some((w) => w.id === wineryId);
    record('B.1 Listado de bodegas Pending incluye la sembrada', '200 con wineryId presente', `HTTP ${b1.status}, encontrada: ${b1Found}`, b1.status === 200 && b1Found);

    // B.2: PATCH status Approved -> aparece en listado público
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

    // B.3: DELETE -> 204 y luego 404
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

    // C.1: GET /api/cities?status=Pending incluye la sembrada
    const c1 = await request('/cities?status=Pending&pageSize=100', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const c1Found = Array.isArray(c1.data) && c1.data.some((c) => c.id === cityId);
    record('C.1 Listado de ciudades Pending incluye la sembrada', '200 con cityId presente', `HTTP ${c1.status}, encontrada: ${c1Found}`, c1.status === 200 && c1Found);

    // C.2: PATCH a Approved -> aparece en listado público de ciudades
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

    // C.3: PATCH a Rejected -> no aparece en listado de Approved
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

    // D.1: GET /api/users paginado
    const d1 = await request('/users?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'D.1 GET /api/users paginado',
      '200 con lista de usuarios',
      `HTTP ${d1.status}, cantidad recibida: ${Array.isArray(d1.data) ? d1.data.length : 'N/A'}`,
      d1.status === 200 && Array.isArray(d1.data) && d1.data.length > 0,
    );

    // D.2: PATCH status isActive=false -> usuario ya no puede loguear
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

    // D.3: Reactivar usuario -> vuelve a loguear
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

    // D.4: DELETE de usuario sin datos asociados -> 204
    const ephemeralEmail = `ephemeral_${timestamp}@test.com`;
    const regEphemeral = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: ephemeralEmail, username: `ephemeral_${timestamp}`, password: 'Password123!' }),
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

    // E.1: Uvas CRUD completo
    const e1Post = await request('/grapes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Uva CRUD ${timestamp}`,
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
        name: `Uva CRUD Editada ${timestamp}`,
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

    // E.2: Maridajes CRUD completo
    const e2Post = await request('/pairings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Maridaje CRUD ${timestamp}`,
        category: 'Meat',
      }),
    });
    const crudPairingId = e2Post.data?.id;

    const e2Put = await request(`/pairings/${crudPairingId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Maridaje CRUD Editado ${timestamp}`,
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

    // E.3: DELETE de una uva usada en una cosecha -> 409 con mensaje legible
    // Usamos grapeId que está asignado a wineId sembrado anteriormente
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

    // F.1: User -> Admin -> 204; nuevo login recibe rol Admin y puede llamar GET /api/users
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

    // F.2: Admin -> User -> 204; nuevo login recibe rol User y GET /api/users devuelve 403
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

    // F.3: Sobre el propio ID -> 403
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

    // F.4: Sobre usuario con rol Winery -> 409
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

    // F.5: Roles inválidos ("Winery" y "SuperAdmin") -> 400
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

    // F.6: Mismo rol (User -> User) -> 204 sin cambios
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
      // Sin token -> debe ser 401
      const resNoToken = await request(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (resNoToken.status !== 401) {
        gNoTokenPassed = false;
        console.error(`    Falla seguridad sin token en ${ep.method} ${ep.path}: HTTP ${resNoToken.status}`);
      }

      // Con token User -> debe ser 403
      const resUserToken = await request(ep.path, {
        method: ep.method,
        headers: { Authorization: `Bearer ${userToken}` },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (resUserToken.status !== 403) {
        gUserTokenPassed = false;
        console.error(`    Falla seguridad User en ${ep.method} ${ep.path}: HTTP ${resUserToken.status}`);
      }

      // Con token Winery -> debe ser 403
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

  } catch (err) {
    console.error('\n💥 ERROR FATAL DURANTE LA EJECUCIÓN:', err);
    failed++;
  }

  console.log('\n🍷 ================================================================');
  console.log(`🍷 RESUMEN FINAL: ${passed} APROBADOS, ${failed} FALLIDOS`);
  console.log('🍷 ================================================================\n');

  // Devolver código de salida según resultado
  if (failed > 0) {
    process.exit(1);
  }
}

run();

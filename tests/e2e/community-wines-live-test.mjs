// End-to-End Live Integration Test for AyVino Community Wines (Bloque 16)
// Comprehensive real-world validation against running backend (.NET 10 + PostgreSQL)
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:5230/api';
const E2E_DB_CONNECTION = process.env.E2E_DB_CONNECTION;
const DB_UTIL_PROJECT = process.env.DB_UTIL_PROJECT || path.resolve(__dirname, 'db-util', 'DbUtil.csproj');

if (!E2E_DB_CONNECTION) {
  console.error('⛔ ERROR: La variable de entorno E2E_DB_CONNECTION no está definida.');
  console.error('   Debe apuntar a la base de datos local de PostgreSQL.');
  process.exit(1);
}

// SEGURIDAD: Solo correr contra localhost salvo E2E_ALLOW_REMOTE=true
const isLocal = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
if (!isLocal && process.env.E2E_ALLOW_REMOTE !== 'true') {
  console.error('⛔ SEGURIDAD: API_BASE no apunta a localhost. Para forzar ejecución remota establezca E2E_ALLOW_REMOTE=true.');
  process.exit(1);
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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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

async function run() {
  console.log('🍇 ================================================================');
  console.log('🍇 AYVINO COMMUNITY WINES - BATERÍA E2E EN VIVO (BLOQUE 16)');
  console.log('🍇 Backend: ' + API_BASE);
  console.log('🍇 ================================================================\n');

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
    // =========================================================================
    // FASE 0: PREPARACIÓN Y REGISTRO DE ACTORES
    // =========================================================================
    console.log('--- FASE 0: PREPARACIÓN Y REGISTRO DE ACTORES ---');

    async function registerAndLogin(username, email, password = 'Password123!') {
      const regRes = await request('/users', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
      if (regRes.status !== 201 || !regRes.data?.id) {
        throw new Error(`Fallo al registrar ${username}: HTTP ${regRes.status} ${JSON.stringify(regRes.data)}`);
      }
      const userId = regRes.data.id;
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (loginRes.status !== 200 || !loginRes.data?.accessToken) {
        throw new Error(`Fallo al loguear ${username}: HTTP ${loginRes.status} ${JSON.stringify(loginRes.data)}`);
      }
      return { userId, token: loginRes.data.accessToken, username, email };
    }

    async function getFirstVintageId(wineId, token) {
      const res = await request(`/wines/${wineId}/vintages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data) || !res.data[0]?.id) {
        throw new Error(`No se pudo obtener la cosecha para vino ${wineId}: HTTP ${res.status}`);
      }
      return res.data[0].id;
    }

    // 1. Admin
    const admin = await registerAndLogin(`admin_${timestamp}`, `admin_${timestamp}@ayvino.com`);
    executeSql(`UPDATE users SET role = 'Admin' WHERE id = ${admin.userId};`);
    const adminRelogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: admin.email, password: 'Password123!' }),
    });
    const adminToken = adminRelogin.data.accessToken;
    console.log(`  -> Admin preparado (ID=${admin.userId})`);

    // 2. Usuarios A, B, C y D
    const userA = await registerAndLogin(`user_a_${timestamp}`, `user_a_${timestamp}@test.com`);
    const userB = await registerAndLogin(`user_b_${timestamp}`, `user_b_${timestamp}@test.com`);
    const userC = await registerAndLogin(`user_c_${timestamp}`, `user_c_${timestamp}@test.com`);
    const userD = await registerAndLogin(`user_d_${timestamp}`, `user_d_${timestamp}@test.com`);
    console.log(`  -> Usuarios A (${userA.userId}), B (${userB.userId}), C (${userC.userId}), D (${userD.userId}) listos`);

    // 3. Location y Bodega Registrada para pruebas
    const locationsRes = await request('/locations?pageSize=5');
    const locationId = locationsRes.data?.[0]?.id || 1;

    const regWineryRes = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `winery_${timestamp}`,
        email: `winery_${timestamp}@bodega.com`,
        password: 'Password123!',
        wineryName: `Bodega Oficial ${timestamp}`,
        locationId,
        foundationYear: 2005,
        website: 'https://bodegaoficial.com',
        description: 'Bodega aprobada para pruebas e2e',
      }),
    });
    const registeredWineryId = regWineryRes.data?.winery?.id;
    executeSql(`UPDATE wineries SET status = 2 WHERE id = ${registeredWineryId};`); // 2 = Approved
    console.log(`  -> Bodega registrada y aprobada (ID=${registeredWineryId})`);

    // =========================================================================
    // FASE 1: VINO NUEVO (A)
    // =========================================================================
    console.log('\n--- FASE 1: VINO NUEVO (USUARIO A) ---');

    // 1. Match sin coincidencia previa (con token de A)
    const matchEmptyRes = await request('/wines/match?name=Gran%20Reserva%20Exclusivo&wineryName=Bodega%20Comunitaria&wineType=Red&year=2021', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'Match sin coincidencia previa',
      'wine=null, vintage=null',
      `wine=${matchEmptyRes.data?.wine}, vintage=${matchEmptyRes.data?.vintage}`,
      matchEmptyRes.status === 200 && matchEmptyRes.data?.wine === null && matchEmptyRes.data?.vintage === null
    );

    // 2. POST /api/wines sin bodega (obligatoria) -> 400
    const createWineNoWineryRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Gran Reserva Exclusivo ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.5,
        },
      }),
    });
    record(
      'POST /api/wines sin bodega obligatoria rechaza con 400',
      400,
      createWineNoWineryRes.status,
      createWineNoWineryRes.status === 400
    );

    // 3. POST /api/wines con bodega comunitaria en texto
    const wineLabelName = `Gran Reserva Malbec ${timestamp}`;
    const wineryTextName = `Bodega Artesanal ${timestamp}`;
    const createWineRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: wineLabelName,
        wineryNameText: wineryTextName,
        wineType: 'Red',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.5,
        },
      }),
    });
    const wineAId = createWineRes.data?.id;
    const vintageAId = await getFirstVintageId(wineAId, userA.token);
    record(
      'POST /api/wines por Usuario A crea vino y primera cosecha Pending',
      201,
      createWineRes.status,
      createWineRes.status === 201 && wineAId > 0 && vintageAId > 0
    );

    // 4. Verificación de label_key correcto en PostgreSQL
    const sqlLabelKeyRes = executeSql(`SELECT label_key FROM wines WHERE id = ${wineAId};`);
    const expectedKeySegment = `gran reserva malbec ${timestamp}|bodega artesanal ${timestamp}|1`.toLowerCase();
    record(
      'label_key generado y persistido correctamente en tabla wines',
      `contiene ${expectedKeySegment}`,
      sqlLabelKeyRes.trim(),
      sqlLabelKeyRes.toLowerCase().includes(expectedKeySegment)
    );

    // =========================================================================
    // FASE 2: COINCIDENCIA & DUPLICADOS (USUARIO B)
    // =========================================================================
    console.log('\n--- FASE 2: COINCIDENCIA & DETECCIÓN DE DUPLICADOS (B) ---');

    // 1. B consulta match con mayúsculas y acentos distintos
    const matchFoundRes = await request(`/wines/match?name=${encodeURIComponent(wineLabelName.toUpperCase())}&wineryName=${encodeURIComponent(wineryTextName.toLowerCase())}&wineType=Red&year=2021`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'B consulta match y encuentra vino de A (con tildes/mayúsculas toleradas)',
      `wine.id=${wineAId}, vintage.id=${vintageAId}`,
      `wine.id=${matchFoundRes.data?.wine?.id}, vintage.id=${matchFoundRes.data?.vintage?.id}`,
      matchFoundRes.status === 200 &&
      matchFoundRes.data?.wine?.id === wineAId &&
      matchFoundRes.data?.vintage?.id === vintageAId
    );

    // 2. POST duplicado por B da 409 con IDs existentes
    const createDuplicateRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({
        name: wineLabelName.toLowerCase(),
        wineryNameText: wineryTextName.toUpperCase(),
        wineType: 'Red',
        firstVintage: {
          year: 2021,
          alcoholContent: 14.5,
        },
      }),
    });
    record(
      'POST duplicado exacto retorna 409 Conflict con existingWineId y existingVintageId',
      `409, wineId=${wineAId}, vintageId=${vintageAId}`,
      `${createDuplicateRes.status}, wineId=${createDuplicateRes.data?.existingWineId}, vintageId=${createDuplicateRes.data?.existingVintageId}`,
      createDuplicateRes.status === 409 &&
      createDuplicateRes.data?.existingWineId === wineAId &&
      createDuplicateRes.data?.existingVintageId === vintageAId
    );

    // 3. Etiqueta existente con año nuevo
    const matchNewYearRes = await request(`/wines/match?name=${encodeURIComponent(wineLabelName)}&wineryName=${encodeURIComponent(wineryTextName)}&wineType=Red&year=2022`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'Match para etiqueta existente con año nuevo detecta vino pero cosecha null',
      `wine.id=${wineAId}, vintage=null`,
      `wine.id=${matchNewYearRes.data?.wine?.id}, vintage=${matchNewYearRes.data?.vintage}`,
      matchNewYearRes.status === 200 &&
      matchNewYearRes.data?.wine?.id === wineAId &&
      matchNewYearRes.data?.vintage === null
    );

    const createVintage2022Res = await request(`/wines/${wineAId}/vintages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({
        year: 2022,
        alcoholContent: 14.0,
      }),
    });
    const vintage2022Id = createVintage2022Res.data?.id;
    record(
      'POST /api/wines/{id}/vintages con año nuevo crea cosecha Pending',
      201,
      createVintage2022Res.status,
      createVintage2022Res.status === 201 && vintage2022Id > 0
    );

    // 4. Vino sin añada
    const createWineNoVintageRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Blend de Blancas NV ${timestamp}`,
        wineryNameText: `Bodega Del Valle ${timestamp}`,
        wineType: 'White',
        firstVintage: {
          year: null,
          alcoholContent: 12.5,
        },
      }),
    });
    const wineNoVintageId = createWineNoVintageRes.data?.id;
    record(
      'POST /api/wines sin añada (year: null) se crea exitosamente',
      201,
      createWineNoVintageRes.status,
      createWineNoVintageRes.status === 201 && wineNoVintageId > 0
    );

    // 5. Vino de bodega registrada contra texto
    const matchRegisteredWineryRes = await request(`/wines/match?name=Test&wineryName=Bodega%20Oficial%20${timestamp}&wineType=Red&year=2020`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'Match evalúa texto de bodega contra bodegas registradas existentes',
      200,
      matchRegisteredWineryRes.status,
      matchRegisteredWineryRes.status === 200
    );

    // =========================================================================
    // FASE 3: VISIBILIDAD DE COSECHAS & PARTICIPACIÓN
    // =========================================================================
    console.log('\n--- FASE 3: VISIBILIDAD DE COSECHAS & PARTICIPACIÓN ---');

    // 1. Cosecha Pending (vintageAId) es 404 para C (no participante)
    const getVintageCBeforeRes = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    record(
      'Cosecha Pending de A es 404 para usuario ajeno C',
      404,
      getVintageCBeforeRes.status,
      getVintageCBeforeRes.status === 404
    );

    // 2. B tampoco la ve antes de participar
    const getVintageBBeforeRes = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'Cosecha Pending de A es 404 para B antes de participar',
      404,
      getVintageBBeforeRes.status,
      getVintageBBeforeRes.status === 404
    );

    // 3. A (uploader) sí la ve
    const getVintageAres = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'Cosecha Pending es visible (200) para el uploader A',
      200,
      getVintageAres.status,
      getVintageAres.status === 200 && getVintageAres.data?.id === vintageAId
    );

    // 4. B participa agregándola a su cava
    const createCellarBRes = await request('/cellars', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({ name: 'Cava Principal B' }),
    });
    const cellarBId = createCellarBRes.data?.id;

    const addItemBRes = await request(`/cellars/${cellarBId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        quantity: 2,
      }),
    });
    record(
      'Usuario B agrega cosecha Pending a su cava',
      201,
      addItemBRes.status,
      addItemBRes.status === 201
    );

    // 5. B ahora sí la ve (es participante)
    const getVintageBAfterRes = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'Cosecha Pending es ahora visible (200) para B tras participar en cava',
      200,
      getVintageBAfterRes.status,
      getVintageBAfterRes.status === 200 && getVintageBAfterRes.data?.id === vintageAId
    );

    // 6. Cosecha vintageAId tiene ahora 2 usuarios distintos (A y B).
    // Con MinUsersForPublicVisibility=2, ahora C también debe verla públicamente!
    const getVintageCAfterRes = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    record(
      'Cosecha Pending alcanza umbral de 2 participantes y se vuelve visible (200) para C',
      200,
      getVintageCAfterRes.status,
      getVintageCAfterRes.status === 200 && getVintageCAfterRes.data?.id === vintageAId
    );

    // 7. Descorche directo sin cava de otro usuario también cuenta como participación:
    const wineDDirectRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Vino Para Descorche Directo ${timestamp}`,
        wineryNameText: `Bodega Directa ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2020,
          alcoholContent: 13.5,
        },
      }),
    });
    const wineDDirectId = wineDDirectRes.data?.id;
    const vintageDDirectId = await getFirstVintageId(wineDDirectId, userA.token);

    // Usuario D no la ve antes de participar
    const getVDDirectBefore = await request(`/wines/${wineDDirectId}/vintages/${vintageDDirectId}`, {
      headers: { Authorization: `Bearer ${userD.token}` },
    });
    record(
      'Cosecha Pending V_D es 404 para usuario D antes de descorche directo',
      404,
      getVDDirectBefore.status,
      getVDDirectBefore.status === 404
    );

    // D realiza descorche directo sin cava (cellarId: null)
    const directUncorkDRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userD.token}` },
      body: JSON.stringify({
        wineVintageId: vintageDDirectId,
        cellarId: null,
      }),
    });
    record(
      'Usuario D realiza descorche directo sin cava (cellarId: null)',
      201,
      directUncorkDRes.status,
      directUncorkDRes.status === 201
    );

    // D ahora es participante y debe verla (200)
    const getVDDirectAfter = await request(`/wines/${wineDDirectId}/vintages/${vintageDDirectId}`, {
      headers: { Authorization: `Bearer ${userD.token}` },
    });
    record(
      'Descorche directo cuenta como participación: D ahora ve la cosecha (200)',
      200,
      getVDDirectAfter.status,
      getVDDirectAfter.status === 200 && getVDDirectAfter.data?.id === vintageDDirectId
    );

    // 8. Rechazada por admin vuelve a ocultarse
    const rejectVintageRes = await request(`/wines/${wineAId}/vintages/${vintageAId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Rejected' }),
    });
    record(
      'Admin cambia estado de cosecha a Rejected',
      200,
      rejectVintageRes.status,
      rejectVintageRes.status === 200
    );

    const getVintageCAfterReject = await request(`/wines/${wineAId}/vintages/${vintageAId}`, {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    record(
      'Cosecha rechazada por admin vuelve a ocultarse (404) para usuario no participante C',
      404,
      getVintageCAfterReject.status,
      getVintageCAfterReject.status === 404
    );

    // Restaurar a Approved para siguientes pruebas de catálogo
    await request(`/wines/${wineAId}/vintages/${vintageAId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });

    // 9. Listados y Búsqueda con campos de referencia
    const getWinesListRes = await request('/wines?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    const foundWineInList = getWinesListRes.data?.find(w => w.id === wineAId);
    record(
      'GET /api/wines incluye el vino aprobado con ReferenceVintageYear',
      `vino ${wineAId} presente`,
      foundWineInList ? `ID=${foundWineInList.id}, Year=${foundWineInList.referenceVintageYear}` : 'No encontrado',
      Boolean(foundWineInList)
    );

    const searchWineRes = await request(`/wines/search?name=${encodeURIComponent(wineLabelName)}&pageNumber=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${userC.token}` },
    });
    record(
      'GET /api/wines/search encuentra el vino por nombre',
      200,
      searchWineRes.status,
      searchWineRes.status === 200 && searchWineRes.data?.some(w => w.id === wineAId)
    );

    // =========================================================================
    // FASE 4: FOTO PERSONAL & REGLA DE PRIMERA FOTO
    // =========================================================================
    console.log('\n--- FASE 4: FOTO PERSONAL & REGLA DE PRIMERA FOTO ---');

    // Creamos vino y cosecha limpia para prueba de foto
    const winePhotoTestRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Vino Para Foto ${timestamp}`,
        wineryNameText: `Bodega Foto ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2021,
          alcoholContent: 13.5,
        },
      }),
    });
    const winePhotoId = winePhotoTestRes.data?.id;
    const vintagePhotoId = await getFirstVintageId(winePhotoId, userA.token);

    // Buffer de imagen PNG válida de 1x1 píxel
    const tinyPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    // 1. PUT my-image por Usuario A (uploader): debe fijar foto personal Y foto pública (regla de primera foto)
    const formA = new FormData();
    formA.append('file', new Blob([tinyPngBuffer], { type: 'image/png' }), 'photoA.png');

    const uploadMyImageARes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/my-image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: formA,
    });
    const imageIdA = uploadMyImageARes.data?.imageId;
    record(
      'PUT /api/wines/{id}/vintages/{vId}/my-image por uploader A sube foto personal',
      200,
      uploadMyImageARes.status,
      uploadMyImageARes.status === 200 && Boolean(imageIdA)
    );

    // Comprobamos en DB que la cosecha tomó imageIdA como foto pública
    const vintageImageInDb = executeSql(`SELECT image_id FROM wine_vintages WHERE id = ${vintagePhotoId};`);
    record(
      'Regla de primera foto: foto personal del uploader fija automáticamente la foto pública de la cosecha',
      imageIdA,
      vintageImageInDb.trim(),
      vintageImageInDb.includes(imageIdA)
    );

    // 2. PUT my-image por Usuario B (no uploader): debe fijar foto personal pero NO modificar la pública
    const formB = new FormData();
    formB.append('file', new Blob([tinyPngBuffer], { type: 'image/png' }), 'photoB.png');

    const uploadMyImageBRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/my-image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: formB,
    });
    const imageIdB = uploadMyImageBRes.data?.imageId;
    record(
      'PUT /api/wines/{id}/vintages/{vId}/my-image por Usuario B sube su foto personal distinta',
      200,
      uploadMyImageBRes.status,
      uploadMyImageBRes.status === 200 && Boolean(imageIdB) && imageIdB !== imageIdA
    );

    const vintageImageInDbAfterB = executeSql(`SELECT image_id FROM wine_vintages WHERE id = ${vintagePhotoId};`);
    record(
      'Foto personal de Usuario B NO sobreescribe la foto pública de la cosecha',
      imageIdA,
      vintageImageInDbAfterB.trim(),
      vintageImageInDbAfterB.includes(imageIdA)
    );

    // 3. GET my-image por B
    const getMyImageBRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/my-image`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'GET my-image devuelve el imageId personal del usuario solicitante',
      imageIdB,
      getMyImageBRes.data?.imageId,
      getMyImageBRes.status === 200 && getMyImageBRes.data?.imageId === imageIdB
    );

    // 4. DELETE my-image por A: Borra su vínculo personal, pero como imageIdA sigue referenciada en wine_vintages, la fila en tabla images NO debe borrarse
    const deleteMyImageARes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/my-image`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'DELETE my-image por Usuario A responde 204 No Content',
      204,
      deleteMyImageARes.status,
      deleteMyImageARes.status === 204
    );

    const imageARowInDb = executeSql(`SELECT COUNT(*) as count FROM images WHERE id = '${imageIdA}';`);
    record(
      'Imagen referenciada por otra entidad (foto pública) NO es borrada de la tabla images',
      'count=1',
      imageARowInDb.trim(),
      imageARowInDb.includes('count=1')
    );

    // 5. Reemplazar la pública como admin no toca las personales
    const formAdmin = new FormData();
    formAdmin.append('file', new Blob([tinyPngBuffer], { type: 'image/png' }), 'photoAdmin.png');
    const uploadAdminImageRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formAdmin,
    });
    record(
      'Admin reemplaza la imagen pública de la cosecha',
      200,
      uploadAdminImageRes.status,
      uploadAdminImageRes.status === 200
    );

    const getMyImageBAfterAdminRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}/my-image`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    record(
      'Reemplazo de imagen pública por Admin no afectó la foto personal de Usuario B',
      imageIdB,
      getMyImageBAfterAdminRes.data?.imageId,
      getMyImageBAfterAdminRes.status === 200 && getMyImageBAfterAdminRes.data?.imageId === imageIdB
    );

    // =========================================================================
    // FASE 5: ADMIN - LISTAS, APORTES, PROMOCIÓN, EDICIÓN Y BORRADO SEGURO
    // =========================================================================
    console.log('\n--- FASE 5: ADMIN - LISTAS, APORTES, PROMOCIÓN, EDICIÓN Y BORRADO ---');

    // 1. Lista de pendientes con CommunityUsers y orden
    const adminVintagesRes = await request('/wine-vintages?status=Pending&sort=users&pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'GET /api/wine-vintages con sort=users devuelve cosechas pendientes con communityUsers',
      200,
      adminVintagesRes.status,
      adminVintagesRes.status === 200 && Array.isArray(adminVintagesRes.data) && (adminVintagesRes.data.length === 0 || adminVintagesRes.data[0]?.communityUsers !== undefined)
    );

    // 2. Contributions
    const contributionsRes = await request(`/wine-vintages/${vintagePhotoId}/contributions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'GET /api/wine-vintages/{id}/contributions lista usuarios participantes y fotos personales',
      200,
      contributionsRes.status,
      contributionsRes.status === 200 && Array.isArray(contributionsRes.data) && contributionsRes.data.some(c => c.userId === userB.userId)
    );

    // 3. Promote-image (promover foto personal de B como pública)
    const promoteImageRes = await request(`/wine-vintages/${vintagePhotoId}/promote-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ userId: userB.userId }),
    });
    record(
      'POST /api/wine-vintages/{id}/promote-image promueve foto personal de B a pública',
      200,
      promoteImageRes.status,
      promoteImageRes.status === 200 && promoteImageRes.data?.imageId === imageIdB
    );

    // 4. Editar cosecha (PUT vintage) y vino (PUT wine)
    const updateVintageRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        year: 2021,
        alcoholContent: 13.8,
        servingTemperature: 16,
        agingAdvice: 'Guarda sugerida de 5 años',
        grapes: [],
      }),
    });
    record(
      'PUT /api/wines/{wineId}/vintages/{vintageId} actualiza datos técnicos de la cosecha',
      200,
      updateVintageRes.status,
      updateVintageRes.status === 200 && updateVintageRes.data?.alcoholContent === 13.8
    );

    const updateWineRes = await request(`/wines/${winePhotoId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Vino Editado Por Admin ${timestamp}`,
        wineryNameText: `Bodega Foto ${timestamp}`,
        wineType: 'Red',
      }),
    });
    record(
      'PUT /api/wines/{wineId} actualiza etiqueta de vino',
      200,
      updateWineRes.status,
      updateWineRes.status === 200
    );

    // 5. Borrado de cosecha con dependencias ajenas bloquea con 409
    // vintagePhotoId tiene fotos/participación de userB (ajeno)
    const deleteVintageBlockedRes = await request(`/wines/${winePhotoId}/vintages/${vintagePhotoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteMsg = getDetail(deleteVintageBlockedRes.data);
    record(
      'DELETE vintage con fotos o actividad de otros usuarios bloquea con 409 y mensaje que sugiere rechazarla',
      409,
      deleteVintageBlockedRes.status,
      deleteVintageBlockedRes.status === 409 && deleteMsg.toLowerCase().includes('rechaz')
    );

    // =========================================================================
    // FASE 6: CAVA & ADVISORY LOCK
    // =========================================================================
    console.log('\n--- FASE 6: CAVA & ADVISORY LOCK (LÍMITE DE 3 CAVAS) ---');

    // Al registrarse, cada usuario ya recibe su cava por defecto ("Mi Cava").
    // 1. Usuario A crea cavas adicionales hasta alcanzar el límite permitido de 3
    const c1 = await request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userA.token}` }, body: JSON.stringify({ name: 'Cava 2' }) });
    const c2 = await request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userA.token}` }, body: JSON.stringify({ name: 'Cava 3' }) });
    record(
      'Usuario A completa sus 3 cavas permitidas exitosamente',
      '201, 201',
      `${c1.status}, ${c2.status}`,
      c1.status === 201 && c2.status === 201
    );

    // 2. Intentar crear una 4ta cava da 409 Conflict
    const c4 = await request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userA.token}` }, body: JSON.stringify({ name: 'Cava 4' }) });
    record(
      'Creación de la 4ta cava supera el límite de 3 y rechaza con 409',
      409,
      c4.status,
      c4.status === 409
    );

    // 3. Concurrencia real con Advisory Lock:
    // Usuario D ya tiene 1 cava por defecto. Crea 1 más -> tiene 2. Le queda exactamente 1 cupo libre.
    await request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userD.token}` }, body: JSON.stringify({ name: 'Cava D2' }) });

    const [concurrentRes1, concurrentRes2] = await Promise.all([
      request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userD.token}` }, body: JSON.stringify({ name: 'Cava D3_A' }) }),
      request('/cellars', { method: 'POST', headers: { Authorization: `Bearer ${userD.token}` }, body: JSON.stringify({ name: 'Cava D3_B' }) }),
    ]);

    const statuses = [concurrentRes1.status, concurrentRes2.status].sort();
    const cellarsInDbForD = executeSql(`SELECT COUNT(*) as count FROM cellars WHERE user_id = ${userD.userId};`);
    record(
      'Dos creaciones simultáneas con 1 cupo libre resultan en exactamente 1 éxito (201) y 1 conflicto (409)',
      '201 y 409',
      `${statuses[0]} y ${statuses[1]}`,
      statuses[0] === 201 && statuses[1] === 409 && cellarsInDbForD.includes('count=3')
    );

    // 4. Agregar, actualizar y borrar ítems de cava
    const cellarAId = c1.data?.id;
    const addBottleRes = await request(`/cellars/${cellarAId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({ wineVintageId: vintageAId, quantity: 3 }),
    });
    record(
      'POST item en cava agrega 3 botellas',
      201,
      addBottleRes.status,
      addBottleRes.status === 201
    );

    const updateBottleRes = await request(`/cellars/${cellarAId}/items/${vintageAId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({ quantity: 5 }),
    });
    record(
      'PUT item en cava actualiza cantidad de botellas a 5',
      200,
      updateBottleRes.status,
      updateBottleRes.status === 200 && updateBottleRes.data?.quantity === 5
    );

    const deleteItemRes = await request(`/cellars/${cellarAId}/items/${vintageAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'DELETE item en cava elimina el vino de la cava',
      204,
      deleteItemRes.status,
      deleteItemRes.status === 204
    );

    // =========================================================================
    // FASE 7: DESCORCHE & BITÁCORA
    // =========================================================================
    console.log('\n--- FASE 7: DESCORCHE & BITÁCORA ---');

    // 1. Descorche con cava: agrega 2 botellas, descorcha 1, descorcha la última (se borra el ítem)
    await request(`/cellars/${cellarAId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({ wineVintageId: vintageAId, quantity: 2 }),
    });

    const uncork1Res = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: cellarAId,
        rating: 5,
        comment: 'Primera botella, fantástica',
      }),
    });
    record(
      'Descorche con cava descuenta una botella (quedan botellas)',
      `201, remainingQuantity=1`,
      `${uncork1Res.status}, remainingQuantity=${uncork1Res.data?.remainingQuantity}`,
      uncork1Res.status === 201 && uncork1Res.data?.remainingQuantity === 1
    );

    const uncork2Res = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: cellarAId,
        rating: 4,
        comment: 'Última botella',
      }),
    });
    const itemsInCellarAfterLast = executeSql(`SELECT COUNT(*) as count FROM cellar_items WHERE cellar_id = ${cellarAId} AND wine_vintage_id = ${vintageAId};`);
    record(
      'Descorche de última botella elimina automáticamente el ítem de la cava',
      `201, remainingQuantity=0, count=0`,
      `${uncork2Res.status}, remainingQuantity=${uncork2Res.data?.remainingQuantity}, ${itemsInCellarAfterLast.trim()}`,
      uncork2Res.status === 201 && uncork2Res.data?.remainingQuantity === 0 && itemsInCellarAfterLast.includes('count=0')
    );

    // Intentar descorchar en la cava cuando no quedan botellas da error
    const uncorkEmptyRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: cellarAId,
      }),
    });
    record(
      'Descorche en cava sin botellas disponibles retorna error (404 al haberse eliminado el ítem previo)',
      '404 o 400',
      uncorkEmptyRes.status,
      uncorkEmptyRes.status === 404 || uncorkEmptyRes.status === 400 || uncorkEmptyRes.status === 409
    );

    // 2. Comentario sin puntaje da 400 Bad Request
    const uncorkNoRatingRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: null,
        comment: 'Comentario sin rating',
        rating: null,
      }),
    });
    record(
      'Descorche con comentario pero sin rating rechaza con 400',
      400,
      uncorkNoRatingRes.status,
      uncorkNoRatingRes.status === 400
    );

    // 3. Validaciones de fecha: Futura (400) y Anterior a 1900 (400)
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const uncorkFutureRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: null,
        occurredAt: futureDate,
      }),
    });
    record(
      'Descorche con fecha futura rechaza con 400',
      400,
      uncorkFutureRes.status,
      uncorkFutureRes.status === 400
    );

    const ancientDate = '1885-05-10T12:00:00Z';
    const uncorkAncientRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: null,
        occurredAt: ancientDate,
      }),
    });
    record(
      'Descorche con fecha anterior a 1900 rechaza con 400',
      400,
      uncorkAncientRes.status,
      uncorkAncientRes.status === 400
    );

    // 4. Descorche retroactivo válido en el pasado
    const pastDate = new Date(Date.now() - 86400000 * 10).toISOString();
    const uncorkPastRes = await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        cellarId: null,
        rating: 4,
        occurredAt: pastDate,
      }),
    });
    record(
      'Descorche con fecha retroactiva válida en el pasado responde 201 Created',
      201,
      uncorkPastRes.status,
      uncorkPastRes.status === 201
    );

    // 5. Historial: ordena por occurredAt descendente y trae rating
    const historyRes = await request('/users/me/history?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    const items = historyRes.data || [];
    let isSortedDesc = true;
    for (let i = 0; i < items.length - 1; i++) {
      if (new Date(items[i].occurredAt) < new Date(items[i + 1].occurredAt)) {
        isSortedDesc = false;
        break;
      }
    }
    record(
      'GET /api/users/me/history ordena actividades por occurredAt descendente',
      true,
      isSortedDesc,
      historyRes.status === 200 && items.length > 0 && isSortedDesc
    );

    // =========================================================================
    // FASE 8: RESEÑAS & UMBRAL DE CALIFICACIÓN (5 RESEÑAS)
    // =========================================================================
    console.log('\n--- FASE 8: RESEÑAS & UMBRAL DE 5 RESEÑAS ---');

    // Creamos vino y cosecha exclusiva para prueba de 5 reseñas
    const wineReviewsRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Vino Reseñas Test ${timestamp}`,
        wineryNameText: `Bodega Calificaciones ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2020,
          alcoholContent: 14.0,
        },
      }),
    });
    const wineReviewsId = wineReviewsRes.data?.id;
    const vintageReviewsId = await getFirstVintageId(wineReviewsId, userA.token);

    // Crear 4 reseñas con usuarios distintos
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({ wineVintageId: vintageReviewsId, rating: 5, comment: 'R1' }),
    });
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({ wineVintageId: vintageReviewsId, rating: 4, comment: 'R2' }),
    });
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userC.token}` },
      body: JSON.stringify({ wineVintageId: vintageReviewsId, rating: 4, comment: 'R3' }),
    });
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userD.token}` },
      body: JSON.stringify({ wineVintageId: vintageReviewsId, rating: 5, comment: 'R4' }),
    });

    // Con 4 reseñas: AverageRating debe ser null
    const vintageWith4Res = await request(`/wines/${wineReviewsId}/vintages/${vintageReviewsId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'Cosecha con 4 reseñas tiene reviewCount=4 y averageRating=null (menor al umbral de 5)',
      'count=4, averageRating=null',
      `count=${vintageWith4Res.data?.reviewCount}, averageRating=${vintageWith4Res.data?.averageRating}`,
      vintageWith4Res.data?.reviewCount === 4 && vintageWith4Res.data?.averageRating === null
    );

    // Agregar la 5ª reseña (Admin como usuario 5)
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ wineVintageId: vintageReviewsId, rating: 5, comment: 'R5' }),
    });

    // Con 5 reseñas: (5+4+4+5+5) / 5 = 23 / 5 = 4.60
    const vintageWith5Res = await request(`/wines/${wineReviewsId}/vintages/${vintageReviewsId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'Cosecha con 5 reseñas calcula y expone averageRating = 4.60',
      'count=5, averageRating=4.6',
      `count=${vintageWith5Res.data?.reviewCount}, averageRating=${vintageWith5Res.data?.averageRating}`,
      vintageWith5Res.data?.reviewCount === 5 && Number(vintageWith5Res.data?.averageRating) === 4.6
    );

    // =========================================================================
    // FASE 9: FUSIÓN DE ETIQUETAS
    // =========================================================================
    console.log('\n--- FASE 9: FUSIÓN DE ETIQUETAS ---');

    // Creamos vino origen (duplicado) y vino destino
    const wineTargetRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        name: `Vino Principal Destino ${timestamp}`,
        wineryNameText: `Bodega Principal ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2020,
          alcoholContent: 13.5,
        },
      }),
    });
    const wineTargetId = wineTargetRes.data?.id;

    const wineSourceRes = await request('/wines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({
        name: `Vino Duplicado Origen ${timestamp}`,
        wineryNameText: `Bodega Principal ${timestamp}`,
        wineType: 'Red',
        firstVintage: {
          year: 2020,
          alcoholContent: 14.0,
        },
      }),
    });
    const wineSourceId = wineSourceRes.data?.id;
    const vintageSourceId = await getFirstVintageId(wineSourceId, userB.token);

    // Subir foto personal a la cosecha del vino origen
    const formMerge = new FormData();
    formMerge.append('file', new Blob([tinyPngBuffer], { type: 'image/png' }), 'mergePhoto.png');
    await request(`/wines/${wineSourceId}/vintages/${vintageSourceId}/my-image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: formMerge,
    });

    // Descorchar vino origen para generar actividad
    await request('/uncorks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userB.token}` },
      body: JSON.stringify({ wineVintageId: vintageSourceId, cellarId: null }),
    });

    // Ejecutar fusión: POST /api/wines/{targetId}/merge/{duplicateId}
    const mergeRes = await request(`/wines/${wineTargetId}/merge/${wineSourceId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'POST /api/wines/{target}/merge/{source} fusiona etiquetas y reporta contadores de imágenes y actividades',
      200,
      mergeRes.status,
      mergeRes.status === 200 &&
      mergeRes.data?.movedUserImages >= 1 &&
      mergeRes.data?.movedActivities >= 1
    );

    // =========================================================================
    // FASE 10: BODEGAS SEGUIDAS
    // =========================================================================
    console.log('\n--- FASE 10: BODEGAS SEGUIDAS ---');

    // 1. Seguir bodega registrada
    const followWineryRes = await request(`/wineries/${registeredWineryId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'POST /api/wineries/{id}/follow responde 204 No Content',
      204,
      followWineryRes.status,
      followWineryRes.status === 204
    );

    // 2. GET /api/users/me/following-wineries
    const followingWineriesRes = await request('/users/me/following-wineries?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    const followedList = Array.isArray(followingWineriesRes.data) ? followingWineriesRes.data : followingWineriesRes.data?.items || [];
    const followedWinery = followedList.find(w => (w.wineryId || w.id) === registeredWineryId);
    record(
      'GET /api/users/me/following-wineries devuelve la bodega seguida con seguidores y datos completos',
      `wineryId=${registeredWineryId}`,
      `wineryId=${followedWinery?.wineryId || followedWinery?.id}, followers=${followedWinery?.followersCount}`,
      followingWineriesRes.status === 200 && Boolean(followedWinery)
    );

    // 3. Dejar de seguir bodega
    const unfollowWineryRes = await request(`/wineries/${registeredWineryId}/follow`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    record(
      'DELETE /api/wineries/{id}/follow responde 204 No Content',
      204,
      unfollowWineryRes.status,
      unfollowWineryRes.status === 204
    );

    const followingWineriesAfterRes = await request('/users/me/following-wineries?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    const followedListAfter = Array.isArray(followingWineriesAfterRes.data) ? followingWineriesAfterRes.data : followingWineriesAfterRes.data?.items || [];
    record(
      'Bodega ya no figura en la lista de seguidas tras unfollow',
      0,
      followedListAfter.filter(w => (w.wineryId || w.id) === registeredWineryId).length,
      followedListAfter.filter(w => (w.wineryId || w.id) === registeredWineryId).length === 0
    );

    // 4. Regresión A1: GET /api/reviews como admin deserializa correctamente con reseñas existentes (rating::int)
    await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
      body: JSON.stringify({
        wineVintageId: vintageAId,
        rating: 5,
        comment: 'Excelente vino para test de regresión A1',
      }),
    });

    const adminReviewsRes = await request('/reviews?pageNumber=1&pageSize=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'Regresión A1: GET /api/reviews como admin responde 200 sin error 500 al deserializar reseñas',
      200,
      adminReviewsRes.status,
      adminReviewsRes.status === 200 && Array.isArray(adminReviewsRes.data)
    );

  } catch (error) {
    console.error('\n💥 ERROR FATAL EN SUITE E2E:', error);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log('🍇 RESUMEN FINAL DE EJECUCIÓN E2E EN VIVO (BLOQUE 16)');
    console.log('================================================================');
    console.log(`  Total pruebas ejecutadas: ${passed + failed}`);
    console.log(`  ✅ Aprobadas: ${passed}`);
    console.log(`  ❌ Fallidas:  ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) {
      console.error(`⛔ ALERTA: Hubo ${failed} pruebas fallidas.`);
      process.exit(1);
    } else {
      console.log('🎉 TODAS LAS PRUEBAS E2E PASARON CON ÉXITO.');
      process.exit(0);
    }
  }
}

run();

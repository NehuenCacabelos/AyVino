// End-to-End Live Integration Test for AyVino Winery Feature
// Comprehensive real-world validation against running backend (.NET Core + PostgreSQL)
import crypto from 'node:crypto';

const API_BASE = 'http://localhost:5230/api';
const JWT_SECRET = 'clave_secreta_super_segura_de_al_menos_32_caracteres_ayvino';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateAdminToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: '999',
    email: 'admin@ayvino.com',
    name: 'Admin Test',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
    jti: crypto.randomUUID(),
    iss: 'AyVino',
    aud: 'AyVino',
    exp: now + 3600,
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
  console.log('🍷 INICIANDO BATERÍA DE PRUEBAS INTEGRALES E2E (BACKEND REAL)');
  console.log('🍷 ================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/states
    console.log('1. Verificando provincias vitivinícolas argentinas...');
    const statesRes = await request('/states');
    assert(
      statesRes.status === 200 && Array.isArray(statesRes.data) && statesRes.data.length > 0,
      `GET /api/states retornó ${statesRes.data?.length} provincias (SeedStates verificado)`,
    );

    // 2. GET /api/locations
    console.log('\n2. Verificando terruños y orígenes geográficos...');
    const locationsRes = await request('/locations?pageSize=20');
    assert(
      locationsRes.status === 200 && Array.isArray(locationsRes.data) && locationsRes.data.length > 0,
      `GET /api/locations retornó ${locationsRes.data?.length} ubicaciones disponibles`,
    );
    const locationId = locationsRes.data[0]?.id;

    // 3. GET /api/grapes
    console.log('\n3. Verificando catálogo maestro de uvas y varietales...');
    const grapesRes = await request('/grapes?pageSize=20');
    assert(
      grapesRes.status === 200 && Array.isArray(grapesRes.data),
      `GET /api/grapes respondió HTTP 200 (${grapesRes.data?.length ?? 0} cepas)`,
    );
    const grapeId = grapesRes.data && grapesRes.data.length > 0 ? grapesRes.data[0].id : null;

    // 4. POST /api/wineries/register
    const timestamp = Date.now();
    const testUsername = `bodega_${timestamp}`;
    const testEmail = `bodega_${timestamp}@testbodega.com`;
    const testPassword = 'Password123!';
    const testWineryName = `Bodega Valle Sagrado ${timestamp}`;

    console.log(`\n4. Registro unificado de bodega (${testWineryName})...`);
    const registerPayload = {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      wineryName: testWineryName,
      locationId: locationId,
      foundationYear: 1988,
      website: 'https://vallesagrado-vino.com.ar',
      description: 'Bodega boutique ubicada en terruño de altura con prácticas biodinámicas.',
    };

    const registerRes = await request('/wineries/register', {
      method: 'POST',
      body: JSON.stringify(registerPayload),
    });

    assert(
      registerRes.status === 201 || registerRes.status === 200,
      `POST /api/wineries/register retornó HTTP ${registerRes.status}`,
    );
    assert(Boolean(registerRes.data?.accessToken), 'Token JWT emitido automáticamente');
    assert(
      registerRes.data?.winery?.name === testWineryName,
      `Bodega creada con nombre correcto: "${testWineryName}"`,
    );
    assert(
      registerRes.data?.winery?.status === 'Pending',
      'Estado inicial de la bodega: Pending (requiere moderación sommelier)',
    );

    const wineryId = registerRes.data?.winery?.id;
    let token = registerRes.data?.accessToken;

    // 5. POST /api/auth/login
    console.log('\n5. Autenticación con credenciales del responsable de bodega...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    assert(loginRes.status === 200, `POST /api/auth/login respondió HTTP 200`);
    assert(loginRes.data?.user?.role === 'Winery', 'Rol verificado en el token: Winery');
    assert(Boolean(loginRes.data?.refreshToken), 'Refresh Token emitido correctamente');

    token = loginRes.data?.accessToken || token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 6. GET /api/wineries/me
    console.log('\n6. Consulta de bodega propia vía endpoint de identidad (GET /api/wineries/me)...');
    const meRes = await request('/wineries/me', { headers: authHeaders });
    assert(meRes.status === 200, `GET /api/wineries/me retornó HTTP 200`);
    assert(
      meRes.data?.id === wineryId,
      `La bodega asociada al usuario autenticado coincide (ID ${wineryId})`,
    );
    assert(
      meRes.data?.name === testWineryName,
      `Nombre devuelto por /wineries/me coincide con "${testWineryName}"`,
    );

    // 7. PUT /api/wineries/{id}
    console.log(`\n7. Actualización de perfil institucional (PUT /api/wineries/${wineryId})...`);
    const updatePayload = {
      name: testWineryName,
      locationId: locationId,
      foundationYear: 1985,
      website: 'https://vallesagrado-oficial.com.ar',
      description: 'Semblanza institucional actualizada con foco en exportación.',
    };
    const updateRes = await request(`/wineries/${wineryId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload),
    });
    assert(updateRes.status === 200, `PUT /api/wineries/${wineryId} retornó HTTP 200`);
    assert(
      updateRes.data?.website === 'https://vallesagrado-oficial.com.ar',
      'Sitio web institucional persistido exitosamente',
    );
    assert(updateRes.data?.foundationYear === 1985, 'Año de fundación actualizado a 1985');

    // 8. GET /api/wineries/{id} (Público)
    console.log(`\n8. Consulta de vidriera pública sin credenciales (GET /api/wineries/${wineryId})...`);
    const publicRes = await request(`/wineries/${wineryId}`);
    assert(publicRes.status === 200, `Vidriera pública accesible anónimamente (HTTP 200)`);
    assert(publicRes.data?.name === testWineryName, 'Datos institucionales visibles al público');

    // 9. Regla de negocio y seguridad: Bodega Pending NO puede publicar vinos oficiales
    console.log('\n9. Verificando regla de negocio: bodega en estado Pending...');
    const testWinePayload = {
      name: `Corte de Montaña ${timestamp}`,
      wineryId: wineryId,
      locationId: locationId,
      wineType: 'Red',
      description: 'Blend de terruño de altura.',
      firstVintage: {
        year: 2022,
        alcoholContent: 14.5,
        servingTemperature: 16,
        agingAdvice: 'Guarda recomendada de 5 años',
        grapes: grapeId ? [{ grapeId, percentage: 100 }] : [],
      },
    };

    const pendingCreateRes = await request('/wines', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testWinePayload),
    });
    assert(
      pendingCreateRes.status === 403,
      `POST /api/wines rechazó publicación de bodega Pending con HTTP 403 (Regla de negocio cumplida)`,
    );

    // 10. Aprobación sommelier/administrador (PATCH /api/wineries/{id}/status -> Approved)
    console.log('\n10. Aprobando bodega vía moderación sommelier (PATCH /api/wineries/{id}/status)...');
    const adminToken = generateAdminToken();
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const approveRes = await request(`/wineries/${wineryId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'Approved' }),
    });
    assert(approveRes.status === 200, `PATCH /status retornó HTTP 200`);
    assert(approveRes.data?.status === 'Approved', 'Estado de la bodega actualizado a Approved');

    // 11. Creación de etiqueta oficial tras la aprobación (POST /api/wines)
    console.log('\n11. Publicando etiqueta oficial con añada inaugural y corte...');
    const approvedCreateRes = await request('/wines', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testWinePayload),
    });
    assert(
      approvedCreateRes.status === 201 || approvedCreateRes.status === 200,
      `POST /api/wines aceptó la publicación tras aprobación (HTTP ${approvedCreateRes.status})`,
    );
    const createdWineId = approvedCreateRes.data?.id;
    assert(Boolean(createdWineId), `Vino oficial creado exitosamente con ID ${createdWineId}`);

    // 12. GET /api/wines/{wineId}/vintages
    console.log(`\n12. Consultando cosechas registradas (GET /api/wines/${createdWineId}/vintages)...`);
    const vintagesRes = await request(`/wines/${createdWineId}/vintages`);
    assert(
      vintagesRes.status === 200 && Array.isArray(vintagesRes.data),
      `GET /wines/${createdWineId}/vintages respondió HTTP 200`,
    );
    assert(
      vintagesRes.data.some((v) => v.year === 2022),
      'La cosecha inaugural 2022 figura correctamente en el desglose de añadas',
    );

    // 13. POST /api/wines/{wineId}/vintages
    console.log(`\n13. Incorporando nueva añada al catálogo (POST /api/wines/${createdWineId}/vintages)...`);
    const newVintagePayload = {
      year: 2024,
      alcoholContent: 14.0,
      servingTemperature: 15,
      agingAdvice: 'Listo para beber',
      grapes: grapeId ? [{ grapeId, percentage: 100 }] : [],
    };
    const addVintageRes = await request(`/wines/${createdWineId}/vintages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newVintagePayload),
    });
    assert(
      addVintageRes.status === 201 || addVintageRes.status === 200,
      `Nueva añada 2024 registrada exitosamente (HTTP ${addVintageRes.status})`,
    );

    // 14. GET /api/wines/claim-candidates/{wineryId}
    console.log(`\n14. Consultando candidatos de reclamo para bodega aprobada...`);
    const claimCandidatesRes = await request(`/wines/claim-candidates/${wineryId}`, {
      headers: authHeaders,
    });
    assert(
      claimCandidatesRes.status === 200 && Array.isArray(claimCandidatesRes.data),
      `Candidatos de reclamo accesibles tras aprobación (HTTP 200)`,
    );

    // 15. POST /api/auth/refresh
    console.log('\n15. Probando renovación automática de credenciales (Refresh Token)...');
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: loginRes.data?.refreshToken }),
    });
    assert(refreshRes.status === 200, `POST /api/auth/refresh renovó sesión exitosamente (HTTP 200)`);
    assert(Boolean(refreshRes.data?.accessToken), 'Nuevo Access Token JWT devuelto');

    console.log('\n================================================================');
    console.log(`🎯 RESULTADOS FINALES: ${passed} PRUEBAS EXITOSAS, ${failed} FALLOS`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error durante la ejecución del test live:', err);
    process.exit(1);
  }
}

run();


// ══════════════════════════════════════════════════════════════
// Rita Roux Eventos · Google Sheets & Drive API utilities
// ══════════════════════════════════════════════════════════════

const GS_CLIENT_ID = '7720731839-diiq519n6prur6ucjegbuk44lkgn2ojr.apps.googleusercontent.com';
const GS_SHEET_ID  = '1Uum5_SUQWd2yZJC9B7qcOmTDDpY7mXntMzJpEl72TsE';
const GS_SCOPES    = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// Espacios físicos reservables (calendario-cocina + cotizador) — usados para
// detectar choques de horario: dos reservas no pueden compartir espacio+fecha+hora.
const ESPACIOS = ['Salón Victoriano', 'Pérgola', 'Espino'];

const TAB = {
  PRESUPUESTOS : 'Presupuestos',
  NOTAS_VENTA  : 'NotasVenta',
  CONTADOR     : 'Contador',
  SEG          : 'Seguimiento',
  RESERVAS     : 'Reservas',
  CATALOGO     : 'Catalogo',
  CLIENTES     : 'HistoricoClientes',
  AVISOS       : 'Avisos',
};

// ─── CATÁLOGO DE SERVICIOS (cotizador + editar-servicios + lista de compras) ───
// Categorías fijas (estructura), los SERVICIOS dentro de cada una sí son editables.
const CATALOGO_CATEGORIAS = [
  { id:'locaciones', label:'🏛 Locaciones', section:'ARRIENDO LOCAL',               qtyLabel:'Nº horas' },
  { id:'catering',   label:'🍽 Catering',   section:'CATERING',                     qtyLabel:'Nº personas' },
  { id:'flores',     label:'🌸 Flores',     section:'SERVICIOS GENERALES Y EQUIPO', qtyLabel:'Cantidad' },
  { id:'audio',      label:'🔊 Audio',      section:'SERVICIOS GENERALES Y EQUIPO', qtyLabel:'Cantidad' },
  { id:'generales',  label:'🧰 Generales',  section:'SERVICIOS GENERALES Y EQUIPO', qtyLabel:'Cantidad' },
];

// Catálogo por defecto — se usa como respaldo sin conexión y para sembrar la hoja
// "Catalogo" la primera vez que se conecta (incluye mobiliario+carpas+fijos+personal
// ya unidos en "generales").
const CATALOGO_SEED = [
  { cat:'locaciones', name:'La Pérgola',                           rec:300000,  unit:'hora' },
  { cat:'locaciones', name:'Salón Victoriano',                     rec:100000,  unit:'hora' },
  { cat:'locaciones', name:'Parque Principal',                     rec:380000,  unit:'hora' },
  { cat:'locaciones', name:'Ginko',                                rec:280000,  unit:'hora' },
  { cat:'locaciones', name:'Invernadero',                          rec:200000,  unit:'hora' },
  { cat:'locaciones', name:'La Carpa de Rita',                     rec:500000,  unit:'hora' },
  { cat:'locaciones', name:'Sala de Yoga',                         rec:150000,  unit:'hora' },
  { cat:'locaciones', name:'Cochera',                              rec:500000,  unit:'flat' },
  { cat:'locaciones', name:'Montaje / Desmontaje',                 rec:100000,  unit:'hora' },

  { cat:'catering', name:'Desayuno Rita',                          rec:20000,  unit:'persona', group:'Desayunos' },
  { cat:'catering', name:'Desayuno Rita Gozadora',                 rec:28000,  unit:'persona', group:'Desayunos' },
  { cat:'catering', name:'Desayuno a la Carta',                    rec:25000,  unit:'persona', group:'Desayunos' },
  { cat:'catering', name:'Brunch del Parque',                      rec:35500,  unit:'persona', group:'Brunch' },
  { cat:'catering', name:'Brunch Royale',                          rec:35000,  unit:'persona', group:'Brunch' },
  { cat:'catering', name:'Almuerzo del Parque',                    rec:40000,  unit:'persona', group:'Almuerzos' },
  { cat:'catering', name:'Almuerzo a la Carta',                    rec:30000,  unit:'persona', group:'Almuerzos' },
  { cat:'catering', name:'Lunch Club',                             rec:28000,  unit:'persona', group:'Almuerzos' },
  { cat:'catering', name:'Coffee Break',                           rec:12000,  unit:'persona', group:'Coffee' },
  { cat:'catering', name:'Coffee de Bienvenida',                   rec:15000,  unit:'persona', group:'Coffee' },
  { cat:'catering', name:'Estación Café (permanente)',             rec:150000, unit:'flat',    group:'Coffee' },
  { cat:'catering', name:'Hora del Té',                            rec:25000,  unit:'persona', group:'Otros' },
  { cat:'catering', name:'Cóctel Roux (4 bocados)',                rec:40000,  unit:'persona', group:'Cócteles' },
  { cat:'catering', name:'Cóctel Roux (8 sal. + 4 dul.)',          rec:60000,  unit:'persona', group:'Cócteles' },
  { cat:'catering', name:'Cóctel Sri Lanka (10 sal. + 5 dul.)',    rec:68000,  unit:'persona', group:'Cócteles' },
  { cat:'catering', name:'Cóctel 15 bocados',                      rec:68000,  unit:'persona', group:'Cócteles' },
  { cat:'catering', name:'Fee Banquetería',                        rec:350000, unit:'flat',    group:'Extras' },
  { cat:'catering', name:'Fee Catering Externo',                   rec:150000, unit:'flat',    group:'Extras' },
  { cat:'catering', name:'Tabla de Quesos',                        rec:150000, unit:'flat',    group:'Extras' },
  { cat:'catering', name:'Descorche',                              rec:10000,  unit:'botella', group:'Extras' },

  { cat:'flores', name:'Flores Básicas',                           rec:100000, unit:'flat' },
  { cat:'flores', name:'Flores y Ambientación Esenciales',         rec:200000, unit:'flat' },
  { cat:'flores', name:'Flores Jardín en Flor',                    rec:380000, unit:'flat' },
  { cat:'flores', name:'Flores Jardín Soñado',                     rec:500000, unit:'flat' },
  { cat:'flores', name:'Escenografía Botánica',                    rec:800000, unit:'flat' },

  { cat:'audio', name:'Pantalla 55"',                              rec:50000,  unit:'flat' },
  { cat:'audio', name:'Audio / Amplificación',                     rec:250000, unit:'flat' },
  { cat:'audio', name:'Audio música ambiente',                     rec:350000, unit:'flat' },
  { cat:'audio', name:'Pantalla 55" + Audio',                      rec:250000, unit:'flat' },

  { cat:'generales', name:'Sillas crossback (25 u.)',              rec:170000,  unit:'flat' },
  { cat:'generales', name:'Sillas crossback',                      rec:260000,  unit:'flat' },
  { cat:'generales', name:'Mesas redondas + sillas crossback',     rec:380000,  unit:'flat' },
  { cat:'generales', name:'Arriendo mobiliario completo',          rec:450000,  unit:'flat' },
  { cat:'generales', name:'Lounge 6 personas',                     rec:180000,  unit:'hora' },
  { cat:'generales', name:'Estufas (c/u)',                         rec:65000,   unit:'unidad' },
  { cat:'generales', name:'Barras (c/u)',                          rec:50000,   unit:'unidad' },
  { cat:'generales', name:'Lámparas de lágrima (10 u.)',           rec:450000,  unit:'flat' },
  { cat:'generales', name:'Carpa básica',                          rec:850000,  unit:'flat' },
  { cat:'generales', name:'Carpa Ginko ceremonial',                rec:1800000, unit:'flat' },
  { cat:'generales', name:'Carpa Jardín Principal',                rec:2200000, unit:'flat' },
  { cat:'generales', name:'Housekeeping (evento grande)',          rec:180000,  unit:'flat' },
  { cat:'generales', name:'Housekeeping (mediano)',                rec:100000,  unit:'flat' },
  { cat:'generales', name:'Housekeeping (mínimo)',                 rec:50000,   unit:'flat' },
  { cat:'generales', name:'Servicio Mesera',                       rec:50000,   unit:'flat' },
  { cat:'generales', name:'Bartender',                             rec:60000,   unit:'hora' },
  { cat:'generales', name:'Mesero/a',                              rec:50000,   unit:'hora' },
];

// Filas planas (Sheets) → estructura anidada por categoría
function gsFilasACatalogo(rows) {
  const porCat = {};
  (rows||[]).forEach(r => {
    const catId = r[0] || 'generales';
    let ingredientes=[]; try{ ingredientes=JSON.parse(r[5]||'[]'); }catch(e){}
    const item = { name:r[1]||'', rec:+r[2]||0, unit:r[3]||'flat', group:r[4]||'', ingredientes };
    (porCat[catId] = porCat[catId] || []).push(item);
  });
  return CATALOGO_CATEGORIAS.map(c => ({ ...c, items: porCat[c.id]||[] }));
}

// Estructura anidada → filas planas (para guardar)
function gsCatalogoAFilas(catalogo) {
  const rows = [];
  (catalogo||[]).forEach(cat => {
    (cat.items||[]).forEach(it => {
      rows.push([cat.id, it.name||'', it.rec||0, it.unit||'flat', it.group||'', JSON.stringify(it.ingredientes||[])]);
    });
  });
  return rows;
}

// Catálogo por defecto (sin Sheets) — usa el mismo parser para garantizar la misma forma
function gsSeedToCatalogo() {
  const rows = CATALOGO_SEED.map(s => [s.cat, s.name, s.rec, s.unit, s.group||'', '[]']);
  return gsFilasACatalogo(rows);
}

// Lee el catálogo desde la hoja "Catalogo"; si está vacía, la siembra con CATALOGO_SEED.
async function gsCargarCatalogo() {
  if (!gsConnected()) return null;
  try {
    const res = await gsGet(`${TAB.CATALOGO}!A2:F`);
    let rows = res.values || [];
    if (!rows.length) {
      const seedRows = CATALOGO_SEED.map(s => [s.cat, s.name, s.rec, s.unit, s.group||'', '[]']);
      await gsAppend(`${TAB.CATALOGO}!A2:F`, seedRows);
      rows = seedRows;
    }
    return rows;
  } catch(e) { console.warn('Error cargando catálogo:', e); return null; }
}

async function gsGuardarCatalogo(catalogo) {
  if (!gsConnected()) return;
  try {
    const rows = gsCatalogoAFilas(catalogo);
    await gsClear(`${TAB.CATALOGO}!A2:F`);
    if (rows.length) await gsAppend(`${TAB.CATALOGO}!A2:F`, rows);
  } catch(e) { console.warn('Error guardando catálogo:', e); }
}

let gs_token  = null;
let gs_client = null;
let _gs_cb    = null;
let _gs_refreshTimer = null;

// Inicializa Google Identity Services y llama onAuth() cuando el usuario se conecta
function gsInit(onAuth, options) {
  _gs_cb = onAuth;
  const opts = options || {};

  // Usa token cacheado si aún es válido (evita cualquier popup o banner)
  const cachedTok = localStorage.getItem('gs_tok');
  const cachedExp = parseInt(localStorage.getItem('gs_tok_exp') || '0');
  const hasValidCache = cachedTok && cachedExp > Date.now();

  if (hasValidCache) {
    gs_token = cachedTok;
    setTimeout(() => { if (_gs_cb) _gs_cb(); }, 0);
  }

  // Siempre prepara el cliente GIS en segundo plano (con o sin caché), para poder
  // refrescar el token de forma silenciosa antes de que expire y así no pedir
  // sesión nunca más durante la jornada, aunque la pestaña quede abierta horas.
  _gsLoadClient(() => {
    if (hasValidCache) {
      _gsScheduleRefresh();
    } else if (localStorage.getItem('gs_was_connected')) {
      // Ya se conectó antes en este navegador: vale la pena un intento silencioso.
      gs_client.requestAccessToken({ prompt: 'none' });
    } else {
      // Primera vez en este navegador: no disparar nada automático, solo el banner.
      _gsShowAuthBanner();
    }
  });
}

function _gsLoadClient(onReady) {
  if (gs_client) { onReady(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => {
    gs_client = google.accounts.oauth2.initTokenClient({
      client_id : GS_CLIENT_ID,
      scope     : GS_SCOPES,
      callback  : r => {
        if (r.error) {
          // Reconexión silenciosa falló → muestra banner (no bloquea la pantalla, no abre pestañas)
          _gsShowAuthBanner();
          return;
        }
        gs_token = r.access_token;
        localStorage.setItem('gs_tok', r.access_token);
        localStorage.setItem('gs_tok_exp', String(Date.now() + 55 * 60 * 1000)); // 55 min
        localStorage.setItem('gs_was_connected', '1');
        const banner = document.getElementById('_gs_banner');
        if (banner) banner.remove();
        _gsScheduleRefresh();
        if (_gs_cb) _gs_cb();
      }
    });
    onReady();
  };
  document.head.appendChild(s);
}

// Programa una reconexión silenciosa ~5 min antes de que expire el token cacheado,
// para que el usuario nunca llegue a ver el banner de "sesión expirada" en uso normal.
function _gsScheduleRefresh() {
  clearTimeout(_gs_refreshTimer);
  const exp  = parseInt(localStorage.getItem('gs_tok_exp') || '0');
  const wait = Math.max(exp - Date.now() - 5 * 60 * 1000, 30 * 1000);
  _gs_refreshTimer = setTimeout(() => {
    if (gs_client) gs_client.requestAccessToken({ prompt: 'none' });
  }, wait);
}

function _gsShowAuthBanner() {
  if (document.getElementById('_gs_banner')) return;
  const el = document.createElement('div');
  el.id = '_gs_banner';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC1F1F;color:#fff;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;row-gap:4px;gap:10px;padding:8px 12px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.3px;text-align:center;box-sizing:border-box';
  el.innerHTML = `<span>Sesión expirada —</span>
    <button onclick="gsAuth()" style="padding:5px 16px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:#fff;color:#CC1F1F;border:none;cursor:pointer;font-family:inherit;border-radius:2px">Reconectar →</button>`;
  document.body.insertBefore(el, document.body.firstChild);
}

function gsAuth()       { if (gs_client) gs_client.requestAccessToken(); }
function gsConnected()  { return !!gs_token; }

function _gsShUrl(path) { return `https://sheets.googleapis.com/v4/spreadsheets/${GS_SHEET_ID}${path}`; }
function _gsHdr()       { return { Authorization: `Bearer ${gs_token}`, 'Content-Type': 'application/json' }; }

async function gsGet(range) {
  const r = await fetch(_gsShUrl(`/values/${encodeURIComponent(range)}`), { headers: _gsHdr() });
  return r.json();
}

async function gsAppend(range, values) {
  const r = await fetch(
    _gsShUrl(`/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`),
    { method: 'POST', headers: _gsHdr(), body: JSON.stringify({ values }) }
  );
  return r.json();
}

async function gsUpdate(range, values) {
  const r = await fetch(
    _gsShUrl(`/values/${encodeURIComponent(range)}?valueInputOption=RAW`),
    { method: 'PUT', headers: _gsHdr(), body: JSON.stringify({ values }) }
  );
  return r.json();
}

async function gsClear(range) {
  const r = await fetch(
    _gsShUrl(`/values/${encodeURIComponent(range)}:clear`),
    { method: 'POST', headers: { Authorization: `Bearer ${gs_token}` } }
  );
  return r.json();
}

// Sube un Blob PDF a Google Drive (crea la carpeta si no existe).
// El ID de la carpeta se guarda en memoria por nombre — así, en la misma sesión,
// la 2ª nota de venta en adelante no repite la búsqueda de carpeta (1 viaje de
// red menos en el paso más lento de "Generar Nota de Venta").
const _gsDriveFolderCache = {};
async function gsDriveUpload(blob, filename, folderName) {
  if (!gsConnected()) return null;
  try {
    let fid = _gsDriveFolderCache[folderName];
    if (!fid) {
      const q  = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
      const fl = await (await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
        { headers: { Authorization: `Bearer ${gs_token}` } }
      )).json();
      fid = fl.files && fl.files.length ? fl.files[0].id : null;
      if (!fid) {
        const c = await (await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${gs_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
        })).json();
        fid = c.id;
      }
      _gsDriveFolderCache[folderName] = fid;
    }
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: filename, parents: [fid], mimeType: 'application/pdf' })], { type: 'application/json' }));
    form.append('file', blob, filename);
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST', headers: { Authorization: `Bearer ${gs_token}` }, body: form
    });
  } catch(e) { console.warn('Error subiendo a Drive:', e); return null; }
}

// Crea la pestaña indicada si no existe (vía batchUpdate) y le pone encabezados
// si está vacía. A diferencia de gsInitSheet, esta sí puede crear la pestaña.
async function gsEnsureTab(nombre, hdr) {
  if (!gsConnected()) return;
  try {
    const meta = await (await fetch(_gsShUrl('?fields=sheets.properties.title'), { headers: _gsHdr() })).json();
    const existe = (meta.sheets || []).some(s => s.properties.title === nombre);
    if (!existe) {
      await fetch(_gsShUrl(':batchUpdate'), {
        method: 'POST', headers: _gsHdr(),
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: nombre } } }] })
      });
    }
    const res = await gsGet(`${nombre}!A1:A1`);
    if (!res.values || !res.values.length) {
      await gsUpdate(`${nombre}!A1`, [hdr]);
    }
  } catch (e) { console.warn('Error asegurando hoja', nombre, e); }
}

// Registra un aviso cruzado entre calendario-cocina.html y seguimiento-eventos.html
// (ej. "nueva reserva agregada"), para que el otro flujo lo muestre como notificación.
async function gsAgregarAviso(origen, tipo, mensaje, refId) {
  if (!gsConnected()) return;
  try {
    await gsAppend(`${TAB.AVISOS}!A2:E`, [[new Date().toISOString(), origen, tipo, mensaje, refId || '']]);
  } catch (e) { console.warn('Error agregando aviso:', e); }
}

// Crea los headers en cada pestaña de la hoja si aún están vacíos
async function gsInitSheet() {
  if (!gsConnected()) return;
  const tabs = [
    { name: TAB.PRESUPUESTOS, hdr: ['Nº Cotización','Fecha','Cliente','Evento','Fecha Evento','Nº Personas','Subtotal','IVA','Total','Estado','Servicios'] },
    { name: TAB.NOTAS_VENTA,  hdr: ['Nº NV','Nº Cotización','Fecha Emisión','Nombre Contacto','Empresa','Teléfono','Mail Contacto','Razón Social','RUT','Giro','Dirección','Mail Facturación','Nombre Evento','Fecha Evento','Nº Personas','Subtotal','IVA','Total'] },
    { name: TAB.SEG,          hdr: ['Estado','Tipo','Nº NV','Nombre','Cliente','Fecha','OC','Factura 50%','Pago 50%','Factura 100%','Pago 100%','Fact. Prov. Recibidas','Fact. Prov. Pagadas','Total','Pagado','Diferencia','Comentarios','Extras','Extras NV','Compras','Pagos','Tipo Evento'] },
    { name: TAB.RESERVAS,     hdr: ['Fecha','Nombre / Cliente','Nº Personas','Comentarios','Hora','Estado','Origen','ID','Espacio'] },
    { name: TAB.CATALOGO,     hdr: ['Categoría','Nombre Servicio','Precio Recomendado','Unidad','Grupo','Ingredientes'] },
    { name: TAB.CLIENTES,     hdr: ['Fecha','Cliente','Evento','Calificación','Comentario','Nº NV'] },
  ];
  for (const t of tabs) {
    try {
      const res = await gsGet(`${t.name}!A1:A1`);
      if (!res.values || !res.values.length) {
        await gsUpdate(`${t.name}!A1`, [t.hdr]);
      }
    } catch(e) { /* tab may not exist yet */ }
  }
}

// ─── NUMERACIÓN COMPARTIDA DE NOTAS DE VENTA ───────────────────────────────
// Usado tanto por rita-roux-notas-venta.html como por seguimiento-eventos.html
// (2ª Nota de Venta de extras) para no duplicar números.
async function gsNextNVNumber() {
  const year = new Date().getFullYear();
  try {
    const res = await gsGet(`${TAB.CONTADOR}!A1:B2`);
    if (res.values && res.values.length >= 2) {
      const añoGuardado = parseInt(res.values[0][1]);
      const num = parseInt(res.values[1][1]);
      const base = (añoGuardado === year && !isNaN(num)) ? num : 0;
      return `NV-${year}-${String(base + 1).padStart(3, '0')}`;
    }
  } catch(e) { /* fallback abajo */ }
  return `NV-${year}-001`;
}

async function gsCommitNVNumber(nvStr) {
  const year = new Date().getFullYear();
  const num = parseInt(nvStr.split('-')[2]) || 1;
  await gsUpdate(`${TAB.CONTADOR}!A1:B2`, [['Año', year], ['Número', num]]);
}

// ══════════════════════════════════════════════════════════════
// Rita Roux Eventos · Google Sheets & Drive API utilities
// ══════════════════════════════════════════════════════════════

const GS_CLIENT_ID = '7720731839-diiq519n6prur6ucjegbuk44lkgn2ojr.apps.googleusercontent.com';
const GS_SHEET_ID  = '1Uum5_SUQWd2yZJC9B7qcOmTDDpY7mXntMzJpEl72TsE';
const GS_SCOPES    = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

const TAB = {
  PRESUPUESTOS : 'Presupuestos',
  NOTAS_VENTA  : 'NotasVenta',
  CONTADOR     : 'Contador',
  SEG          : 'Seguimiento',
};

let gs_token  = null;
let gs_client = null;
let _gs_cb    = null;

// Inicializa Google Identity Services y llama onAuth() cuando el usuario se conecta
function gsInit(onAuth) {
  _gs_cb = onAuth;
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => {
    gs_client = google.accounts.oauth2.initTokenClient({
      client_id : GS_CLIENT_ID,
      scope     : GS_SCOPES,
      callback  : r => {
        if (r.error) return;
        gs_token = r.access_token;
        sessionStorage.setItem('gs_was_connected', '1');
        if (_gs_cb) _gs_cb();
      }
    });
    if (sessionStorage.getItem('gs_was_connected')) {
      gs_client.requestAccessToken({ prompt: 'none' });
    }
  };
  document.head.appendChild(s);
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

// Sube un Blob PDF a Google Drive (crea la carpeta si no existe)
async function gsDriveUpload(blob, filename, folderName) {
  if (!gsConnected()) return null;
  try {
    const q  = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const fl = await (await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${gs_token}` } }
    )).json();
    let fid = fl.files && fl.files.length ? fl.files[0].id : null;
    if (!fid) {
      const c = await (await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${gs_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
      })).json();
      fid = c.id;
    }
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: filename, parents: [fid], mimeType: 'application/pdf' })], { type: 'application/json' }));
    form.append('file', blob, filename);
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST', headers: { Authorization: `Bearer ${gs_token}` }, body: form
    });
  } catch(e) { console.warn('Error subiendo a Drive:', e); return null; }
}

// Crea los headers en cada pestaña de la hoja si aún están vacíos
async function gsInitSheet() {
  if (!gsConnected()) return;
  const tabs = [
    { name: TAB.PRESUPUESTOS, hdr: ['Nº Cotización','Fecha','Cliente','Evento','Fecha Evento','Nº Personas','Subtotal','IVA','Total','Estado','Servicios'] },
    { name: TAB.NOTAS_VENTA,  hdr: ['Nº NV','Nº Cotización','Fecha Emisión','Nombre Contacto','Empresa','Teléfono','Mail Contacto','Razón Social','RUT','Giro','Dirección','Mail Facturación','Nombre Evento','Fecha Evento','Nº Personas','Subtotal','IVA','Total'] },
    { name: TAB.SEG,          hdr: ['Estado','Tipo','Nº NV','Nombre','Cliente','Fecha','OC','Factura 50%','Pago 50%','Factura 100%','Pago 100%','Fact. Prov. Recibidas','Fact. Prov. Pagadas','Total','Pagado','Diferencia','Comentarios'] },
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

// Router dinámico de /api/cotiza/*. Vercel inyecta `req.query.action` con el
// segmento de URL, y acá lo despachamos al handler correspondiente bajo
// `_handlers/` (la carpeta con prefijo "_" no se publica como serverless
// function, así que los 10 handlers ahora cuentan como UNA sola función).
//
// El motivo es el límite de 12 serverless functions del plan Hobby de Vercel:
// con cada endpoint suelto en `api/cotiza/*.js` superábamos ese tope y los
// deploys de producción fallaban en la etapa "Deploying outputs".

import submit from "./_handlers/submit.js";
import solicitudes from "./_handlers/solicitudes.js";
import atenderSolicitud from "./_handlers/atender-solicitud.js";
import eliminarSolicitud from "./_handlers/eliminar-solicitud.js";
import tarifas from "./_handlers/tarifas.js";
import saveTarifas from "./_handlers/save-tarifas.js";
import enviarCliente from "./_handlers/enviar-cliente.js";
import cotizaciones from "./_handlers/cotizaciones.js";
import cotizacionEstado from "./_handlers/cotizacion-estado.js";
import eliminarCotizacion from "./_handlers/eliminar-cotizacion.js";
import guardarCotizacion from "./_handlers/guardar-cotizacion.js";

export const config = { runtime: "nodejs" };

const HANDLERS = {
  submit,
  solicitudes,
  "atender-solicitud": atenderSolicitud,
  "eliminar-solicitud": eliminarSolicitud,
  tarifas,
  "save-tarifas": saveTarifas,
  "enviar-cliente": enviarCliente,
  cotizaciones,
  "cotizacion-estado": cotizacionEstado,
  "eliminar-cotizacion": eliminarCotizacion,
  "guardar-cotizacion": guardarCotizacion,
};

export default async function handler(req, res) {
  const action = String(req.query?.action || "").toLowerCase();
  const fn = HANDLERS[action];
  if (!fn) {
    return res.status(404).json({ error: "not_found", action });
  }
  return fn(req, res);
}

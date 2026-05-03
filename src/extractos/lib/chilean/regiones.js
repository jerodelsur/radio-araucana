// División político-administrativa de Chile: regiones, provincias, comunas.
// Fuente: SUBDERE/INE (cobertura de las 16 regiones, 56 provincias, 346 comunas).
//
// Uso: el cotizador presenta autocomplete por nombre de comuna y autollena
// provincia y región. Si el cliente no encuentra su comuna en la lista,
// puede escribir manualmente — la operadora valida en el dashboard.

export const REGIONES = [
  {
    id: "AP",
    nombre: "Arica y Parinacota",
    romano: "XV",
    provincias: [
      { nombre: "Arica", comunas: ["Arica", "Camarones"] },
      { nombre: "Parinacota", comunas: ["Putre", "General Lagos"] },
    ],
  },
  {
    id: "TA",
    nombre: "Tarapacá",
    romano: "I",
    provincias: [
      { nombre: "Iquique", comunas: ["Iquique", "Alto Hospicio"] },
      { nombre: "Tamarugal", comunas: ["Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
    ],
  },
  {
    id: "AN",
    nombre: "Antofagasta",
    romano: "II",
    provincias: [
      { nombre: "Antofagasta", comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal"] },
      { nombre: "El Loa", comunas: ["Calama", "Ollagüe", "San Pedro de Atacama"] },
      { nombre: "Tocopilla", comunas: ["Tocopilla", "María Elena"] },
    ],
  },
  {
    id: "AT",
    nombre: "Atacama",
    romano: "III",
    provincias: [
      { nombre: "Copiapó", comunas: ["Copiapó", "Caldera", "Tierra Amarilla"] },
      { nombre: "Chañaral", comunas: ["Chañaral", "Diego de Almagro"] },
      { nombre: "Huasco", comunas: ["Vallenar", "Alto del Carmen", "Freirina", "Huasco"] },
    ],
  },
  {
    id: "CO",
    nombre: "Coquimbo",
    romano: "IV",
    provincias: [
      { nombre: "Elqui", comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña"] },
      { nombre: "Limarí", comunas: ["Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"] },
      { nombre: "Choapa", comunas: ["Illapel", "Canela", "Los Vilos", "Salamanca"] },
    ],
  },
  {
    id: "VA",
    nombre: "Valparaíso",
    romano: "V",
    provincias: [
      { nombre: "Valparaíso", comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar"] },
      { nombre: "Isla de Pascua", comunas: ["Isla de Pascua"] },
      { nombre: "Los Andes", comunas: ["Los Andes", "Calle Larga", "Rinconada", "San Esteban"] },
      { nombre: "Petorca", comunas: ["La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar"] },
      { nombre: "Quillota", comunas: ["Quillota", "La Calera", "Hijuelas", "La Cruz", "Nogales"] },
      { nombre: "San Antonio", comunas: ["San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo"] },
      { nombre: "San Felipe de Aconcagua", comunas: ["San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María"] },
      { nombre: "Marga Marga", comunas: ["Quilpué", "Limache", "Olmué", "Villa Alemana"] },
    ],
  },
  {
    id: "RM",
    nombre: "Región Metropolitana de Santiago",
    romano: "RM",
    provincias: [
      {
        nombre: "Santiago",
        comunas: [
          "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba",
          "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina",
          "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa",
          "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura",
          "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón",
          "Santiago", "Vitacura",
        ],
      },
      { nombre: "Cordillera", comunas: ["Puente Alto", "Pirque", "San José de Maipo"] },
      { nombre: "Chacabuco", comunas: ["Colina", "Lampa", "Til Til"] },
      { nombre: "Maipo", comunas: ["San Bernardo", "Buin", "Calera de Tango", "Paine"] },
      { nombre: "Melipilla", comunas: ["Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro"] },
      { nombre: "Talagante", comunas: ["Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"] },
    ],
  },
  {
    id: "LI",
    nombre: "Libertador General Bernardo O'Higgins",
    romano: "VI",
    provincias: [
      {
        nombre: "Cachapoal",
        comunas: [
          "Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras",
          "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco",
          "Rengo", "Requínoa", "San Vicente",
        ],
      },
      { nombre: "Cardenal Caro", comunas: ["Pichilemu", "La Estrella", "Litueche", "Marchigüe", "Navidad", "Paredones"] },
      {
        nombre: "Colchagua",
        comunas: [
          "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo",
          "Placilla", "Pumanque", "Santa Cruz",
        ],
      },
    ],
  },
  {
    id: "ML",
    nombre: "Maule",
    romano: "VII",
    provincias: [
      {
        nombre: "Talca",
        comunas: [
          "Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue",
          "Río Claro", "San Clemente", "San Rafael",
        ],
      },
      { nombre: "Cauquenes", comunas: ["Cauquenes", "Chanco", "Pelluhue"] },
      {
        nombre: "Curicó",
        comunas: [
          "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia",
          "Teno", "Vichuquén",
        ],
      },
      {
        nombre: "Linares",
        comunas: [
          "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre",
          "Yerbas Buenas",
        ],
      },
    ],
  },
  {
    id: "NB",
    nombre: "Ñuble",
    romano: "XVI",
    provincias: [
      {
        nombre: "Diguillín",
        comunas: [
          "Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón",
          "San Ignacio", "Yungay",
        ],
      },
      {
        nombre: "Itata",
        comunas: ["Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Trehuaco"],
      },
      {
        nombre: "Punilla",
        comunas: ["San Carlos", "Coihueco", "Ñiquén", "San Fabián", "San Nicolás"],
      },
    ],
  },
  {
    id: "BI",
    nombre: "Biobío",
    romano: "VIII",
    provincias: [
      {
        nombre: "Concepción",
        comunas: [
          "Concepción", "Chiguayante", "Coronel", "Florida", "Hualpén", "Hualqui", "Lota",
          "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé",
        ],
      },
      { nombre: "Arauco", comunas: ["Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa"] },
      {
        nombre: "Biobío",
        comunas: [
          "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete",
          "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel",
          "Alto Biobío",
        ],
      },
    ],
  },
  {
    id: "AR",
    nombre: "La Araucanía",
    romano: "IX",
    provincias: [
      {
        nombre: "Cautín",
        comunas: [
          "Temuco", "Carahue", "Cholchol", "Cunco", "Curarrehue", "Freire", "Galvarino",
          "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas",
          "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén",
          "Vilcún", "Villarrica",
        ],
      },
      {
        nombre: "Malleco",
        comunas: [
          "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco",
          "Purén", "Renaico", "Traiguén", "Victoria",
        ],
      },
    ],
  },
  {
    id: "LR",
    nombre: "Los Ríos",
    romano: "XIV",
    provincias: [
      {
        nombre: "Valdivia",
        comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli"],
      },
      {
        nombre: "Ranco",
        comunas: ["La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
      },
    ],
  },
  {
    id: "LL",
    nombre: "Los Lagos",
    romano: "X",
    provincias: [
      {
        nombre: "Llanquihue",
        comunas: [
          "Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Llanquihue",
          "Los Muermos", "Maullín", "Puerto Varas",
        ],
      },
      {
        nombre: "Chiloé",
        comunas: [
          "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén",
          "Quellón", "Quemchi", "Quinchao",
        ],
      },
      {
        nombre: "Osorno",
        comunas: [
          "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa",
          "San Pablo",
        ],
      },
      { nombre: "Palena", comunas: ["Chaitén", "Futaleufú", "Hualaihué", "Palena"] },
    ],
  },
  {
    id: "AY",
    nombre: "Aysén del General Carlos Ibáñez del Campo",
    romano: "XI",
    provincias: [
      { nombre: "Coyhaique", comunas: ["Coyhaique", "Lago Verde"] },
      { nombre: "Aysén", comunas: ["Aysén", "Cisnes", "Guaitecas"] },
      { nombre: "Capitán Prat", comunas: ["Cochrane", "O'Higgins", "Tortel"] },
      { nombre: "General Carrera", comunas: ["Chile Chico", "Río Ibáñez"] },
    ],
  },
  {
    id: "MA",
    nombre: "Magallanes y la Antártica Chilena",
    romano: "XII",
    provincias: [
      { nombre: "Magallanes", comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio"] },
      { nombre: "Antártica Chilena", comunas: ["Cabo de Hornos", "Antártica"] },
      { nombre: "Tierra del Fuego", comunas: ["Porvenir", "Primavera", "Timaukel"] },
      { nombre: "Última Esperanza", comunas: ["Natales", "Torres del Paine"] },
    ],
  },
];

/**
 * Normaliza un nombre para comparación (quita tildes, lowercase, trims).
 * @param {string} value
 */
function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Index plano para búsquedas por nombre de comuna.
const COMUNAS_INDEX = (() => {
  /** @type {Array<{ comuna:string, provincia:string, region:string, key:string }>} */
  const list = [];
  for (const region of REGIONES) {
    for (const provincia of region.provincias) {
      for (const comuna of provincia.comunas) {
        list.push({
          comuna,
          provincia: provincia.nombre,
          region: region.nombre,
          key: normalize(comuna),
        });
      }
    }
  }
  return list;
})();

/**
 * Busca comunas que comiencen o contengan el query (case/tilde insensitive).
 * @param {string} query
 * @param {number} [limit=10]
 */
export function searchComunas(query, limit = 10) {
  const q = normalize(query);
  if (!q) return [];
  const startsWith = [];
  const contains = [];
  for (const entry of COMUNAS_INDEX) {
    if (entry.key === q) {
      startsWith.unshift(entry);
    } else if (entry.key.startsWith(q)) {
      startsWith.push(entry);
    } else if (entry.key.includes(q)) {
      contains.push(entry);
    }
    if (startsWith.length + contains.length >= limit * 2) break;
  }
  return [...startsWith, ...contains].slice(0, limit);
}

/**
 * @param {string} nombre
 * @returns {{ comuna:string, provincia:string, region:string } | null}
 */
export function findComunaExacta(nombre) {
  const q = normalize(nombre);
  if (!q) return null;
  const hit = COMUNAS_INDEX.find((entry) => entry.key === q);
  if (!hit) return null;
  return { comuna: hit.comuna, provincia: hit.provincia, region: hit.region };
}

export const TOTAL_COMUNAS = COMUNAS_INDEX.length;

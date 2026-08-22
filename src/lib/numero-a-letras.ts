/**
 * Convierte montos numéricos a letras en español formato legal/financiero peruano.
 * Ej: 12000 USD -> "DOCE MIL CON 00/100 DÓLARES AMERICANOS"
 * Ej: 15500.50 PEN -> "QUINCE MIL QUINIENTOS CON 50/100 SOLES"
 */

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIEZ_A_DIECINUEVE = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];
const DECENAS = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];
const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function leerGrupo3Digitos(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  const decUnidad = d * 10 + u;
  if (decUnidad >= 10 && decUnidad <= 19) {
    partes.push(DIEZ_A_DIECINUEVE[decUnidad - 10]);
  } else if (decUnidad >= 21 && decUnidad <= 29) {
    partes.push(`VEINTI${UNIDADES[u]}`);
  } else if (d > 0) {
    partes.push(DECENAS[d]);
    if (u > 0) partes.push(`Y ${UNIDADES[u]}`);
  } else if (u > 0) {
    partes.push(UNIDADES[u]);
  }

  return partes.join(' ').trim();
}

export function convertirEnteroALetras(n: number): string {
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push('UN MILLÓN');
    } else {
      partes.push(`${leerGrupo3Digitos(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push('MIL');
    } else {
      partes.push(`${leerGrupo3Digitos(miles)} MIL`);
    }
  }

  if (resto > 0) {
    partes.push(leerGrupo3Digitos(resto));
  }

  return partes.join(' ').trim();
}

export function montoALetras(
  monto: number | string | undefined | null,
  moneda: string = 'USD',
): string {
  if (monto === undefined || monto === null || String(monto).trim() === '') return '';

  const clean = String(monto).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) return '';

  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  const textoEntero = convertirEnteroALetras(entero);

  let sufijoMoneda = 'DÓLARES AMERICANOS';
  const monUpper = moneda.toUpperCase();
  if (monUpper === 'PEN' || monUpper === 'SOLES' || monUpper === 'SOL') {
    sufijoMoneda = entero === 1 ? 'SOL' : 'SOLES';
  } else if (monUpper === 'EUR' || monUpper === 'EUROS' || monUpper === 'EURO') {
    sufijoMoneda = entero === 1 ? 'EURO' : 'EUROS';
  }

  return `${textoEntero} CON ${centavosStr}/100 ${sufijoMoneda}`.toUpperCase();
}

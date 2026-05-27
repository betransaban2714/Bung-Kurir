/**
 * Utility untuk parsing koordinat secara lokal tanpa AI.
 * Mendukung format desimal dan DMS (Degrees, Minutes, Seconds).
 */

export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  // 1. Cek format desimal: -0.6980957, 127.4651223
  const decimalRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const decimalMatch = input.match(decimalRegex);
  if (decimalMatch) {
    return {
      lat: parseFloat(decimalMatch[1]),
      lng: parseFloat(decimalMatch[2])
    };
  }

  // 2. Cek format DMS: 0° 41′ 53.14452″ N, 127° 27′ 54.44028″ E
  // Mendukung berbagai variasi simbol derajat, menit, dan detik
  const dmsRegex = /(\d+)[°\s]+(\d+)[′'\s]+([\d.]+)[″"\s]+([NSns])\s*[,;]?\s*(\d+)[°\s]+(\d+)[′'\s]+([\d.]+)[″"\s]+([EeWwOo])/;
  const dmsMatch = input.match(dmsRegex);
  
  if (dmsMatch) {
    const convert = (deg: string, min: string, sec: string, dir: string) => {
      let d = parseInt(deg) + parseInt(min) / 60 + parseFloat(sec) / 3600;
      const direction = dir.toUpperCase();
      if (direction === 'S' || direction === 'W' || direction === 'O') d = -d;
      return d;
    };

    return {
      lat: convert(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4]),
      lng: convert(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8])
    };
  }

  return null;
}

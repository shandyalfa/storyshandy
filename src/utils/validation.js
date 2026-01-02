export function require(value, name) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${name} wajib diisi.`);
  }
}
export function validateLatLng(lat, lng) {
  if (isNaN(lat) || isNaN(lng)) throw new Error('Koordinat tidak valid.');
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('Koordinat di luar jangkauan.');
}

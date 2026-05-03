const NodeGeocoder = require('node-geocoder');

// Konfigurasi Geocoder
// Menggunakan OpenStreetMap (Nominatim) sebagai provider default (Gratis & No API Key)
const options = {
  provider: 'openstreetmap',
  // Opsi tambahan jika ingin menggunakan Google/MapQuest di masa depan:
  // apiKey: process.env.GEOCODER_API_KEY, 
  formatter: null 
};

const geocoder = NodeGeocoder(options);

/**
 * Geocode Address
 * Mengubah nama lokasi (Kabupaten/Kota) menjadi koordinat [lat, lng]
 * 
 * @param {string} location - Nama kota atau kabupaten (misal: "Bandung", "Kabupaten Sleman")
 * @returns {Promise<Array|null>} - Mengembalikan [lat, lng] atau null jika tidak ditemukan
 */
const geocodeLocation = async (location) => {
  if (!location || location === 'undefined' || location === 'null') {
    return null;
  }

  try {
    // Normalisasi: Hapus "KAB.", "KABUPATEN", "KOTA" untuk hasil yang lebih bersih di OSM
    let cleanLocation = location
      .replace(/KAB\./gi, '')
      .replace(/KABUPATEN/gi, '')
      .replace(/KOTA/gi, '')
      .trim();

    // Tambahkan ", Indonesia" untuk memastikan hasil pencarian lebih akurat
    const query = `${cleanLocation}, Indonesia`;
    const res = await geocoder.geocode(query);

    if (!res || res.length === 0) {
      return null;
    }

    // Ambil hasil pertama yang paling relevan
    const { latitude, longitude } = res[0];
    return [latitude, longitude];
  } catch (error) {
    console.error(`[Geocoder] Error saat geocoding ${location}:`, error.message);
    return null;
  }
};

module.exports = {
  geocoder,
  geocodeLocation
};

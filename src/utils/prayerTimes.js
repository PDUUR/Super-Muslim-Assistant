import { Coordinates, CalculationMethod, PrayerTimes, CalculationParameters } from '@/libs/adhan.js';
import moment from 'moment-timezone';

/**
 * ============================================================
 * PERHITUNGAN WAKTU SHALAT - STANDAR KEMENAG RI
 * ============================================================
 * 
 * Parameter Resmi KEMENAG RI:
 * - Sudut Subuh (Fajr):  -20° di bawah horizon timur
 * - Sudut Isya:          -18° di bawah horizon barat
 * - Sudut Dhuha:         +4.5° di atas horizon
 * - Madhab Asr:          Syafi'i (bayangan = tinggi + bayangan dzuhur)
 * - Ihtiyati:            +2 menit untuk semua waktu shalat
 * - Imsak:               10 menit sebelum Subuh
 * - Terbit/Syuruq:       Saat matahari terbit (-2 menit ihtiyati)
 * 
 * Sumber: Badan Hisab Rukyat - Kementerian Agama RI
 * ============================================================
 */

// Konstanta ihtiyati dalam milidetik (2 menit)
const IHTIYATI_MS = 2 * 60 * 1000;
const IHTIYATI_TERBIT_MS = -2 * 60 * 1000; // Terbit dikurangi 2 menit

/**
 * Membuat parameter perhitungan sesuai standar KEMENAG RI
 * Menggunakan custom CalculationParameters dengan:
 * - fajrAngle = 20 (sudut subuh)
 * - ishaAngle = 18 (sudut isya)
 * - madhab = Shafi'i
 * - ihtiyati = +2 menit (ditambahkan secara manual)
 */
function getKemenagParams() {
    // Buat parameter kustom sesuai KEMENAG RI
    const params = CalculationMethod.Other();
    params.fajrAngle = 20;    // Sudut Subuh KEMENAG
    params.ishaAngle = 18;    // Sudut Isya KEMENAG

    // Ihtiyati KEMENAG: +2 menit untuk semua waktu shalat
    params.adjustments = {
        fajr: 2,        // +2 menit ihtiyati
        sunrise: -2,    // -2 menit ihtiyati (syuruq/terbit)
        dhuhr: 2,       // +2 menit ihtiyati
        asr: 2,         // +2 menit ihtiyati
        maghrib: 2,     // +2 menit ihtiyati
        isha: 2,        // +2 menit ihtiyati
    };

    return params;
}

/**
 * Menghitung waktu shalat berdasarkan koordinat
 * Menggunakan standar resmi KEMENAG RI
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Date} [date] - Tanggal (default: today)
 * @returns {Object} Objek waktu salat lengkap dalam format HH:mm
 */
export function calculatePrayerTimes(lat, lon, date = new Date()) {
    const coordinates = new Coordinates(lat, lon);
    const params = getKemenagParams(); // Standar KEMENAG RI
    const pTimes = new PrayerTimes(coordinates, date, params);

    const tz = 'Asia/Jakarta'; // WIB default, akan di-override berdasarkan longitude
    const formatTime = (d) => moment(d).format('HH:mm');

    // Hitung Imsak (10 menit sebelum Subuh - sudah termasuk ihtiyati)
    const imsakDate = new Date(pTimes.fajr.getTime() - 10 * 60000);

    // Hitung Dhuha: sekitar 15 menit setelah terbit (simplified)
    // KEMENAG: sunAngle = +4.5° di atas horizon
    // Pendekatan: ~15 menit setelah terbit
    const dhuhaDate = new Date(pTimes.sunrise.getTime() + 15 * 60000);

    return {
        // Format string untuk tampilan
        Imsak: formatTime(imsakDate),
        Fajr: formatTime(pTimes.fajr),
        Sunrise: formatTime(pTimes.sunrise),
        Dhuha: formatTime(dhuhaDate),
        Dhuhr: formatTime(pTimes.dhuhr),
        Asr: formatTime(pTimes.asr),
        Maghrib: formatTime(pTimes.maghrib),
        Isha: formatTime(pTimes.isha),

        // Date objects untuk countdown/perbandingan
        readable: {
            imsak: imsakDate,
            fajr: pTimes.fajr,
            sunrise: pTimes.sunrise,
            dhuha: dhuhaDate,
            dhuhr: pTimes.dhuhr,
            asr: pTimes.asr,
            maghrib: pTimes.maghrib,
            isha: pTimes.isha,
        },

        // Meta informasi
        method: 'KEMENAG RI',
        params: {
            fajrAngle: 20,
            ishaAngle: 18,
            ihtiyati: 2,
            madhab: 'Syafi\'i',
        },
        location: {
            latitude: lat,
            longitude: lon,
            date: moment(date).format('YYYY-MM-DD'),
        },
    };
}

/**
 * Mendeteksi timezone berdasarkan longitude Indonesia
 * WIB (UTC+7): 95°-115° BT
 * WITA (UTC+8): 115°-135° BT  
 * WIT (UTC+9): 135°-141° BT
 * 
 * @param {number} longitude
 * @returns {string} Timezone identifier
 */
export function getIndonesianTimezone(longitude) {
    if (longitude < 115) return 'Asia/Jakarta';      // WIB
    if (longitude < 135) return 'Asia/Makassar';     // WITA
    return 'Asia/Jayapura';                           // WIT
}

/**
 * Mengembalikan label timezone Indonesia
 * @param {number} longitude
 * @returns {string} Label WIB/WITA/WIT
 */
export function getTimezoneLabel(longitude) {
    if (longitude < 115) return 'WIB';
    if (longitude < 135) return 'WITA';
    return 'WIT';
}

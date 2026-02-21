import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import axios from 'axios';
import { useIbadahStore } from './ibadahStore';

export const useAudioStore = defineStore('audioStore', () => {
    const audio = new Audio();
    const state = reactive({
        isPlaying: false,
        currentSurah: JSON.parse(localStorage.getItem('audio-current-surah')) || null,
        currentAyatIndex: parseInt(localStorage.getItem('audio-current-index')) || -1,
        audioMode: localStorage.getItem('audio-mode') || 'single', // 'single', 'continuous', 'surah', 'ayat'
        audioList: JSON.parse(localStorage.getItem('audio-list')) || [], // All ayat objects for current surah
        surahInfo: JSON.parse(localStorage.getItem('audio-surah-info')) || null, // Basic info of current surah
        lastTime: parseFloat(localStorage.getItem('audio-last-time')) || 0,
        selectedQari: localStorage.getItem('selected-qari') || '01',
        qaris: [
            { id: '01', name: 'Abdullah Al-Juhany' },
            { id: '02', name: 'Abdul-Muhsin Al-Qasim' },
            { id: '03', name: 'Abdurrahman As-Sudais' },
            { id: '04', name: 'Ibrahim Al-Dossari' },
            { id: '05', name: 'Misyari Rasyid Al-Afasi' },
            { id: '06', name: 'Akram Al-Alaqmi' }
        ]
    });

    audio.onended = () => {
        handleAudioEnded();
    };

    audio.onplay = () => {
        state.isPlaying = true;
    };

    audio.onpause = () => {
        state.isPlaying = false;
        localStorage.setItem('audio-last-time', audio.currentTime);
    };

    audio.ontimeupdate = () => {
        if (Math.floor(audio.currentTime) % 5 === 0) {
            localStorage.setItem('audio-last-time', audio.currentTime);
        }
    };

    function setQari(qariId) {
        state.selectedQari = qariId;
        localStorage.setItem('selected-qari', qariId);
        // If playing, restart current ayat with new qari
        if (state.isPlaying && state.currentAyatIndex !== -1) {
            playAyat(state.currentAyatIndex);
        }
    }

    function playSurah(surahData, startIndex = 0) {
        state.currentSurah = surahData;
        state.surahInfo = {
            nomor: surahData.nomor,
            namaLatin: surahData.namaLatin,
        };
        state.audioList = surahData.ayat;

        // Save to Persistence
        localStorage.setItem('audio-current-surah', JSON.stringify(state.currentSurah));
        localStorage.setItem('audio-surah-info', JSON.stringify(state.surahInfo));
        localStorage.setItem('audio-list', JSON.stringify(state.audioList));

        playAyat(startIndex);
    }

    function playAyat(index, resume = false) {
        if (index < 0 || index >= state.audioList.length) {
            stop();
            return;
        }

        state.currentAyatIndex = index;
        localStorage.setItem('audio-current-index', index);

        const ayat = state.audioList[index];
        audio.src = ayat.audio[state.selectedQari];

        if (resume && state.lastTime > 0) {
            audio.currentTime = state.lastTime;
        } else {
            localStorage.setItem('audio-last-time', 0);
        }

        audio.play();

        // Update Media Session Metadata
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `QS. ${state.surahInfo?.namaLatin} [Ayat ${index + 1}]`,
                artist: state.qaris.find(q => q.id === state.selectedQari)?.name || 'Qari',
                album: 'Super Muslim Assistant',
                artwork: [
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '96x96', type: 'image/png' },
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '128x128', type: 'image/png' },
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '192x192', type: 'image/png' },
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '256x256', type: 'image/png' },
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '384x384', type: 'image/png' },
                    { src: 'https://i.ibb.co.com/8m4FpP9/masjid-logo.png', sizes: '512x512', type: 'image/png' },
                ]
            });

            // Action Handlers for Background Controls
            navigator.mediaSession.setActionHandler('play', () => toggle());
            navigator.mediaSession.setActionHandler('pause', () => toggle());
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (state.currentAyatIndex > 0) playAyat(state.currentAyatIndex - 1);
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (state.currentAyatIndex < state.audioList.length - 1) playAyat(state.currentAyatIndex + 1);
                else handleAudioEnded();
            });
        }
    }

    function init() {
        if (state.currentSurah && state.currentAyatIndex !== -1) {
            const ayat = state.audioList[state.currentAyatIndex];
            audio.src = ayat.audio[state.selectedQari];
            audio.currentTime = state.lastTime;
        }
    }

    function toggle() {
        if (audio.src) {
            if (state.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }
    }

    function stop() {
        audio.pause();
        audio.currentTime = 0;
        state.isPlaying = false;
        state.currentAyatIndex = -1;
        state.lastTime = 0;
        localStorage.removeItem('audio-current-surah');
        localStorage.removeItem('audio-surah-info');
        localStorage.removeItem('audio-list');
        localStorage.removeItem('audio-current-index');
        localStorage.removeItem('audio-last-time');
    }

    async function handleAudioEnded() {
        state.isPlaying = false;

        if (state.audioMode === 'single') return;

        if (state.audioMode === 'ayat') {
            audio.play();
        } else if (state.audioMode === 'surah' || state.audioMode === 'continuous') {
            if (state.currentAyatIndex < state.audioList.length - 1) {
                // Play next ayat in the same surah
                playAyat(state.currentAyatIndex + 1);
                window.dispatchEvent(new CustomEvent('ayat-changed', { detail: { index: state.currentAyatIndex } }));
            } else {
                // Surah Finished (Looping or Next)
                if (state.surahInfo && state.surahInfo.nomor) {
                    const ibadahStore = useIbadahStore();
                    ibadahStore.markSurahListened(state.surahInfo.nomor);
                }

                if (state.audioMode === 'surah') {
                    // Loop same surah
                    playAyat(0);
                } else if (state.audioMode === 'continuous') {
                    // Play next surah
                    if (state.surahInfo && state.surahInfo.nomor < 114) {
                        const nextNomor = state.surahInfo.nomor + 1;
                        try {
                            const response = await axios.get(`https://equran.id/api/v2/surat/${nextNomor}`);
                            const nextSurahData = response.data.data;

                            window.dispatchEvent(new CustomEvent('surah-changed', { detail: { nomor: nextNomor } }));
                            playSurah(nextSurahData, 0);
                        } catch (error) {
                            console.error("Failed to load next surah", error);
                            stop();
                        }
                    } else {
                        stop();
                    }
                }
            }
        }
    }

    return {
        state,
        playSurah,
        playAyat,
        toggle,
        stop,
        setQari,
        init,
        audio
    };
});

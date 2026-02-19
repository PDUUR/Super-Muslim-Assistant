import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';

export const usePuasaStore = defineStore('puasa', () => {
    const logs = ref(JSON.parse(localStorage.getItem('puasa_logs') || '[]'));

    // Map logs by date for O(1) lookup in calendar
    const logsMapped = computed(() => {
        const map = {};
        logs.value.forEach(log => {
            map[log.date] = log;
        });
        return map;
    });

    const addLog = (log) => {
        // Remove existing log for the same date if any
        logs.value = logs.value.filter(l => l.date !== log.date);

        logs.value.push({
            id: Date.now(),
            date: log.date,
            status: log.status,
            note: log.note,
            createdAt: new Date().toISOString()
        });
    };

    const deleteLog = (id) => {
        logs.value = logs.value.filter(log => log.id !== id);
    };

    const deleteLogByDate = (date) => {
        logs.value = logs.value.filter(log => log.date !== date);
    };

    watch(logs, (newLogs) => {
        localStorage.setItem('puasa_logs', JSON.stringify(newLogs));
    }, { deep: true });

    return {
        logs,
        logsMapped,
        addLog,
        deleteLog,
        deleteLogByDate
    };
});

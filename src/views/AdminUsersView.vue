<template>
  <div class="max-w-7xl mx-auto pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">Umat Manager</h1>
        <p class="text-slate-500 dark:text-gray-400 text-sm">Monitor keaktifan dan kendalikan akses komunitas Muslim.</p>
      </div>
      <div class="flex items-center gap-2">
         <div class="relative">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input v-model="searchQuery" type="text" placeholder="Cari username..." 
              class="pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none w-64 transition-all text-slate-800 dark:text-white text-sm">
         </div>
         <button @click="adminStore.fetchStats()" class="w-11 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <i class="fas fa-sync-alt" :class="{ 'animate-spin': adminStore.isLoading }"></i>
         </button>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div v-for="card in adminStore.statsCards" :key="card.label" 
           class="bg-white dark:bg-white/5 p-5 rounded-[2.5rem] border border-white/20 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 text-4xl opacity-10 group-hover:scale-125 transition-transform duration-500">
           {{ card.icon }}
        </div>
        <p class="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">{{ card.label }}</p>
        <h4 class="text-2xl font-black text-slate-800 dark:text-white leading-none">{{ card.value }}</h4>
      </div>
    </div>

    <div class="bg-white dark:bg-white/5 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50/50 dark:bg-white/5 text-slate-400 dark:text-gray-500 text-left text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th class="px-8 py-6">User / Account</th>
              <th class="px-6 py-6 text-center">Status</th>
              <th class="px-6 py-6">Progress</th>
              <th class="px-6 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="user in filteredUsers" :key="user.id" 
                class="hover:bg-slate-50/80 dark:hover:bg-white/10 transition-colors group"
                :class="{ 'opacity-50 grayscale': user.deleted_at }">
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                       :class="getAvatarColor(user.display_name || user.username)">
                    {{ (user.display_name || user.username || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                       <span class="font-black text-slate-800 dark:text-white truncate">{{ user.display_name || user.username }}</span>
                       <span v-if="user.role === 'admin'" class="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">ADMIN</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium">@{{ user.username || 'user-' + user.id.slice(0,4) }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center gap-1.5">
                   <!-- Online/Offline Indicator -->
                   <div v-if="!user.deleted_at && !user.is_blocked" class="flex items-center gap-1.5 px-3 py-1 rounded-full border" 
                        :class="user.isOnline ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'">
                      <span class="w-1.5 h-1.5 rounded-full" :class="user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'"></span>
                      <span class="text-[9px] font-black uppercase tracking-widest">{{ user.isOnline ? 'Online' : 'Offline' }}</span>
                   </div>

                   <!-- Role/Restricted Status -->
                   <span v-if="user.deleted_at" class="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">DELETED</span>
                   <span v-else-if="user.is_blocked" class="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">BLOCKED</span>
                   
                   <!-- Last Seen Info -->
                   <p v-if="!user.isOnline" class="text-[8px] text-slate-400 uppercase font-black tracking-tight mt-0.5">
                      Seen: {{ formatLastSeen(user.lastActive) }}
                   </p>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 mb-1">
                     <span class="text-xs font-black text-slate-700 dark:text-gray-200">LVL {{ user.level || 1 }}</span>
                     <span class="text-[9px] text-emerald-500 font-bold tracking-widest">{{ (user.total_points || 0).toLocaleString() }} XP</span>
                  </div>
                  <div class="w-24 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-500 rounded-full" :style="{ width: (user.total_points % 100) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                   <!-- Edit XP -->
                   <button @click="handleEditXp(user)" 
                           class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                     <i class="fas fa-coins text-xs"></i>
                   </button>
                   
                   <!-- Toggle Role -->
                   <button @click="handleChangeRole(user)"
                           class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center"
                           title="Change Role">
                     <i class="fas fa-user-shield text-xs"></i>
                   </button>

                   <!-- Block / Unblock -->
                   <button @click="handleToggleBlock(user)"
                           class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 transition-all flex items-center justify-center"
                           :class="user.is_blocked ? 'text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'text-amber-500 hover:bg-amber-500 hover:text-white'"
                           :title="user.is_blocked ? 'Unblock' : 'Block'">
                     <i class="fas" :class="user.is_blocked ? 'fa-unlock' : 'fa-ban'"></i>
                   </button>

                   <!-- Soft Delete -->
                   <button v-if="!user.deleted_at" @click="handleDelete(user)"
                           class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                           title="Nonaktifkan User (Soft Delete)">
                     <i class="fas fa-user-minus text-xs"></i>
                   </button>

                   <!-- Hard Delete Permanen -->
                   <button @click="handleHardDelete(user)"
                           class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                           title="Hapus Permanen (Firestore)">
                     <i class="fas fa-trash-alt text-xs"></i>
                   </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- States -->
      <div v-if="adminStore.error" class="p-10 text-center">
          <div class="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
             <i class="fas fa-exclamation-triangle text-xl"></i>
          </div>
          <h3 class="font-black text-slate-800 dark:text-white mb-1">Gagal Sinkronisasi</h3>
          <p class="text-xs text-slate-400 mb-6 max-w-xs mx-auto text-balance">{{ adminStore.error }}</p>
          <button @click="adminStore.initialize()" class="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              🔄 Muat Ulang
          </button>
      </div>
      
      <div v-if="adminStore.isLoading && adminStore.users.length === 0" class="p-20 text-center">
          <div class="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-2xl animate-spin mx-auto mb-6"></div>
          <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Mengumpulkan data umat...</p>
      </div>

      <div v-if="!adminStore.isLoading && filteredUsers.length === 0 && !adminStore.error" class="p-20 text-center text-slate-400">
          <div class="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <i class="fas fa-search-minus text-2xl text-slate-300"></i>
          </div>
          <p class="text-sm font-bold text-slate-500">Tidak ada user yang sesuai kriteria.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/adminStore'

const adminStore = useAdminStore()
const searchQuery = ref('')

const filteredUsers = computed(() => {
    if (!searchQuery.value) return adminStore.users
    const q = searchQuery.value.toLowerCase()
    return adminStore.users.filter(u => 
        (u.username || '').toLowerCase().includes(q) || 
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    )
})

const handleEditXp = async (user) => {
    const currentXp = user.total_points || 0
    const val = prompt(`Edit TOTAL XP untuk ${user.display_name || user.username}:`, currentXp)
    if (val === null) return
    
    const newXp = parseInt(val)
    if (isNaN(newXp)) return alert('Masukkan angka yang valid')

    try {
        await adminStore.editUserPoints(user.id, newXp)
        alert('XP berhasil diupdate!')
    } catch (err) {
        alert('Gagal: ' + err.message)
    }
}

const handleChangeRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`Ubah role ${user.display_name || user.username} menjadi "${newRole.toUpperCase()}"?`)) return

    try {
        await adminStore.updateUserRole(user.id, newRole)
        alert('Role berhasil diperbarui')
    } catch (err) {
        alert('Gagal: ' + err.message)
    }
}

const handleToggleBlock = async (user) => {
    const action = user.is_blocked ? 'Unblock' : 'BLOCK'
    if (!confirm(`Yakin ingin ${action} user ${user.display_name || user.username}?`)) return

    try {
        await adminStore.toggleBlockUser(user.id, user.is_blocked)
        alert(`User berhasil di-${action.toLowerCase()}`)
    } catch (err) {
        alert('Gagal: ' + err.message)
    }
}

const handleDelete = async (user) => {
    const result = await Swal.fire({
        title: 'Nonaktifkan User?',
        text: `User ${user.display_name || user.username} akan ditandai sebagai 'Deleted' & tidak bisa login.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, Nonaktifkan',
        cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
        try {
            await adminStore.deleteUser(user.id)
            Swal.fire('Berhasil', 'User telah dinonaktifkan.', 'success')
        } catch (err) {
            Swal.fire('Gagal', err.message, 'error')
        }
    }
}

const handleHardDelete = async (user) => {
    // Konfirmasi 1: SweetAlert
    const result = await Swal.fire({
        title: 'HAPUS PERMANEN?',
        html: `Anda akan menghapus <b>${user.display_name || user.username}</b> dari Firestore.<br><small class="text-rose-500 font-bold">Tindakan ini tidak bisa dibatalkan!</small>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Hapus Sekarang',
        cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
        // Konfirmasi 2: Input manual untuk keamanan ekstra
        const { value: confirmName } = await Swal.fire({
            title: 'Konfirmasi Terakhir',
            text: `Ketik "${user.display_name || user.username}" untuk menghapus:`,
            input: 'text',
            inputPlaceholder: 'Nama user...',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
        })

        if (confirmName === (user.display_name || user.username)) {
            try {
                await adminStore.hardDeleteUser(user.id)
                Swal.fire({
                    title: 'Terhapus!',
                    text: 'Data Firestore user berhasil dihapus permanen. Catatan: User mungkin masih ada di Firebase Auth, silakan hapus manual di Console.',
                    icon: 'success'
                })
            } catch (err) {
                Swal.fire('Gagal', err.message, 'error')
            }
        } else if (confirmName !== undefined) {
            Swal.fire('Gagal', 'Nama yang dimasukkan tidak cocok.', 'error')
        }
    }
}

const getAvatarColor = (name) => {
    if (!name) return 'bg-slate-400'
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500']
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Belum pernah'
    
    // Firestore timestamp object handling
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // seconds

    if (diff < 60) return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

onMounted(() => {
    adminStore.initialize()
})
</script>

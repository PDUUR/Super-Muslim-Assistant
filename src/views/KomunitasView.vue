<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Tab switcher (only when NOT in active community) -->
    <div v-if="!activeCommunity" class="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-2xl p-1 mb-5">
      <button @click="mainTab = 'komunitas'" 
              class="flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              :class="mainTab === 'komunitas' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-slate-400'">
        💬 Komunitas
      </button>
      <button @click="mainTab = 'leaderboard'" 
              class="flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              :class="mainTab === 'leaderboard' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-slate-400'">
        🏆 Leaderboard
      </button>
    </div>

    <!-- LEADERBOARD TAB CONTENT -->
    <template v-if="!activeCommunity && mainTab === 'leaderboard'">
      <!-- Global Leaderboard -->
      <div class="glass rounded-[2rem] p-5 border border-white/10">
        <h2 class="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          🏆 Papan Peringkat Global
        </h2>

        <div v-if="communityStore.isLoading" class="space-y-3 animate-pulse">
          <div v-for="i in 5" :key="i" class="h-14 bg-slate-100 dark:bg-white/5 rounded-2xl"></div>
        </div>

        <div v-else-if="communityStore.leaderboard.length === 0" class="text-center py-10">
          <div class="w-16 h-16 mx-auto bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-3">
            <span class="text-2xl">🏅</span>
          </div>
          <h3 class="text-sm font-black text-slate-600 dark:text-gray-300 mb-1">Belum ada data peringkat</h3>
          <p class="text-[10px] text-slate-400 max-w-[200px] mx-auto">
            Mulailah mencatat ibadah untuk muncul di leaderboard!
          </p>
        </div>

        <div v-else class="space-y-2">
          <div v-for="(user, index) in communityStore.leaderboard" :key="user.id"
               class="flex items-center gap-3 p-3 rounded-2xl transition-all"
               :class="index < 3 ? podiumClass(index) : 'hover:bg-slate-50 dark:hover:bg-white/5'">
            
            <!-- Rank Badge -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
                 :class="rankClass(index)">
              <span v-if="index < 3">{{ ['🥇', '🥈', '🥉'][index] }}</span>
              <span v-else class="text-slate-400 text-xs">#{{ index + 1 }}</span>
            </div>

            <!-- Avatar -->
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                 :class="getAvatarColor(user.display_name || user.username)">
              {{ (user.display_name || user.username)?.charAt(0)?.toUpperCase() || '?' }}
            </div>

            <!-- Info -->
            <div class="flex-grow min-w-0">
              <p class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ user.display_name || user.username }}
              </p>
              <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg"
                    :style="{ background: getLevelColor(user.level) + '15', color: getLevelColor(user.level) }">
                Lv.{{ user.level || 1 }}
              </span>
            </div>

            <!-- XP -->
            <div class="text-right shrink-0">
              <p class="text-sm font-black" :class="index < 3 ? 'text-green-600' : 'text-slate-600 dark:text-gray-300'">
                {{ formatXp(user.total_points) }}
              </p>
              <p class="text-[7px] text-slate-400 uppercase tracking-widest font-bold">XP</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- KOMUNITAS TAB CONTENT (Community List) -->
    <template v-if="!activeCommunity && mainTab === 'komunitas'">
      <!-- Hero Discovery -->
      <div class="mb-6 p-8 glass rounded-[3rem] text-center relative overflow-hidden bg-gradient-to-br from-green-600/10 to-emerald-600/5 border border-white/20">
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -left-10 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ummat Connect</h1>
          <p class="text-slate-500 dark:text-gray-400 text-xs italic mb-5 leading-relaxed">Bergabunglah dengan ribuan muslim lainnya dalam perjalanan hijrah bersama</p>
          
          <div class="flex flex-wrap justify-center gap-3">
              <div class="flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <i class="fas fa-users text-green-600 text-xs"></i>
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-gray-300">{{ communityStore.communities.length }} Komunitas</span>
              </div>
          </div>
      </div>

      <!-- Search & Create -->
      <div class="flex gap-2 mb-8 px-1">
        <div class="relative flex-grow">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input v-model="searchQuery" placeholder="Cari komunitas..." 
                 class="w-full pl-11 pr-4 py-3.5 glass rounded-2xl border border-slate-100 dark:border-white/5 text-xs outline-none focus:ring-2 focus:ring-green-500/20 transition-all">
        </div>
        <button @click="showCreateModal = true" class="w-12 h-12 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-500/20 active:scale-90 transition-all flex items-center justify-center">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <!-- Community Grid -->
      <div v-if="communityStore.isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-48 bg-slate-100 dark:bg-white/5 rounded-[2rem]"></div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="community in filteredCommunities" :key="community.id" 
             class="group glass rounded-[2.5rem] p-5 border border-white/20 hover:border-green-500/50 transition-all cursor-pointer relative overflow-hidden active:scale-95"
             @click="selectCommunity(community)">
          
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
              {{ community.name?.charAt(0) || '?' }}
            </div>
            <div class="flex-grow min-w-0">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                  {{ community.name }}
                </h3>
              </div>
              <p class="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">{{ community.description || 'Belum ada deskripsi.' }}</p>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                    <i class="fas fa-users mr-1"></i> {{ community.member_count || 0 }}
                  </span>
                </div>
                
                <div class="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <i class="fas fa-chevron-right text-[8px]"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!communityStore.isLoading && filteredCommunities.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-300">
          <i class="fas fa-search text-2xl"></i>
        </div>
        <h3 class="font-black text-slate-700 dark:text-slate-300">Tidak ada komunitas</h3>
        <p class="text-xs text-slate-400 mt-1">Coba cari dengan kata kunci lain atau buat baru!</p>
      </div>
    </template>

    <!-- View 2: Detailed Chat -->
    <template v-if="activeCommunity">
      <div class="flex flex-col h-[calc(100vh-180px)]">
        <!-- Chat Header -->
        <div class="flex items-center gap-4 mb-4 glass rounded-3xl p-4 sticky top-0 z-20 shadow-sm border border-white/20">
          <button @click="leaveCommunityView" class="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-500 transition-all">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black cursor-pointer hover:scale-105 transition-transform">
            {{ activeCommunity?.name?.charAt(0) || '?' }}
          </div>
          <div class="flex-grow cursor-pointer" @click="showMembers = true">
            <h3 class="font-black text-sm text-slate-900 dark:text-white leading-none mb-1 flex items-center gap-1">
              {{ activeCommunity?.name || 'Komunitas' }}
            </h3>
            <p class="text-[9px] text-green-600 font-bold uppercase tracking-widest">{{ activeCommunity.member_count || 1 }} Members</p>
          </div>
          <!-- Admin/Creator Tools -->
          <div class="flex gap-2">
            <!-- Delete Community -->
            <button v-if="authStore.isAdmin || activeCommunity.created_by === authStore.userId"
                    @click="handleDeleteCommunity" 
                    class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center text-xs"
                    title="Hapus Komunitas">
              <i class="fas fa-trash-alt"></i>
            </button>
            <button v-if="authStore.isAdmin" @click="communityStore.clearAllMessages(activeCommunity.id)" 
                    class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center text-xs"
                    title="Hapus Semua Pesan">
              <i class="fas fa-trash-sweep"></i> ALL
            </button>
          </div>
        </div>

        <!-- Chat Feed -->
        <div class="flex-grow overflow-y-auto space-y-4 px-2 py-4 scrollbar-hide" ref="chatFeed">
          <!-- Empty State -->
          <div v-if="communityStore.messages.length === 0" class="flex flex-col items-center justify-center h-full text-center py-12">
            <div class="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-comments text-green-500 text-2xl"></i>
            </div>
            <h3 class="font-black text-slate-700 dark:text-gray-300 mb-1">Belum Ada Pesan</h3>
            <p class="text-[10px] text-slate-400 dark:text-gray-500 max-w-[200px]">Jadilah yang pertama mengirim salam di komunitas ini!</p>
          </div>

          <div v-for="msg in communityStore.messages" :key="msg.id" 
               class="flex gap-3"
               :class="{ 'flex-row-reverse': msg.sender_id === authStore.user?.uid }">
            
            <div v-if="msg.sender_id !== authStore.user?.uid" 
                 class="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0"
                 :class="getAvatarColor(msg.sender_name)">
              {{ msg.sender_name?.charAt(0) || '?' }}
            </div>

            <div class="max-w-[75%]">
              <div v-if="msg.sender_id !== authStore.user?.uid" class="flex items-center gap-2 mb-1 ml-1">
                <span class="text-[9px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter">{{ msg.sender_name }}</span>
                <span class="text-[8px] text-slate-400">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="p-4 rounded-3xl text-sm relative group/msg"
                   :class="msg.sender_id === authStore.user?.uid 
                            ? 'bg-green-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-white/5 text-slate-800 dark:text-white border border-slate-100 dark:border-white/5 shadow-sm rounded-tl-none'">
                {{ msg.content }}
                
                <!-- Admin Single Delete -->
                <button v-if="authStore.isAdmin" 
                        @click="communityStore.deleteMessage(activeCommunity.id, msg.id)"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center justify-center text-[10px]">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div v-if="msg.sender_id === authStore.user?.uid" class="text-right mt-1">
                <span class="text-[8px] text-slate-400">{{ formatTime(msg.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="mt-4 glass rounded-[2.5rem] p-2 flex gap-2 border border-white/20 shadow-lg shadow-green-500/5">
          <input v-model="newMessage" 
                 @keyup.enter="handleEnter"
                 placeholder="Tulis pesan..." 
                 class="flex-grow bg-transparent border-none px-6 py-3 text-sm outline-none text-slate-800 dark:text-white">
          <button @click="onSendMessage" 
                  :disabled="!newMessage.trim()"
                  class="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50 shadow-lg shadow-green-500/20">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </template>

    <!-- Create Community Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" @click="showCreateModal = false"></div>
      <div class="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[3rem] p-8 animate-zoom-in">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Buat Komunitas</h2>
        <p class="text-xs text-slate-500 mb-6">Mulai pergerakan kebaikanmu hari ini.</p>
        
        <div class="space-y-4">
          <input v-model="createForm.name" placeholder="Nama Komunitas" class="w-full px-5 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20">
          <textarea v-model="createForm.description" placeholder="Deskripsi Singkat" class="w-full px-5 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 min-h-[100px]"></textarea>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showCreateModal = false" class="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Batal</button>
          <button @click="onCreateCommunity" class="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-600/20">Buat Sekarang</button>
        </div>
      </div>
    </div>

    <!-- Community Members Modal -->
    <div v-if="showMembers" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" @click="showMembers = false"></div>
      <div class="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[3rem] p-8 animate-zoom-in max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Anggota Grup</h2>
            <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest">{{ activeCommunity?.name }}</p>
          </div>
          <button @click="showMembers = false" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          <div v-if="communityStore.isLoading" class="flex justify-center py-10">
            <i class="fas fa-circle-notch animate-spin text-green-600 text-2xl"></i>
          </div>
          <div v-else-if="communityStore.communityMembers.length === 0" class="text-center py-10 text-slate-400 italic text-xs">
            Belum ada anggota lain.
          </div>
          <div v-for="member in communityStore.communityMembers" :key="member.id" 
               class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
                 :class="getAvatarColor(member.display_name || member.username)">
              {{ (member.display_name || member.username)?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="flex-grow min-w-0">
              <p class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ member.display_name || member.username }}
                <span v-if="member.id === activeCommunity.created_by" class="ml-1 text-[8px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md uppercase font-black">Admin</span>
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[8px] font-black uppercase text-green-600 bg-green-500/5 px-1.5 py-0.5 rounded-md">Lv.{{ member.level || 1 }}</span>
                <span class="text-[8px] font-black uppercase text-slate-400">Total {{ member.total_points || 0 }} XP</span>
              </div>
            </div>
            <div v-if="member.isOnline" class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
          </div>
        </div>

        <div class="mt-8">
           <button @click="showMembers = false" class="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';

const authStore = useAuthStore();
const communityStore = useCommunityStore();
const mainTab = ref('komunitas');
const searchQuery = ref('');
const activeCommunity = ref(null); // Local UI state
const newMessage = ref('');
const chatFeed = ref(null);
const showMembers = ref(false);

const showCreateModal = ref(false);
const createForm = ref({
  name: '',
  description: '',
});

const filteredCommunities = computed(() => {
  if (!searchQuery.value) return communityStore.communities;
  return communityStore.communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Watch messages scroll
watch(() => communityStore.messages, () => {
    scrollToBottom();
}, { deep: true });

const handleDeleteCommunity = async () => {
    if (!activeCommunity.value) return;
    try {
        const success = await communityStore.deleteCommunity(activeCommunity.value.id);
        if (success) {
            leaveCommunityView();
        }
    } catch (err) {
        alert('Gagal menghapus komunitas: ' + err.message);
    }
};

const selectCommunity = (community) => {
    activeCommunity.value = community;
    communityStore.subscribeChat(community.id);
    communityStore.fetchCommunityMembers(community.member_ids);
};

const leaveCommunityView = () => {
    activeCommunity.value = null;
    showMembers.value = false;
    // Optional: Unsubscribe chat or clear messages
};

const onSendMessage = async () => {
    if (!newMessage.value.trim() || !activeCommunity.value) return;
    try {
        await communityStore.sendMessage(newMessage.value, activeCommunity.value.id);
        newMessage.value = '';
    } catch (err) {
        alert('Gagal mengirim pesan: ' + err.message);
    }
};

const onCreateCommunity = async () => {
    if (!createForm.value.name.trim()) return;
    try {
        await communityStore.requestCreateCommunity(createForm.value.name, createForm.value.description);
        showCreateModal.value = false;
        createForm.value = { name: '', description: '' };
        alert('Permintaan pembuatan komunitas dikirim! Menunggu persetujuan Admin.');
    } catch (err) {
        console.error('Failed to request community', err);
        alert(err.message || 'Gagal mengirim permintaan');
    }
};

const handleEnter = (e) => {
    if (e.shiftKey) return;
    onSendMessage();
};

const scrollToBottom = () => {
    nextTick(() => {
        if (chatFeed.value) {
            chatFeed.value.scrollTop = chatFeed.value.scrollHeight;
        }
    });
};

const formatTime = (iso) => {
    if (!iso) return '';
    try {
        const date = new Date(iso);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '' }
};

const getAvatarColor = (name) => {
    if (!name) return 'bg-slate-400';
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getLevelColor = (level) => {
    const colors = {
        1: '#94a3b8', 2: '#10b981', 3: '#059669', 4: '#047857',
        5: '#0d9488', 6: '#0891b2', 7: '#0284c7', 8: '#2563eb',
        9: '#4f46e5', 10: '#7c3aed', 11: '#9333ea', 12: '#c026d3',
    };
    return colors[level] || '#10b981';
};

const rankClass = (index) => {
    if (index === 0) return 'bg-yellow-100 dark:bg-yellow-500/10';
    if (index === 1) return 'bg-slate-100 dark:bg-white/5';
    if (index === 2) return 'bg-orange-50 dark:bg-orange-500/10';
    return 'bg-transparent';
};

const podiumClass = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-500/5 dark:to-transparent border border-yellow-100 dark:border-yellow-500/10';
    if (index === 1) return 'bg-gradient-to-r from-slate-50 to-transparent dark:from-white/3 dark:to-transparent border border-slate-100 dark:border-white/5';
    if (index === 2) return 'bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-500/5 dark:to-transparent border border-orange-100 dark:border-orange-500/10';
    return '';
};

const formatXp = (xp) => {
    if (!xp) return '0';
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp.toLocaleString();
};

onMounted(() => {
    communityStore.initialize();
});
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.dark .glass {
  background: rgba(15, 23, 42, 0.6);
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-zoom-in {
  animation: zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>

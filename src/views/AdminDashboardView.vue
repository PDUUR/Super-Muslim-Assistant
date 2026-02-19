<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Admin Dashboard</h1>
        <p class="admin-subtitle">Super Muslim Assistant · Synchronized Control Panel</p>
      </div>
      <div class="admin-header-actions">
        <span class="admin-realtime-badge" :class="{ active: isRealtimeActive }">
          <span class="realtime-dot"></span>
          Realtime
        </span>
        <button class="admin-btn admin-btn--secondary" @click="refreshData">
          🔄 Refresh
        </button>
        <button class="admin-btn admin-btn--danger" @click="authStore.logout()">
          🚪 Logout
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div
        v-for="card in adminStore.statsCards"
        :key="card.label"
        class="stat-card"
        :style="{ '--card-color': card.color }"
      >
        <div class="stat-card-icon">{{ card.icon }}</div>
        <div class="stat-card-info">
          <span class="stat-card-value">{{ card.value }}</span>
          <span class="stat-card-label">{{ card.label }}</span>
        </div>
      </div>
    </div>

    <!-- User Management Table -->
    <div class="admin-section">
      <div class="section-header">
        <h2 class="section-title">👥 Manajemen Pengguna</h2>
        <span class="section-count">{{ adminStore.users.length }} users</span>
      </div>

      <!-- Search & Filter -->
      <div class="table-toolbar">
        <input
          v-model="searchUser"
          type="text"
          placeholder="Cari username atau email..."
          class="table-search"
        />
        <select v-model="filterRole" class="table-filter">
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Kota</th>
              <th>Poin</th>
              <th>Level</th>
              <th>Streak</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="table-row"
            >
              <td>
                <div class="user-cell">
                  <img
                    :src="user.avatar_url || defaultAvatar(user.username)"
                    :alt="user.display_name"
                    class="user-cell-avatar"
                  />
                  <div>
                    <span class="user-cell-name">{{ user.display_name || user.username }}</span>
                    <span class="user-cell-username">@{{ user.username }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="`role-badge--${user.role}`">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span class="city-tag">{{ user.city_name || '-' }}</span>
              </td>
              <td>
                <span class="points-cell">{{ user.total_points?.toLocaleString('id-ID') || '0' }}</span>
              </td>
              <td>
                <span class="level-cell">Lv. {{ user.level || 1 }}</span>
              </td>
              <td>
                <span class="streak-cell">🔥 {{ user.current_streak || 0 }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button
                    class="action-btn action-btn--edit"
                    title="Edit Poin"
                    @click="openEditXp(user)"
                  >
                    ✏️
                  </button>
                  <button
                    class="action-btn action-btn--role"
                    title="Ubah Role"
                    @click="openChangeRole(user)"
                  >
                    🛡️
                  </button>
                  <button
                    class="action-btn action-btn--edit"
                    style="background: rgba(16, 185, 129, 0.15);"
                    title="Undang ke Grup"
                    @click="openInviteModal(user)"
                  >
                    📩
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Invite Modal -->
        <teleport to="body">
          <transition name="modal">
            <div v-if="inviteModal.show" class="modal-overlay" @click.self="inviteModal.show = false">
              <div class="modal-box">
                <h3 class="modal-title">📩 Undang ke Komunitas</h3>
                <p class="modal-subtitle">Pilih komunitas untuk {{ inviteModal.user?.display_name }}</p>
                
                <div class="modal-form">
                  <label>Pilih Komunitas:</label>
                  <select v-model="inviteModal.selectedCommunity" class="modal-input">
                    <option v-for="c in communityStore.communities" :key="c.id" :value="c.id">
                      {{ c.name }} {{ c.is_private ? '(🔒 Backroom)' : '' }}
                    </option>
                  </select>
                </div>

                <div class="modal-actions">
                  <button class="modal-btn modal-btn--cancel" @click="inviteModal.show = false">Batal</button>
                  <button class="modal-btn modal-btn--confirm" @click="submitInvite" :disabled="!inviteModal.selectedCommunity">
                    Kirim Undangan
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </teleport>

        <div v-if="filteredUsers.length === 0" class="table-empty">
          <span>Tidak ada user yang cocok dengan filter.</span>
        </div>
      </div>
    </div>

    <!-- Community Requests -->
    <div class="admin-section" style="margin-top: 32px;">
      <div class="section-header">
        <h2 class="section-title">📢 Permintaan Komunitas</h2>
        <div class="flex gap-3 items-center">
          <span class="section-count">{{ adminStore.communityRequests.filter(r => r.status === 'pending').length }} pending</span>
          <button @click="openDirectCreate" 
                  class="action-btn" 
                  style="background: #10b981; color: white; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: bold; border: none; cursor: pointer;">
            + Buat Langsung
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pemohon</th>
              <th>Nama Komunitas</th>
              <th>Deskripsi</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in adminStore.communityRequests" :key="req.id">
              <td>
                <span class="user-cell-name">{{ req.requester_name }}</span>
                <span class="user-cell-username">ID: {{ req.requester_id }}</span>
              </td>
              <td><strong>{{ req.name }}</strong></td>
              <td><p class="city-tag" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ req.description }}</p></td>
              <td>
                <span class="role-badge" :class="{ 
                  'role-badge--moderator': req.status === 'pending',
                  'role-badge--admin': req.status === 'approved',
                  'role-badge--user': req.status === 'rejected'
                }">{{ req.status }}</span>
              </td>
              <td>
                <div v-if="req.status === 'pending'" class="action-btns flex gap-2">
                  <button class="action-btn action-btn--edit" title="Setujui (Public)" @click="adminStore.approveRequest(req, false)">
                    ✅ Public
                  </button>
                  <button class="action-btn" 
                          style="background: rgba(99, 102, 241, 0.15); color: #6366f1; border-radius: 8px; padding: 4px 8px; font-size: 10px; font-weight: bold; border: 1px solid rgba(99, 102, 241, 0.3);"
                          title="Setujui (Backroom)" @click="adminStore.approveRequest(req, true)">
                    🔒 Backroom
                  </button>
                  <button class="action-btn action-btn--role" title="Tolak" @click="adminStore.rejectRequest(req.id)">
                    ❌
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="adminStore.communityRequests.length === 0" class="table-empty">
          Tidak ada permintaan pembuatan komunitas.
        </div>
      </div>
    </div>

    <!-- Direct Create Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="directCreateModal.show" class="modal-overlay" @click.self="directCreateModal.show = false">
          <div class="modal-box">
            <h3 class="modal-title">🆕 Buat Komunitas Baru</h3>
            <p class="modal-subtitle">Admin dapat membuat komunitas secara langsung.</p>
            
            <div class="modal-form">
              <label>Nama Komunitas:</label>
              <input v-model="directCreateModal.name" type="text" class="modal-input" placeholder="Misal: Al-Kahfi Circle">
              
              <label>Deskripsi:</label>
              <textarea v-model="directCreateModal.description" class="modal-input" style="height: 80px;" placeholder="Tujuan grup ini..."></textarea>
              
              <label>Jenis Komunitas:</label>
              <div class="flex gap-4 mt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :value="false" v-model="directCreateModal.isBackroom">
                  <span>Public</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :value="true" v-model="directCreateModal.isBackroom">
                  <span>Backroom (🔒 Private)</span>
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button class="modal-btn modal-btn--cancel" @click="directCreateModal.show = false">Batal</button>
              <button class="modal-btn modal-btn--confirm" @click="submitDirectCreate" :disabled="!directCreateModal.name"
                      style="background: #10b981;">
                Simpan & Aktifkan
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Edit XP Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="editXpModal.show" class="modal-overlay" @click.self="editXpModal.show = false">
          <div class="modal-box">
            <h3 class="modal-title">✏️ Edit Poin User</h3>
            <p class="modal-subtitle">
              {{ editXpModal.user?.display_name }} (@{{ editXpModal.user?.username }})
            </p>
            <p class="modal-info">
              Poin saat ini: <strong>{{ editXpModal.user?.total_points?.toLocaleString('id-ID') }}</strong>
            </p>

            <div class="modal-form">
              <label>Poin yang ditambahkan/dikurangi:</label>
              <input
                v-model.number="editXpModal.points"
                type="number"
                placeholder="Contoh: 50 atau -20"
                class="modal-input"
              />
              <label>Alasan:</label>
              <input
                v-model="editXpModal.reason"
                type="text"
                placeholder="Contoh: Bonus event Ramadhan"
                class="modal-input"
              />
            </div>

            <div class="modal-actions">
              <button class="modal-btn modal-btn--cancel" @click="editXpModal.show = false">
                Batal
              </button>
              <button
                class="modal-btn modal-btn--confirm"
                :disabled="!editXpModal.points || !editXpModal.reason"
                @click="submitEditXp"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Change Role Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="roleModal.show" class="modal-overlay" @click.self="roleModal.show = false">
          <div class="modal-box">
            <h3 class="modal-title">🛡️ Ubah Role User</h3>
            <p class="modal-subtitle">
              {{ roleModal.user?.display_name }} (@{{ roleModal.user?.username }})
            </p>

            <div class="modal-form">
              <label>Role Baru:</label>
              <select v-model="roleModal.newRole" class="modal-input">
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="modal-actions">
              <button class="modal-btn modal-btn--cancel" @click="roleModal.show = false">
                Batal
              </button>
              <button
                class="modal-btn modal-btn--confirm"
                @click="submitChangeRole"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Loading / Error Overlay -->
    <div v-if="adminStore.isLoading || adminStore.error" class="admin-loading">
      <template v-if="adminStore.error">
        <span style="color: #ef4444; font-size: 24px;">⚠️</span>
        <span style="color: #ef4444; font-weight: 700; font-size: 14px;">{{ adminStore.error }}</span>
        <button class="admin-btn admin-btn--secondary" @click="adminStore.error = null; refreshData()" style="margin-top: 8px;">
          🔄 Coba Lagi
        </button>
      </template>
      <template v-else>
        <div class="admin-spinner"></div>
        Memuat data...
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const communityStore = useCommunityStore()

const searchUser = ref('')
const filterRole = ref('')
const isRealtimeActive = ref(true)

// Invite Modal
const inviteModal = ref({
  show: false,
  user: null,
  selectedCommunity: ''
})

// Edit XP Modal
const editXpModal = ref({
  show: false,
  user: null,
  points: null,
  reason: '',
})

// Change Role Modal
const roleModal = ref({
  show: false,
  user: null,
  newRole: 'user',
})

// Direct Create Modal
const directCreateModal = ref({
  show: false,
  name: '',
  description: '',
  isBackroom: false
})

const openDirectCreate = () => {
  directCreateModal.value = {
    show: true,
    name: '',
    description: '',
    isBackroom: false
  }
}

const submitDirectCreate = async () => {
  if (!directCreateModal.value.name) return
  try {
    await communityStore.createCommunity(
      directCreateModal.value.name, 
      directCreateModal.value.description, 
      false, 
      directCreateModal.value.isBackroom
    )
    directCreateModal.value.show = false
    alert('Komunitas berhasil dibuat!')
  } catch (err) {
    alert('Gagal membuat: ' + err.message)
  }
}

const openInviteModal = (user) => {
  inviteModal.value = {
    show: true,
    user: user,
    selectedCommunity: ''
  }
}

const submitInvite = async () => {
  try {
    await communityStore.inviteUser(inviteModal.value.selectedCommunity, inviteModal.value.user.id)
    inviteModal.value.show = false
  } catch (err) {
    alert('Gagal mengundang: ' + err.message)
  }
}

// Computed: Filtered Users
const filteredUsers = computed(() => {
  let result = adminStore.users
  if (searchUser.value) {
    const q = searchUser.value.toLowerCase()
    result = result.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q)
    )
  }
  if (filterRole.value) {
    result = result.filter(u => u.role === filterRole.value)
  }
  return result
})

const defaultAvatar = (seed) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed || 'default'}&backgroundColor=6366f1`

const openEditXp = (user) => {
  editXpModal.value = {
    show: true,
    user,
    points: null,
    reason: '',
  }
}

const openChangeRole = (user) => {
  roleModal.value = {
    show: true,
    user,
    newRole: user.role,
  }
}

const submitEditXp = async () => {
  try {
    await adminStore.editUserPoints(
      editXpModal.value.user.id,
      editXpModal.value.points,
      editXpModal.value.reason
    )
    editXpModal.value.show = false
  } catch (err) {
    alert('Gagal: ' + err.message)
  }
}

const submitChangeRole = async () => {
  try {
    await adminStore.updateUserRole(
      roleModal.value.user.id,
      roleModal.value.newRole
    )
    roleModal.value.show = false
  } catch (err) {
    alert('Gagal: ' + err.message)
  }
}

const refreshData = () => {
  adminStore.fetchStats()
}

onMounted(() => {
  adminStore.initialize()
})

onUnmounted(() => {
  adminStore.cleanup()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
  padding: 24px;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.admin-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.admin-subtitle {
  color: rgba(255,255,255,0.4);
  font-size: 13px;
  margin: 4px 0 0;
}

.admin-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-realtime-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
}

.admin-realtime-badge.active {
  color: #10b981;
  border-color: rgba(16,185,129,0.3);
}

.realtime-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.admin-btn {
  padding: 8px 16px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-btn--secondary {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.admin-btn--secondary:hover {
  background: rgba(255,255,255,0.15);
}

.admin-btn--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.admin-btn--danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--card-color);
  border-radius: 4px 0 0 4px;
}

.stat-card:hover {
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-2px);
}

.stat-card-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.stat-card-value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
}

.stat-card-label {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Section */
.admin-section {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.section-count {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.06);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Table Toolbar */
.table-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-search {
  flex: 1;
  min-width: 200px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  outline: none;
}

.table-search::placeholder { color: rgba(255,255,255,0.3); }
.table-search:focus { border-color: rgba(99,102,241,0.4); }

.table-filter {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  outline: none;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.admin-table td {
  padding: 12px 16px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.table-row {
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(255,255,255,0.03);
}

/* User Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-cell-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-cell-name {
  display: block;
  font-weight: 600;
  color: #fff;
}

.user-cell-username {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

/* Badges */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.role-badge--admin {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.role-badge--moderator {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.role-badge--user {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.city-tag {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.points-cell {
  font-weight: 700;
  color: #f59e0b;
}

.level-cell {
  font-weight: 600;
  color: #6366f1;
}

.streak-cell {
  font-size: 13px;
}

/* Action Buttons */
.action-btns {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn--edit {
  background: rgba(99, 102, 241, 0.15);
}

.action-btn--edit:hover {
  background: rgba(99, 102, 241, 0.3);
}

.action-btn--role {
  background: rgba(245, 158, 11, 0.15);
}

.action-btn--role:hover {
  background: rgba(245, 158, 11, 0.3);
}

.table-empty {
  text-align: center;
  padding: 40px;
  color: rgba(255,255,255,0.3);
  font-size: 13px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: #1e1e3f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  margin: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
}

.modal-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 8px;
}

.modal-info {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 16px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.modal-form label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.modal-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
}

.modal-input:focus {
  border-color: rgba(99,102,241,0.5);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn--cancel {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.modal-btn--confirm {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

.modal-btn--confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Loading */
.admin-loading {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 12px 20px;
  border-radius: 16px;
  font-size: 13px;
  z-index: 9999;
}

.admin-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Transitions */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-box, .modal-leave-to .modal-box {
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard { padding: 16px; }
  .admin-header { flex-direction: column; }
  .admin-title { font-size: 22px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-card-value { font-size: 20px; }
  .table-toolbar { flex-direction: column; }
}
</style>

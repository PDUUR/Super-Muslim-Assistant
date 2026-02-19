<template>
  <div class="leaderboard-widget">
    <!-- Header -->
    <div class="lb-header">
      <h3 class="lb-title">
        <span class="lb-icon">🏆</span>
        Leaderboard Global
      </h3>
      <span class="lb-badge">Realtime</span>
    </div>

    <!-- My Rank -->
    <div v-if="communityStore.myStats" class="my-rank-card">
      <div class="my-rank-left">
        <img 
          :src="communityStore.myStats.avatar_url || defaultAvatar" 
          :alt="communityStore.myStats.display_name"
          class="my-rank-avatar"
        />
        <div class="my-rank-info">
          <span class="my-rank-name">{{ communityStore.myStats.display_name || 'Kamu' }}</span>
          <span class="my-rank-level">Level {{ communityStore.myLevel }}</span>
        </div>
      </div>
      <div class="my-rank-right">
        <span class="my-rank-xp">{{ formatNumber(communityStore.myXp) }}</span>
        <span class="my-rank-label">Poin</span>
      </div>
    </div>

    <!-- Top 10 List -->
    <div class="lb-list">
      <transition-group name="lb-item">
        <div
          v-for="(user, index) in communityStore.top10"
          :key="user.id"
          class="lb-item"
          :class="{ 'lb-item--me': user.id === authStore.userId }"
        >
          <!-- Rank Badge -->
          <div class="lb-rank" :class="`lb-rank--${index + 1}`">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- User Info -->
          <img 
            :src="user.avatar_url || defaultAvatar" 
            :alt="user.display_name"
            class="lb-avatar"
          />
          <div class="lb-user-info">
            <span class="lb-username">{{ user.display_name || user.username }}</span>
            <span class="lb-meta">
              Lv.{{ user.level }} · {{ user.city_name || 'Belum set kota' }}
            </span>
          </div>

          <!-- Points -->
          <div class="lb-points">
            <span class="lb-points-value">{{ formatNumber(user.total_points) }}</span>
            <span class="lb-points-label">pts</span>
          </div>
        </div>
      </transition-group>

      <div v-if="communityStore.top10.length === 0" class="lb-empty">
        <span>Belum ada data leaderboard</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'

const communityStore = useCommunityStore()
const authStore = useAuthStore()

const defaultAvatar = 'https://api.dicebear.com/7.x/thumbs/svg?seed=default&backgroundColor=6366f1'

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('id-ID')
}

onMounted(() => {
  communityStore.fetchLeaderboard()
})
</script>

<style scoped>
.leaderboard-widget {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

.lb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.lb-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.lb-icon { font-size: 20px; }

.lb-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

.my-rank-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.my-rank-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.my-rank-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.5);
}

.my-rank-info {
  display: flex;
  flex-direction: column;
}

.my-rank-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.my-rank-level {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.my-rank-right {
  text-align: right;
}

.my-rank-xp {
  display: block;
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.my-rank-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.lb-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lb-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.lb-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.lb-item--me {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.lb-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.lb-rank--1, .lb-rank--2, .lb-rank--3 {
  font-size: 20px;
}

.lb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.lb-user-info {
  flex: 1;
  min-width: 0;
}

.lb-username {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lb-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.lb-points {
  text-align: right;
  flex-shrink: 0;
}

.lb-points-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #f59e0b;
}

.lb-points-label {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
}

.lb-empty {
  text-align: center;
  padding: 32px 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* Transition animations */
.lb-item-move { transition: transform 0.5s ease; }
.lb-item-enter-active { transition: all 0.3s ease; }
.lb-item-leave-active { transition: all 0.3s ease; position: absolute; }
.lb-item-enter-from { opacity: 0; transform: translateX(-20px); }
.lb-item-leave-to { opacity: 0; transform: translateX(20px); }
</style>

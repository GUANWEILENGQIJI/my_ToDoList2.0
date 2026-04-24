<template>
	<view class="network-indicator">
		<view class="status-item">
			<view class="dot" :class="reachable ? 'online' : 'offline'"></view>
			<text class="label">{{ reachable ? '在线' : '离线' }}</text>
		</view>
		<view class="divider"></view>
		<view class="status-item">
			<view class="dot" :class="syncDotClass"></view>
			<text class="label">{{ syncLabel }}</text>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue';
import { getServerReachableRef } from '../../common/server-status.js';
import { getSyncStateRef } from '../../common/api.js';

const reachableRef = getServerReachableRef();
const syncStateRef = getSyncStateRef();
const reachable = computed(() => reachableRef.value);
const syncLabel = computed(() => {
	if (syncStateRef.value === 'syncing') return '同步中';
	return syncStateRef.value === 'synced' ? '已同步' : '未同步';
});
const syncDotClass = computed(() => {
	if (syncStateRef.value === 'syncing') return 'syncing';
	return syncStateRef.value === 'synced' ? 'synced' : 'unsynced';
});
</script>

<style scoped>
.network-indicator {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: #eef3f8;
	border: 1rpx solid #d9e2ec;
	flex-shrink: 0;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.divider {
	width: 1rpx;
	height: 20rpx;
	background: #cbd5e1;
}

.dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
}

.online {
	background: #34c759;
}

.offline {
	background: #ff3b30;
}

.synced {
	background: #34c759;
}

.unsynced {
	background: #f59e0b;
}

.syncing {
	background: #3b82f6;
}

.label {
	font-size: 22rpx;
	color: #334155;
	line-height: 1;
	white-space: nowrap;
}
</style>

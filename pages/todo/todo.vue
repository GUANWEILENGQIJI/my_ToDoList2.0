<template>
	<view class="container">
		<view class="header-bar">
			<view class="header-left">
				<text class="title">待办 ({{ list.length }})</text>
				<network-status />
			</view>
			<text class="nav-link" @click="goToCompleted">查看已完成 〉</text>
		</view>

		<view class="todo-list">
			<view v-if="!list || list.length === 0" class="empty-tip">📭 暂无任务，快去添加吧</view>

			<view v-for="(item, index) in list" :key="item.id" 
				class="todo-item" :class="{ 'urgent': index === 0 }"
				@click="goToEdit(item.id)">
				
				<view class="todo-main">
					<view class="todo-content">
						<text class="todo-title">{{ item.title }}</text>
						<text v-if="item.content" class="todo-desc">
							{{ formatContent(item.content) }}
						</text>
					</view>
					<view class="todo-check" @click.stop="finishTask(index)">✓</view>
				</view>
				
				<view class="todo-footer">
					<text class="ddl-text">{{ getDDL(item.timestamp) }}</text>
					<text class="time-stamp">{{ formatTime(item.timestamp) }}</text>
				</view>
			</view>
			<view style="height: 180rpx;"></view>
		</view>

		<button class="add-btn-fixed" @click="goToEdit('')">+</button>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import NetworkStatus from '../../components/network-status/network-status.vue';
import { getTodos, markTodoDoneLocal, syncPendingActions } from '../../common/api.js';

const list = ref([]);

const refreshLocalTodos = async () => {
	const res = await getTodos('todo');
	list.value = res.data.sort((a, b) => a.timestamp - b.timestamp);
};

const loadTodos = async () => {
	await refreshLocalTodos();
	const syncRes = await syncPendingActions();
	if (syncRes.code === 0) {
		await refreshLocalTodos();
		return;
	}
	uni.showToast({ title: '当前显示本地数据', icon: 'none' });
};

onShow(() => {
	loadTodos();
});

// 倒计时逻辑：天 小时 分钟 级联显示
const getDDL = (ts) => {
	const now = Date.now();
	const diff = ts - now;
	if (diff <= 0) return '⚠️ 已逾期';

	const days = Math.floor(diff / (24 * 3600 * 1000));
	const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
	const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));

	let res = '⏳ ';
	if (days > 0) return res + `${days}天${hours}小时${mins}分钟`;
	if (hours > 0) return res + `${hours}小时${mins}分钟`;
	return res + `${mins}分钟`;
};

// 备注显示第一行
const formatContent = (text) => {
	if (!text) return '';
	const firstLine = text.split('\n')[0];
	return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine + '...';
};

const finishTask = async (idx) => {
	const targetId = list.value[idx].id;
	const res = await markTodoDoneLocal(targetId);
	if (res.code === 0) {
		await refreshLocalTodos();
		uni.showToast({ title: '已移入完成列表', icon: 'none' });
		syncPendingActions();
		return;
	}
	uni.showToast({ title: res.message || '操作失败', icon: 'none' });
};

const formatTime = (ts) => {
	const d = new Date(ts);
	return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const goToEdit = (id) => uni.navigateTo({ url: `/pages/todo/edit?id=${id}` });
const goToCompleted = () => uni.navigateTo({ url: '/pages/todo/completed' });
</script>

<style scoped>
.container { padding: 30rpx; background: #f8f8f8; min-height: 100vh; }
.header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.header-left { display: flex; align-items: center; gap: 16rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.nav-link { font-size: 26rpx; color: #007AFF; }

.todo-item { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 25rpx; border-left: 12rpx solid #ddd; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.03); }
.urgent { border-left-color: #ff3b30; background: #fff9f9; }

.todo-main { display: flex; justify-content: space-between; }
.todo-content { flex: 1; overflow: hidden; }
.todo-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; margin-bottom: 8rpx; }
.todo-desc { font-size: 26rpx; color: #888; display: block; }

.todo-check { width: 56rpx; height: 56rpx; border: 4rpx solid #4cd964; border-radius: 50%; color: #4cd964; display: flex; justify-content: center; align-items: center; font-weight: bold; }

.todo-footer { margin-top: 20rpx; padding-top: 15rpx; border-top: 1rpx solid #eee; display: flex; justify-content: space-between; }
.ddl-text { font-size: 24rpx; color: #ff3b30; font-weight: bold; }
.time-stamp { font-size: 22rpx; color: #bbb; }

.add-btn-fixed { position: fixed; bottom: 80rpx; right: 50rpx; width: 120rpx; height: 120rpx; background: #007AFF; color: #fff; border-radius: 60rpx; font-size: 80rpx; display: flex; justify-content: center; align-items: center; z-index: 99; box-shadow: 0 10rpx 20rpx rgba(0,122,255,0.3); }
</style>

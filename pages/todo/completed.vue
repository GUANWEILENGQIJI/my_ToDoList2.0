<template>
	<view class="container">
		<view class="header-bar">
			<view class="header-left">
				<text class="page-title">已完成</text>
				<network-status />
			</view>
		</view>
		<view class="list">
			<view v-if="doneList.length === 0" class="empty">还没有完成的任务</view>
			
			<view v-for="(item, index) in doneList" :key="item.id" class="done-item">
				<view class="info">
					<text class="title">{{ item.title }}</text>
					<text class="time">完成于: {{ formatTime(item.doneTime) }}</text>
				</view>
				<view class="actions">
					<text class="btn-revive" @click="reviveTask(index)">恢复</text>
					<text class="btn-del" @click="deletePermanent(index)">删除</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import NetworkStatus from '../../components/network-status/network-status.vue';
import { deleteTodoLocal, getTodos, markTodoTodoLocal, syncPendingActions } from '../../common/api.js';

const doneList = ref([]);

const refreshLocalTodos = async () => {
	const res = await getTodos('done');
	doneList.value = res.data.sort((a, b) => b.doneTime - a.doneTime);
};

const loadDoneTodos = async () => {
	await refreshLocalTodos();
	const syncRes = await syncPendingActions();
	if (syncRes.code === 0) {
		await refreshLocalTodos();
		return;
	}
	uni.showToast({ title: '当前显示本地数据', icon: 'none' });
};

onShow(() => {
	loadDoneTodos();
});

const reviveTask = async (idx) => {
	const targetId = doneList.value[idx].id;
	const res = await markTodoTodoLocal(targetId);
	if (res.code === 0) {
		await refreshLocalTodos();
		uni.showToast({ title: '已恢复至待办', icon: 'none' });
		syncPendingActions();
		return;
	}
	uni.showToast({ title: res.message || '恢复失败', icon: 'none' });
};

const deletePermanent = (idx) => {
	uni.showModal({
		title: '永久删除',
		content: '确定要彻底删除这条记录吗？',
		success: async (res) => {
			if (!res.confirm) return;
			const targetId = doneList.value[idx].id;
			const data = await deleteTodoLocal(targetId);
			if (data.code === 0) {
				await refreshLocalTodos();
				uni.showToast({ title: '删除成功', icon: 'none' });
				syncPendingActions();
				return;
			}
			uni.showToast({ title: data.message || '删除失败', icon: 'none' });
		}
	});
};

const formatTime = (ts) => {
	if(!ts) return '';
	const d = new Date(ts);
	return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
};
</script>

<style scoped>
.container { padding: 30rpx; background: #f8f8f8; min-height: 100vh; }
.header-bar { display: flex; align-items: center; margin-bottom: 24rpx; }
.header-left { display: flex; align-items: center; gap: 16rpx; }
.page-title { font-size: 36rpx; font-weight: bold; color: #333; }
.done-item { background: #fff; padding: 30rpx; border-radius: 12rpx; margin-bottom: 20rpx; display: flex; justify-content: space-between; align-items: center; opacity: 0.8; }
.title { font-size: 30rpx; color: #666; text-decoration: line-through; display: block; }
.time { font-size: 22rpx; color: #999; }
.actions { display: flex; gap: 20rpx; }
.btn-revive { color: #007AFF; font-size: 26rpx; border: 1rpx solid #007AFF; padding: 6rpx 16rpx; border-radius: 8rpx; }
.btn-del { color: #ff3b30; font-size: 26rpx; border: 1rpx solid #ff3b30; padding: 6rpx 16rpx; border-radius: 8rpx; }
.empty { text-align: center; color: #999; margin-top: 100rpx; }
</style>

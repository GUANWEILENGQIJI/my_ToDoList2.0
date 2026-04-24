<template>
	<view class="container">
		<view class="header-bar">
			<view class="header-left">
				<text class="title">我的中心</text>
				<network-status />
			</view>
		</view>
		<view class="menu-list">
			<view class="menu-item" v-for="item in menu" :key="item.path" @tap="goTo(item.path)">
				<text class="menu-name">{{ item.name }}</text>
				<text class="arrow">➔</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import NetworkStatus from '../../components/network-status/network-status.vue';

const menu = [
	{ name: '🔥 待办备忘录 (DDL堆排序)', path: '/pages/todo/todo' },
	{ name: '🌳 长期进阶目标 (碎米分摊)', path: '/pages/goals/goals' },
	{ name: '⚙️ 设置', path: '/pages/settings/index' }
];

const goTo = (url) => {
	uni.navigateTo({ url });
};
</script>

<style scoped>
.container { padding: 15px; }
.header-bar { margin-bottom: 20rpx; }
.header-left { display: flex; align-items: center; gap: 16rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.menu-item {
	background-color: #ffffff;
	padding: 20px;
	margin-bottom: 2px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-radius: 8rpx; /* uni-app 推荐使用 rpx 单位 */
}
.menu-name { font-size: 32rpx; color: #333; }
.arrow { color: #ccc; }
</style>

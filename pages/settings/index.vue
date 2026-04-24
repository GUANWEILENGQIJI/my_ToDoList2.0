<template>
	<view class="container">
		<view class="header-bar">
			<view class="header-left">
				<text class="title">设置</text>
				<network-status />
			</view>
		</view>

		<view class="section">
			<view class="section-title">通用</view>
			<view class="setting-item" @tap="checkUpdate">
				<view class="setting-main">
					<text class="setting-name">检查更新</text>
					<text class="setting-desc">当前版本 1.0.0</text>
				</view>
				<text class="arrow">〉</text>
			</view>
		</view>

		<view class="section hint-section">
			<text class="hint-text">后续可在这里继续添加新功能。</text>
		</view>
	</view>
</template>

<script setup>
import NetworkStatus from '../../components/network-status/network-status.vue';

const checkUpdate = () => {
	const app = getApp();
	if (app && typeof app.checkAppVersion === 'function') {
		app.checkAppVersion(true);
		return;
	}
	uni.showToast({ title: '暂时无法检查更新', icon: 'none' });
};
</script>

<style scoped>
.container {
	padding: 30rpx;
	background: #f8f8f8;
	min-height: 100vh;
}

.header-bar {
	margin-bottom: 24rpx;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.section {
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 24rpx;
	color: #94a3b8;
	margin-bottom: 12rpx;
	padding-left: 8rpx;
}

.setting-item {
	background: #ffffff;
	border-radius: 12rpx;
	padding: 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.setting-main {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.setting-name {
	font-size: 30rpx;
	color: #1e293b;
}

.setting-desc {
	font-size: 24rpx;
	color: #94a3b8;
}

.arrow {
	font-size: 28rpx;
	color: #cbd5e1;
}

.hint-section {
	padding: 8rpx;
}

.hint-text {
	font-size: 24rpx;
	color: #94a3b8;
}
</style>

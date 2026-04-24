<template>
	<view class="container">
		<view v-if="showBanner" class="header-banner" @tap="editBanner">
			<text class="quote">“ {{ bannerText }} ”</text>
			<text class="edit-tip">点击文字修改</text>
		</view>

		<view class="top-bar">
			<network-status />
			<view class="setting-btn" @tap="toggleBannerMode">{{ showBanner ? '🙈 隐藏' : '👁️ 显示' }}</view>
		</view>

		<view class="goal-list">
			<task-node 
				v-for="(goal, index) in goals" 
				:key="goal.id" :task="goal" :depth="0"
				@refresh="saveAndSync" 
				@addChild="prepareAddChild"
				@deleteChild="deleteMainGoal(index)"
				@stepChange="handleStepChange" 
			/>
		</view>

		<view class="fab-green" @tap="prepareAddMain">+</view>

		<view v-if="inputVisible" class="modal-mask" @touchmove.stop.prevent>
			<view class="modal-box">
				<view class="modal-title">{{ modalTitle }}</view>
				<input class="modal-input" v-model="inputText" :placeholder="modalPlaceholder" focus />
				<view v-if="modalMode === 'task'" class="config-section">
					<view class="config-row">
						<text class="label">开启持续打卡模式</text>
						<switch :checked="isStepMode" @change="isStepMode = $event.detail.value" color="#4cd964" />
					</view>
					<view v-if="isStepMode" class="config-row">
						<text class="label">目标天数/次数</text>
						<input type="number" v-model="totalStepInput" class="small-input" />
					</view>
				</view>
				<view class="modal-btns">
					<view class="m-btn cancel" @tap="inputVisible = false">取消</view>
					<view class="m-btn confirm" @tap="handleConfirm">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NetworkStatus from '../../components/network-status/network-status.vue';

const goals = ref([]);
const inputVisible = ref(false);
const inputText = ref('');
const showBanner = ref(true);
const bannerText = ref('不积跬步，无以至千里');
const isStepMode = ref(false);
const totalStepInput = ref('30');
const modalTitle = ref('');
const modalPlaceholder = ref('');
const modalMode = ref('task'); 
let targetParentTask = null;

onMounted(() => {
	const data = uni.getStorageSync('my_goals_vFinal_v4');
	if (data) goals.value = JSON.parse(data);
	const banner = uni.getStorageSync('my_banner_v4');
	if (banner) { const b = JSON.parse(banner); showBanner.value = b.show; bannerText.value = b.text; }
});

// 处理步进（打卡）的核心逻辑
const handleStepChange = (e) => {
	const { task, val } = e;
	let next = (task.currentStep || 0) + val;
	if (next < 0) next = 0;
	if (next > task.totalStep) next = task.totalStep;
	
	// 直接修改原始引用
	task.currentStep = next;
	
	// 强制触发全树刷新
	saveAndSync();
};

const prepareAddMain = () => {
	modalMode.value = 'task';
	targetParentTask = null;
	modalTitle.value = '设定新愿景';
	inputText.value = '';
	isStepMode.value = false;
	inputVisible.value = true;
};

const prepareAddChild = (parent) => {
	modalMode.value = 'task';
	targetParentTask = parent;
	modalTitle.value = '添加子任务';
	inputText.value = '';
	isStepMode.value = false;
	inputVisible.value = true;
};

const editBanner = () => {
	modalMode.value = 'banner';
	modalTitle.value = '修改座右铭';
	inputText.value = bannerText.value;
	inputVisible.value = true;
};

const handleConfirm = () => {
	const text = inputText.value.trim();
	if (!text) return;
	if (modalMode.value === 'banner') {
		bannerText.value = text;
		saveConfig();
	} else {
		const newNode = {
			id: Date.now(),
			title: text,
			done: false,
			children: [],
			isStepMode: isStepMode.value,
			totalStep: isStepMode.value ? (parseInt(totalStepInput.value) || 1) : 0,
			currentStep: 0,
			expanded: true
		};
		if (!targetParentTask) {
			goals.value.push(newNode);
		} else {
			if (!targetParentTask.children) targetParentTask.children = [];
			targetParentTask.children.push(newNode);
		}
		saveAndSync();
	}
	inputVisible.value = false;
};

const deleteMainGoal = (index) => {
	goals.value.splice(index, 1);
	saveAndSync();
};

const toggleBannerMode = () => {
	showBanner.value = !showBanner.value;
	saveConfig();
};

const saveConfig = () => {
	uni.setStorageSync('my_banner_v4', JSON.stringify({ show: showBanner.value, text: bannerText.value }));
};

const saveAndSync = () => {
	uni.setStorageSync('my_goals_vFinal_v4', JSON.stringify(goals.value));
	// 终极武器：重新赋值触发 Vue 的响应式刷新
	goals.value = JSON.parse(JSON.stringify(goals.value));
};
</script>

<style scoped>
/* 样式保持不变 */
.container { background-color: #fcfcfc; min-height: 100vh; padding-bottom: 160rpx; }
.header-banner { background: linear-gradient(135deg, #4cd964, #28a745); padding: 50rpx 40rpx; text-align: center; }
.quote { color: #ffffff; font-size: 28rpx; font-weight: bold; }
.edit-tip { display: block; color: rgba(255,255,255,0.7); font-size: 20rpx; margin-top: 10rpx; }
.top-bar { padding: 20rpx 35rpx; display: flex; justify-content: space-between; align-items: center; gap: 16rpx; }
.setting-btn { font-size: 24rpx; color: #007AFF; padding: 10rpx 25rpx; background: #eef6fe; border-radius: 40rpx; }
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-box { width: 85%; background: #fff; border-radius: 30rpx; padding: 45rpx; box-sizing: border-box; }
.modal-title { font-size: 32rpx; font-weight: bold; margin-bottom: 30rpx; text-align: center; }
.modal-input { width: 100%; height: 100rpx; background: #f9f9f9; border: 2rpx solid #eee; padding: 0 25rpx; margin-bottom: 30rpx; border-radius: 15rpx; box-sizing: border-box; color: #000; font-size: 32rpx; }
.config-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25rpx; }
.label { font-size: 28rpx; color: #444; }
.small-input { border-bottom: 3rpx solid #4cd964; width: 140rpx; text-align: center; color: #000; font-weight: bold; font-size: 32rpx; }
.modal-btns { display: flex; margin-top: 40rpx; border-top: 1rpx solid #f0f0f0; padding-top: 35rpx; }
.m-btn { flex: 1; text-align: center; font-size: 32rpx; }
.confirm { color: #4cd964; font-weight: bold; }
.fab-green { position: fixed; bottom: 70rpx; right: 50rpx; width: 120rpx; height: 120rpx; background: #4cd964; color: #ffffff; border-radius: 60rpx; display: flex; justify-content: center; align-items: center; font-size: 70rpx; box-shadow: 0 10rpx 25rpx rgba(76,217,100,0.4); }
</style>

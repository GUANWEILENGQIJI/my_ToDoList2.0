<template>
	<view class="task-node">
		<view class="node-content" :style="{ marginLeft: depth * 20 + 'rpx' }">
			<view class="info-row">
				<view class="title-area" @tap="handleTitleClick">
					<text v-if="!task.isStepMode && task.children?.length" class="expand-icon">
						{{ task.expanded ? '▼' : '▶' }}
					</text>
					<text class="icon">{{ task.isStepMode ? '📅' : (task.children?.length ? '📂' : '📄') }}</text>
					<text class="title" :class="{ completed: currentProgress >= 100 }">{{ task.title }}</text>
				</view>
				<text class="progress-text">{{ currentProgress }}%</text>
			</view>
			
			<view class="progress-bar">
				<view class="progress-inner" :style="{ width: currentProgress + '%' }"></view>
			</view>

			<view v-if="task.isStepMode" class="step-container">
				<view class="step-btn minus" @tap="onStepClick(-1)">-1</view>
				<view class="step-txt">
					<text class="curr">{{ task.currentStep || 0 }}</text>
					<text class="sep">/</text>
					<text class="total">{{ task.totalStep }}</text>
				</view>
				<view class="step-btn plus" @tap="onStepClick(1)">+1</view>
			</view>

			<view class="controls">
				<text v-if="!task.isStepMode" class="btn add" @tap="$emit('addChild', task)">＋ 子任务</text>
				<text v-if="!task.isStepMode && !task.children?.length" class="btn toggle" @tap="toggleDone">
					{{ task.done ? '重做' : '完成' }}
				</text>
				<text class="btn delete" @tap="onDelete">删除</text>
			</view>
		</view>

		<view v-if="!task.isStepMode && task.children?.length" v-show="task.expanded !== false">
			<task-node 
				v-for="(child, index) in task.children" 
				:key="child.id" :task="child" :depth="depth + 1"
				@refresh="$emit('refresh')"
				@addChild="$emit('addChild', $event)"
				@deleteChild="deleteSubTask(index)"
				@stepChange="$emit('stepChange', $event)" 
			/>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps(['task', 'depth']);
// 增加 stepChange 事件向上透传
const emit = defineEmits(['refresh', 'addChild', 'deleteChild', 'stepChange']);

// 核心递归计算函数
const getTaskProgress = (item) => {
	if (item.isStepMode) {
		if (!item.totalStep || item.totalStep <= 0) return 0;
		return Math.min(100, Math.round(((item.currentStep || 0) / item.totalStep) * 100));
	}
	if (item.children && item.children.length > 0) {
		let totalPercent = 0;
		item.children.forEach(child => {
			totalPercent += getTaskProgress(child);
		});
		return Math.round(totalPercent / item.children.length);
	}
	return item.done ? 100 : 0;
};

const currentProgress = computed(() => getTaskProgress(props.task));

const onStepClick = (val) => {
	// 不直接改数据，通过事件把“任务对象”和“增量”发给顶层
	emit('stepChange', { task: props.task, val: val });
};

const handleTitleClick = () => {
	if (props.task.children?.length) {
		props.task.expanded = !props.task.expanded;
		emit('refresh');
	}
};

const toggleDone = () => {
	props.task.done = !props.task.done;
	emit('refresh');
};

const onDelete = () => {
	uni.showModal({
		title: '确认删除',
		content: `要删除“${props.task.title}”吗？`,
		success: (res) => { if (res.confirm) emit('deleteChild'); }
	});
};

const deleteSubTask = (idx) => {
	props.task.children.splice(idx, 1);
	emit('refresh');
};
</script>

<style scoped>
.node-content { background: #fff; padding: 25rpx; margin-bottom: 15rpx; margin-right: 15rpx; border-radius: 18rpx; border: 1rpx solid #eee; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.04); }
.info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15rpx; }
.title-area { display: flex; align-items: center; flex: 1; }
.expand-icon { font-size: 20rpx; color: #999; margin-right: 8rpx; width: 25rpx; text-align: center; }
.icon { font-size: 28rpx; margin-right: 8rpx; }
.title { font-size: 28rpx; color: #000; font-weight: bold; }
.progress-text { font-size: 24rpx; color: #007AFF; font-weight: bold; }
.progress-bar { height: 10rpx; background: #f0f0f0; border-radius: 5rpx; overflow: hidden; }
.progress-inner { height: 100%; background: #4cd964; transition: width 0.3s; }
.step-container { display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 12rpx 20rpx; border-radius: 10rpx; margin: 15rpx 0; }
.step-btn { padding: 10rpx 30rpx; border-radius: 8rpx; font-size: 22rpx; background: #eee; }
.plus { background: #4cd964; color: #fff; font-weight: bold; }
.step-txt { font-size: 26rpx; font-weight: bold; }
.controls { display: flex; gap: 15rpx; margin-top: 20rpx; justify-content: flex-end; }
.btn { font-size: 22rpx; padding: 8rpx 20rpx; border-radius: 30rpx; background: #f5f5f5; color: #666; }
.btn.add { color: #007AFF; background: #eef6fe; }
.btn.delete { color: #ff3b30; }
</style>
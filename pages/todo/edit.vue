<template>
	<view class="edit-container">
		<view class="header-bar">
			<view class="header-left">
				<text class="page-title">{{ isEdit ? '编辑任务' : '新建任务' }}</text>
				<network-status />
			</view>
		</view>
		<view class="form-group">
			<text class="label">任务名称</text>
			<input class="uni-input" v-model="form.title" placeholder="输入任务名称..." />
		</view>

		<view class="form-group">
			<text class="label">跳转链接 (URL)</text>
			<input class="uni-input" v-model="form.link" placeholder="https://..." />
		</view>

		<view class="form-group">
			<text class="label">截止时间 (影响排序)</text>
			<view class="picker-row">
				<picker mode="date" :value="form.date" @change="e => form.date = e.detail.value">
					<view class="picker-box">{{ form.date || '日期' }}</view>
				</picker>
				<picker mode="time" :value="form.time" @change="e => form.time = e.detail.value">
					<view class="picker-box">{{ form.time || '时间' }}</view>
				</picker>
			</view>
		</view>

		<view class="form-group">
			<text class="label">详细备注</text>
			<textarea class="uni-textarea" v-model="form.content" placeholder="记录更多细节内容..." />
		</view>

		<view class="form-group">
			<text class="label">图片备注</text>
			<view v-if="form.image" class="image-wrap">
				<image :src="form.image" mode="widthFix" @click="previewImg"></image>
				<view class="del-img" @click="form.image = ''">删除图片</view>
			</view>
			<view v-else class="upload-area" @click="chooseImg">
				<text>📷 添加图片附件</text>
			</view>
		</view>

		<view class="action-bar">
			<button class="btn-save" @click="saveData">提交保存</button>
			<button v-if="isEdit" class="btn-delete" @click="removeData">删除该任务</button>
		</view>
		
		<view style="height: 60rpx;"></view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import NetworkStatus from '../../components/network-status/network-status.vue';
import {
	createTodoLocal,
	deleteTodoLocal,
	getTodoById,
	syncPendingActions,
	updateTodoLocal
} from '../../common/api.js';

const isEdit = ref(false);
const currentId = ref(null);
const saving = ref(false);
const form = ref({
	title: '',
	link: '',
	date: '',
	time: '23:59',
	content: '',
	image: ''
});

onLoad((options) => {
	const now = new Date();
	form.value.date = now.toISOString().split('T')[0];

	if (options && options.id) {
		isEdit.value = true;
		currentId.value = options.id;
		
		loadDetail(options.id);
	}
});

const loadDetail = async (id) => {
	const res = await getTodoById(id);
	if (res.code !== 0) {
		uni.showToast({ title: res.message || '加载详情失败', icon: 'none' });
		return;
	}

	const item = res.data;
	const d = new Date(item.timestamp);
	form.value = {
		...item,
		date: d.toISOString().split('T')[0],
		time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
	};
};

const saveData = async () => {
	if (!form.value.title) {
		return uni.showToast({ title: '标题不能为空', icon: 'none' });
	}

	if (saving.value) return;
	saving.value = true;

	try {
		const timestamp = new Date(`${form.value.date} ${form.value.time}`).getTime();
		const payload = {
			title: form.value.title,
			link: form.value.link,
			content: form.value.content,
			image: form.value.image,
			timestamp
		};

		let saveRes;
		if (isEdit.value) {
			saveRes = await updateTodoLocal(currentId.value, payload);
		} else {
			saveRes = await createTodoLocal(payload);
		}

		if (saveRes.code !== 0) {
			uni.showToast({ title: saveRes.message || '保存失败', icon: 'none' });
			return;
		}

		uni.showToast({ title: isEdit.value ? '修改成功' : '保存成功', icon: 'none' });
		syncPendingActions();
		uni.navigateBack();
	} catch (e) {
		uni.showToast({ title: '保存失败', icon: 'none' });
	} finally {
		saving.value = false;
	}
};

const removeData = () => {
	uni.showModal({
		title: '确认删除',
		content: '删除后无法恢复，确定吗？',
		success: async (res) => {
			if (!res.confirm) return;
			const data = await deleteTodoLocal(currentId.value);
			if (data.code === 0) {
				uni.showToast({ title: '删除成功', icon: 'none' });
				syncPendingActions();
				uni.navigateBack();
				return;
			}
			uni.showToast({ title: data.message || '删除失败', icon: 'none' });
		}
	});
};

const chooseImg = () => {
	uni.chooseImage({
		count: 1,
		success: (res) => {
			form.value.image = res.tempFilePaths[0];
		}
	});
};

const previewImg = () => {
	uni.previewImage({
		urls: [form.value.image]
	});
};
</script>

<style scoped>
.edit-container { padding: 30rpx; background: #fff; min-height: 100vh; }
.header-bar { margin-bottom: 24rpx; }
.header-left { display: flex; align-items: center; gap: 16rpx; }
.page-title { font-size: 36rpx; font-weight: bold; color: #333; }
.form-group { margin-bottom: 35rpx; }
.label { font-size: 26rpx; color: #888; margin-bottom: 15rpx; display: block; }
.uni-input, .picker-box, .uni-textarea { background: #f8f8f8; padding: 25rpx; border-radius: 12rpx; font-size: 30rpx; }
.picker-row { display: flex; gap: 20rpx; }
.picker-box { flex: 1; text-align: center; color: #333; }
.uni-textarea { width: 100%; height: 220rpx; box-sizing: border-box; }

.upload-area { height: 180rpx; background: #f8f8f8; border: 2rpx dashed #ddd; border-radius: 12rpx; display: flex; justify-content: center; align-items: center; color: #999; }
.image-wrap { position: relative; width: 100%; }
.image-wrap image { width: 100%; border-radius: 12rpx; }
.del-img { position: absolute; top: 15rpx; right: 15rpx; background: rgba(0,0,0,0.6); color: #fff; padding: 10rpx 20rpx; border-radius: 30rpx; font-size: 22rpx; }

.action-bar { margin-top: 60rpx; }
.btn-save { background: #007AFF; color: #fff; border-radius: 50rpx; margin-bottom: 30rpx; font-size: 32rpx; }
.btn-delete { background: #fff; color: #ff3b30; border: 1rpx solid #ff3b30; border-radius: 50rpx; font-size: 32rpx; }
</style>

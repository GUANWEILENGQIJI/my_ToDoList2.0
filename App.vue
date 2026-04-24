<script>
	import { checkVersion, getPendingActionCount, syncPendingActions } from './common/api'
	import { refreshServerStatus, startServerStatusMonitor, stopServerStatusMonitor } from './common/server-status'

	let networkChangeHandler = null
	const CURRENT_PLATFORM = 'android'
	const CURRENT_VERSION_NAME = '1.0.0'
	const CURRENT_VERSION_CODE = 100
	let versionModalVisible = false

	export default {
		onLaunch: function() {
			console.log('App Launch')
			startServerStatusMonitor()
			this.registerNetworkSync()
			this.trySyncPendingActions()
			this.checkAppVersion()
		},
		onShow: function() {
			console.log('App Show')
			refreshServerStatus()
			this.trySyncPendingActions()
		},
		onHide: function() {
			console.log('App Hide')
		},
		onUnload: function() {
			if (networkChangeHandler) {
				uni.offNetworkStatusChange(networkChangeHandler)
				networkChangeHandler = null
			}
			stopServerStatusMonitor()
		},
		methods: {
			registerNetworkSync() {
				if (networkChangeHandler) return

				networkChangeHandler = (res) => {
					refreshServerStatus()
					if (res.isConnected) {
						this.trySyncPendingActions()
					}
				}

				uni.onNetworkStatusChange(networkChangeHandler)
			},
			async trySyncPendingActions() {
				if (!getPendingActionCount()) return
				try {
					await syncPendingActions()
				} catch (error) {
					console.log('sync pending actions failed', error)
				}
			},
			async checkAppVersion(manual = false) {
				try {
					if (versionModalVisible) return

					const res = await checkVersion(CURRENT_PLATFORM, CURRENT_VERSION_CODE)
					if (res.code !== 0) {
						if (manual) {
							uni.showToast({
								title: res.message || '检查更新失败',
								icon: 'none'
							})
						}
						return
					}

					if (!res.data?.hasUpdate) {
						if (manual) {
							uni.showToast({
								title: '当前已是最新版本',
								icon: 'none'
							})
						}
						return
					}

					const info = res.data
					versionModalVisible = true

					uni.showModal({
						title: '发现新版本',
						content: info.changelog || `当前版本 ${CURRENT_VERSION_NAME}，最新版本 ${info.versionName}`,
						showCancel: !info.forceUpdate,
						success: (modalRes) => {
							if (modalRes.confirm && info.apkUrl) {
								// #ifdef APP-PLUS
								plus.runtime.openURL(info.apkUrl)
								// #endif
								// #ifndef APP-PLUS
								window.open(info.apkUrl)
								// #endif
							}
						},
						complete: () => {
							versionModalVisible = false
						}
					})
				} catch (error) {
					versionModalVisible = false
					console.log('check version failed', error)
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>

<script>
	import wsManager from '@/utils/websocket.js'

	export default {
	onLaunch: function() {
		console.log('App Launch')
		// 确保始终注册消息处理器，避免登录后没有监听
		this.registerMessageHandlers()
		this.initWebSocket()
	},
	onShow: async function() {
		console.log('App Show')
		// 只连接WebSocket，不重复注册处理器
		const token = uni.getStorageSync('token')
		if (token) {
			await this.ensureUserInfo()
			wsManager.connect(token)
		}
	},
	onHide: function() {
		console.log('App Hide')
	},
	methods: {
		async initWebSocket() {
			const token = uni.getStorageSync('token')
			if (token) {
				await this.ensureUserInfo()
				wsManager.connect(token)
			}
		},
			registerMessageHandlers() {
				// 先移除旧的处理器，避免重复注册
				wsManager.off('message', this.handleWebSocketMessage)
				// 注册新的处理器
				wsManager.on('message', this.handleWebSocketMessage)
			},
		async ensureUserInfo() {
			let userInfo = uni.getStorageSync('userInfo')

			// 兼容旧结构（包含 user 字段）
			if (userInfo && !userInfo.id && userInfo.user) {
				userInfo = userInfo.user
				uni.setStorageSync('userInfo', userInfo)
			}

			if (userInfo && userInfo.id) {
				return userInfo
			}

			const token = uni.getStorageSync('token')
			if (!token) {
				return null
			}

			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.getUserInfo()
				if (response.success && response.data) {
					const fetchedUser = response.data.user || response.data.data || response.data
					if (fetchedUser) {
						uni.setStorageSync('userInfo', fetchedUser)
						userInfo = fetchedUser
						console.log('App.vue: 通过接口重新获取到用户信息')
					} else {
						console.warn('App.vue: 获取到的数据中没有用户信息字段', response.data)
					}
				} else {
					console.warn('App.vue: 获取用户信息失败或未返回数据', response)
				}
			} catch (error) {
				console.error('App.vue: 获取用户信息异常', error)
			}

			return userInfo || null
		},
			handleWebSocketMessage(data) {
				console.log('App.vue: 收到聊天消息:', data)
				console.log('App.vue: 消息数据类型:', typeof data)
				console.log('App.vue: 消息数据内容:', JSON.stringify(data, null, 2))
				console.log('App.vue: 触发全局事件 ws:message')
				uni.$emit('ws:message', data)
				console.log('App.vue: 全局事件已触发')
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>

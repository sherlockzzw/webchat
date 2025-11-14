<script>
	import wsManager from '@/utils/websocket.js'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.initWebSocket()
		},
		onShow: function() {
			console.log('App Show')
			// 只连接WebSocket，不重复注册处理器
			const token = uni.getStorageSync('token')
			if (token) {
				wsManager.connect(token)
			}
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			initWebSocket() {
				const token = uni.getStorageSync('token')
				if (token) {
					wsManager.connect(token)
					this.registerMessageHandlers()
				}
			},
			registerMessageHandlers() {
				// 先移除旧的处理器，避免重复注册
				wsManager.off('message', this.handleWebSocketMessage)
				// 注册新的处理器
				wsManager.on('message', this.handleWebSocketMessage)
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

// WebSocket管理器
class WebSocketManager {
	constructor() {
		this.ws = null
		this.reconnectTimer = null
		this.heartbeatTimer = null
		this.reconnectInterval = 3000 // 3秒重连间隔
		this.heartbeatInterval = 30000 // 30秒心跳间隔
		this.messageHandlers = new Map()
		this.isConnecting = false
		this.shouldReconnect = true
	}

	// 连接WebSocket
	connect(token) {
		if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
			return
		}

		this.isConnecting = true
		const userInfo = uni.getStorageSync('userInfo')
		if (!userInfo || !userInfo.id) {
			console.error('WebSocket: 用户信息不存在')
			this.isConnecting = false
			return
		}

		const userId = userInfo.id
		const wsUrl = `ws://127.0.0.1:8080/ws/connect?token=${token}&user_id=${userId}`

		console.log('WebSocket: 开始连接', wsUrl)

		try {
			this.ws = new WebSocket(wsUrl)

			this.ws.onopen = () => {
				console.log('WebSocket: 连接成功')
				console.log('WebSocket: 当前连接状态', this.ws.readyState)
				console.log('WebSocket: 已注册的处理器', Array.from(this.messageHandlers.keys()))
				this.isConnecting = false
				this.startHeartbeat()
				this.emit('connected')
			}

			this.ws.onmessage = (event) => {
				console.log('WebSocket: 收到原始消息', event.data)
				try {
					const message = JSON.parse(event.data)
					console.log('WebSocket: 解析后的消息', message)
					this.handleMessage(message)
				} catch (error) {
					console.error('WebSocket: 消息解析失败', error, event.data)
				}
			}

			this.ws.onerror = (error) => {
				console.error('WebSocket: 连接错误', error)
				this.isConnecting = false
				this.emit('error', error)
			}

			this.ws.onclose = () => {
				console.log('WebSocket: 连接关闭')
				this.isConnecting = false
				this.stopHeartbeat()
				this.emit('disconnected')

				if (this.shouldReconnect) {
					this.scheduleReconnect(token)
				}
			}
		} catch (error) {
			console.error('WebSocket: 连接异常', error)
			this.isConnecting = false
			if (this.shouldReconnect) {
				this.scheduleReconnect(token)
			}
		}
	}

	// 处理消息
	handleMessage(message) {
		console.log('WebSocket handleMessage: 收到消息', message)
		console.log('WebSocket handleMessage: 消息类型', typeof message)
		console.log('WebSocket handleMessage: 消息内容', JSON.stringify(message, null, 2))

		const { type, data } = message || {}

		console.log('WebSocket handleMessage: 提取的type', type)
		console.log('WebSocket handleMessage: 提取的data', data)
		console.log('WebSocket handleMessage: 已注册的处理器类型', Array.from(this.messageHandlers.keys()))

		if (type && this.messageHandlers.has(type)) {
			const handlers = this.messageHandlers.get(type)
			console.log(`WebSocket handleMessage: 找到 ${type} 类型的处理器，数量: ${handlers.length}`)
			handlers.forEach((handler, index) => {
				try {
					console.log(`WebSocket handleMessage: 执行第 ${index + 1} 个处理器`)
					handler(data)
					console.log(`WebSocket handleMessage: 第 ${index + 1} 个处理器执行成功`)
				} catch (error) {
					console.error(`WebSocket handleMessage: 第 ${index + 1} 个消息处理器执行失败:`, error)
				}
			})
		} else {
			console.warn(`WebSocket handleMessage: 没有找到 ${type} 类型的处理器，已注册的类型:`, Array.from(this.messageHandlers.keys()))
			console.warn(`WebSocket handleMessage: 消息将被忽略`)
		}
	}

	// 注册消息处理器
	on(type, handler) {
		if (!this.messageHandlers.has(type)) {
			this.messageHandlers.set(type, [])
		}
		this.messageHandlers.get(type).push(handler)
	}

	// 移除消息处理器
	off(type, handler) {
		if (this.messageHandlers.has(type)) {
			const handlers = this.messageHandlers.get(type)
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
			}
			if (handlers.length === 0) {
				this.messageHandlers.delete(type)
			}
		}
	}

	// 发送消息
	send(data) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data))
			return true
		}
		console.warn('WebSocket: 连接未打开，无法发送消息')
		return false
	}

	// 启动心跳
	startHeartbeat() {
		this.stopHeartbeat()
		this.heartbeatTimer = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.send({ type: 'ping' })
			}
		}, this.heartbeatInterval)
	}

	// 停止心跳
	stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer)
			this.heartbeatTimer = null
		}
	}

	// 安排重连
	scheduleReconnect(token) {
		if (this.reconnectTimer) {
			return
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			console.log('WebSocket: 尝试重连...')
			this.connect(token)
		}, this.reconnectInterval)
	}

	// 断开连接
	disconnect() {
		this.shouldReconnect = false
		this.stopHeartbeat()
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		if (this.ws) {
			this.ws.close()
			this.ws = null
		}
	}

	// 事件发射器（简化版）
	eventHandlers = new Map()

	emit(event, data) {
		if (this.eventHandlers.has(event)) {
			this.eventHandlers.get(event).forEach(handler => {
				try {
					handler(data)
				} catch (error) {
					console.error(`事件处理器执行失败: ${event}`, error)
				}
			})
		}
	}

	addEventListener(event, handler) {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, [])
		}
		this.eventHandlers.get(event).push(handler)
	}

	removeEventListener(event, handler) {
		if (this.eventHandlers.has(event)) {
			const handlers = this.eventHandlers.get(event)
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
			}
			if (handlers.length === 0) {
				this.eventHandlers.delete(event)
			}
		}
	}
}

// 创建单例
const wsManager = new WebSocketManager()

export default wsManager


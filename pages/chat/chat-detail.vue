<template>
	<view class="chat-detail-page">
		<!-- 消息列表 -->
		<scroll-view
			class="message-list"
			scroll-y
			:scroll-into-view="scrollIntoView"
			scroll-with-animation
			:scroll-top="scrollTop"
			:enable-back-to-top="true"
			:lower-threshold="50"
			:upper-threshold="50"
		>
			<view
				v-for="(message, index) in messages"
				:key="message.id || message.message_id || index"
				:id="'msg-' + index"
				class="message-item"
				:class="{ 'is-self': message.is_self || (message.from_user_id && Number(message.from_user_id) === Number(userInfo.id)) }"
			>
				<!-- 对方消息：头像在左边 -->
				<view class="message-avatar" v-if="!(message.is_self || (message.from_user_id && Number(message.from_user_id) === Number(userInfo.id)))">
					<image 
						:src="isGroup ? getAvatarUrl(message.sender_avatar || groupMembers[message.from_user_id]?.avatar || '') : getAvatarUrl(friendInfo.avatar)" 
						class="avatar-img" 
						@error="handleAvatarError"
					></image>
				</view>

				<!-- 自己消息：头像在右边（通过 row-reverse 实现） -->
				<view class="message-avatar" v-if="message.is_self || (message.from_user_id && Number(message.from_user_id) === Number(userInfo.id))">
					<image :src="getAvatarUrl(userInfo.avatar)" class="avatar-img" @error="handleAvatarError"></image>
				</view>

				<view class="message-content">
					<!-- 群聊显示发送者名称 -->
					<text v-if="isGroup && !message.is_self && message.sender_name" class="sender-name">{{ message.sender_name }}</text>
					<view class="message-bubble" :class="getMessageBubbleClass(message)">
						<!-- 文本消息 -->
						<text v-if="message.message_type === 0 || !message.message_type" class="message-text">{{ message.content || '' }}</text>

						<!-- 图片消息 -->
						<view v-else-if="message.message_type === 1" class="message-image">
							<image
								:src="getFileUrl(message.file_url)"
								class="image-content"
								mode="aspectFit"
								@click="previewImage(message.file_url)"
								@error="handleImageError"
							></image>
							<text v-if="message.content" class="image-desc">{{ message.content }}</text>
						</view>

						<!-- 文件消息 -->
						<view v-else-if="message.message_type === 2" class="message-file">
							<view class="file-icon">📎</view>
							<view class="file-info">
								<text class="file-name">{{ message.file_name || '未知文件' }}</text>
								<text class="file-size">{{ formatFileSize(message.file_size) }}</text>
							</view>
							<text v-if="message.content" class="file-desc">{{ message.content }}</text>
						</view>

						<!-- 表情包消息 -->
						<view v-else-if="message.message_type === 3" class="message-emoji">
							<image
								:src="getFileUrl(message.file_url)"
								class="emoji-content"
								mode="aspectFit"
								@error="handleImageError"
							></image>
						</view>

						<!-- 系统消息 -->
						<text v-else-if="message.message_type === 4" class="message-system">{{ message.content || '' }}</text>

						<!-- 发送状态 -->
						<view v-if="message.status === 'sending'" class="message-status">
							<text class="status-icon">⏳</text>
						</view>
						<view v-else-if="message.status === 'failed'" class="message-status">
							<text class="status-icon error" @click="retrySend(message)">❌</text>
						</view>
					</view>
					<text class="message-time">{{ formatTime(message.created_at) }}</text>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="messages.length === 0" class="empty-state">
				<text class="empty-icon">💬</text>
				<text class="empty-text">开始聊天吧</text>
				<text class="empty-desc">发送第一条消息开始你们的对话</text>
			</view>
		</scroll-view>

		<!-- 输入框 -->
		<view class="input-section">
			<view class="input-wrapper">
				<view class="input-actions">
					<text class="action-icon" @click="showMoreActions">➕</text>
				</view>
				<input
					class="message-input"
					type="text"
					v-model="inputMessage"
					placeholder="输入消息..."
					placeholder-style="color: #999;"
					@confirm="sendMessage"
				/>
				<button
					class="send-btn"
					:class="{ 'can-send': inputMessage.trim() }"
					:disabled="!inputMessage.trim()"
					@click="sendMessage"
				>
					发送
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			friendId: '',
			friendName: '',
			groupId: '',
			groupName: '',
			isGroup: false, // 是否是群聊
			friendInfo: {},
			groupInfo: {},
			userInfo: {},
			messages: [],
			inputMessage: '',
			scrollIntoView: '',
			scrollTop: 0,
			isLoadingFriend: false,
			scrollTimer: null,
			isScrolling: false,
			groupMembers: {} // 群成员信息映射，用于显示发送者名称
		}
	},
	async onLoad(options) {
		// 判断是群聊还是私聊
		if (options.groupId) {
			// 群聊
			this.groupId = options.groupId
			this.groupName = options.groupName || '群聊'
			this.isGroup = true
			uni.setNavigationBarTitle({
				title: this.groupName
			})
		} else {
			// 私聊
			this.friendId = options.friendId || options.chatId
			this.friendName = options.friendName || options.name
			this.isGroup = false
			uni.setNavigationBarTitle({
				title: this.friendName || '聊天'
			})
		}

		// 从本地存储加载用户信息
		this.userInfo = uni.getStorageSync('userInfo') || {}
		
		await this.ensureUserInfoReady()

		if (this.isGroup) {
			this.loadGroupInfo()
		} else {
			this.loadFriendInfo()
		}
		this.loadMessages()
		this.setupWebSocketListener()
	},
	onShow() {
		// 页面显示时重新注册监听器，确保能接收到消息
		this.setupWebSocketListener()
	},
	onUnload() {
		uni.$off('ws:message', this.handleWebSocketMessage)
		// 清理滚动定时器
		if (this.scrollTimer) {
			clearTimeout(this.scrollTimer)
			this.scrollTimer = null
		}
		this.isScrolling = false
	},
	methods: {
		normalizeTimestamp(value) {
			if (!value) return Date.now()
			if (typeof value === 'number') {
				return value > 1e12 ? value : value * 1000
			}
			if (typeof value === 'string') {
				const parsed = Date.parse(value)
				return isNaN(parsed) ? Date.now() : parsed
			}
			if (typeof value === 'object') {
				if (value.seconds) {
					return value.seconds * 1000 + Math.floor((value.nanos || 0) / 1e6)
				}
			}
			return Date.now()
		},

		async loadFriendInfo() {
			this.isLoadingFriend = true
			try {
				const friendApi = await import('@/api/friend.js')
				const detailResponse = await friendApi.default.getFriendDetail(this.friendId)
				if (detailResponse.success && detailResponse.data.friend) {
					this.friendInfo = detailResponse.data.friend
					if (this.friendInfo.name || this.friendInfo.remark) {
						uni.setNavigationBarTitle({
							title: this.friendInfo.remark || this.friendInfo.name || '聊天'
						})
					}
					return
				}

				const listResponse = await friendApi.default.getFriendList(1, 100)
				if (listResponse.success && listResponse.data.friends) {
					const friend = listResponse.data.friends.find(f => Number(f.id) === Number(this.friendId))
					if (friend) {
						this.friendInfo = friend
						if (this.friendInfo.name || this.friendInfo.remark) {
							uni.setNavigationBarTitle({
								title: this.friendInfo.remark || this.friendInfo.name || '聊天'
							})
						}
					}
				}
			} catch (error) {
				console.error('加载好友信息失败:', error)
			} finally {
				this.isLoadingFriend = false
			}
		},

		async loadGroupInfo() {
			try {
				const groupApi = await import('@/api/group.js')
				const response = await groupApi.default.getGroupInfo(this.groupId)
				if (response.success && response.data) {
					this.groupInfo = response.data.group || {}
					// 构建群成员映射，用于显示发送者名称
					if (response.data.members) {
						response.data.members.forEach(member => {
							this.groupMembers[member.user_id] = {
								name: member.nickname || member.user_name || '未知',
								avatar: member.user_avatar || ''
							}
						})
					}
					if (this.groupInfo.name) {
						uni.setNavigationBarTitle({
							title: this.groupInfo.name
						})
					}
				}
			} catch (error) {
				console.error('加载群组信息失败:', error)
			}
		},

		async ensureUserInfoReady(force = false) {
			let userInfo = this.userInfo
			if (!force && userInfo && userInfo.id) {
				return userInfo
			}

			const stored = uni.getStorageSync('userInfo')
			if (!force && stored && stored.id) {
				this.userInfo = stored
				return stored
			}

			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.getUserInfo()
				if (response.success && response.data && response.data.user) {
					uni.setStorageSync('userInfo', response.data.user)
					this.userInfo = response.data.user
					return response.data.user
				}
			} catch (error) {
				console.error('ensureUserInfoReady: 获取用户信息失败', error)
			}
			return null
		},

		async loadMessages() {
			try {
				await this.ensureUserInfoReady()
				const chatApi = await import('@/api/chat.js')
				// 根据是群聊还是私聊调用不同的参数
				const params = this.isGroup 
					? { groupId: this.groupId, page: 1, pageSize: 50 }
					: { otherUserId: this.friendId, page: 1, pageSize: 50 }
				const response = await chatApi.default.getMessageHistory(params)

				if (response.success) {
					let messages = []
					const payload = response.data

					if (payload) {
						if (Array.isArray(payload.messages)) {
							messages = payload.messages
						} else if (Array.isArray(payload.Messages)) {
							messages = payload.Messages
						} else if (Array.isArray(payload)) {
							messages = payload
						}
					}

					if (!Array.isArray(messages)) {
						messages = []
					}

					const processedMessages = messages.map(msg => {
						const createdAt = this.normalizeTimestamp(msg.created_at)
						const fromUserId = Number(msg.from_user_id || msg.fromUserId || msg.FromUserId || 0)
						const currentUserId = Number(this.userInfo.id || 0)
						
						// 群聊需要获取发送者信息
						let senderName = ''
						let senderAvatar = ''
						if (this.isGroup && fromUserId !== currentUserId) {
							const sender = this.groupMembers[fromUserId]
							if (sender) {
								senderName = sender.name
								senderAvatar = sender.avatar
							} else {
								senderName = '未知'
							}
						}
						
						return {
							...msg,
							id: msg.id || msg.message_id || Date.now(),
							from_user_id: fromUserId,
							to_user_id: Number(msg.to_user_id || msg.toUserId || msg.ToUserId || 0),
							group_id: Number(msg.group_id || msg.groupId || 0),
							message_type: msg.message_type || msg.messageType || msg.MessageType || 0,
							sender_name: senderName,
							sender_avatar: senderAvatar,
							content: msg.content || msg.Content || '',
							file_url: msg.file_url || msg.fileUrl || msg.FileUrl || '',
							file_name: msg.file_name || msg.fileName || msg.FileName || '',
							file_size: msg.file_size || msg.fileSize || msg.FileSize || 0,
							is_self: fromUserId === currentUserId,
							created_at: createdAt,
							status: msg.status || msg.Status || 'sent'
						}
					})

					processedMessages.sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
					this.messages = processedMessages
					
					console.log('处理后的消息列表:', this.messages)
					console.log('消息数量:', this.messages.length)
					console.log('当前用户ID:', this.userInfo.id, '类型:', typeof this.userInfo.id)

					this.$nextTick(() => {
						this.scrollToBottom()
					})
				} else {
					uni.showToast({
						title: response.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载聊天记录失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			}
		},

		setupWebSocketListener() {
			// 先移除旧的监听器，避免重复注册
			uni.$off('ws:message', this.handleWebSocketMessage)
			// 注册新的监听器
			uni.$on('ws:message', this.handleWebSocketMessage)
			console.log('WebSocket监听器已注册')
		},

		async handleWebSocketMessage(data) {
			console.log('chat-detail.vue: 收到WebSocket消息', data)
			
			// 确保用户信息存在，如果不存在则从本地存储重新加载
			let userInfo = this.userInfo
			if (!userInfo || !userInfo.id) {
				console.log('chat-detail.vue: 用户信息不存在，尝试从本地存储加载')
				userInfo = uni.getStorageSync('userInfo') || {}
				if (userInfo && userInfo.id) {
					this.userInfo = userInfo
					console.log('chat-detail.vue: 用户信息已从本地存储加载', userInfo)
				} else {
					console.log('chat-detail.vue: 本地存储中也没有用户信息，尝试从服务器获取')
					try {
						const userApi = await import('@/api/user.js')
						const response = await userApi.default.getUserInfo()
						if (response.success && response.data && response.data.user) {
							userInfo = response.data.user
							this.userInfo = userInfo
							uni.setStorageSync('userInfo', userInfo)
							console.log('chat-detail.vue: 通过接口获取用户信息成功', userInfo)
						} else {
							console.log('chat-detail.vue: 无法获取用户信息，忽略消息')
							return
						}
					} catch (error) {
						console.error('chat-detail.vue: 获取用户信息失败', error)
						return
					}
				}
			}

			const currentUserId = Number(userInfo.id || this.userInfo.id || 0)
			const fromUserId = Number(data.from_user_id ?? data.fromUserId ?? 0)
			const toUserId = Number(data.to_user_id ?? data.toUserId ?? 0)
			const groupId = Number(data.group_id ?? data.groupId ?? 0)
			
			// 判断是群聊还是私聊
			if (this.isGroup) {
				// 群聊：检查是否是当前群组的消息
				const currentGroupId = Number(this.groupId || 0)
				if (!currentUserId || !currentGroupId || groupId !== currentGroupId) {
					console.log('chat-detail.vue: 群聊消息不匹配，忽略', {
						currentUserId,
						currentGroupId,
						groupId
					})
					return
				}
				
				// 如果是新成员发送的消息，更新群成员映射
				if (fromUserId !== currentUserId && !this.groupMembers[fromUserId]) {
					// 重新加载群组信息以获取新成员
					this.loadGroupInfo()
				}
			} else {
				// 私聊：检查是否是当前好友的消息
				const currentFriendId = Number(this.friendId || 0)
				if (!currentUserId || !currentFriendId) {
					console.log('chat-detail.vue: 用户ID或好友ID无效，忽略消息', {
						currentUserId,
						currentFriendId
					})
					return
				}

				const isFromFriend = fromUserId === currentFriendId && toUserId === currentUserId
				const isToFriend = fromUserId === currentUserId && toUserId === currentFriendId

				if (!(isFromFriend || isToFriend)) {
					console.log('chat-detail.vue: 消息不匹配当前聊天，忽略')
					return
				}
			}

			console.log('chat-detail.vue: 消息匹配，开始处理')

			const createdAt = this.normalizeTimestamp(data.created_at)
			const messageId = data.id || data.message_id || String(Date.now())

			// 群聊需要获取发送者名称
			let senderName = ''
			if (this.isGroup && fromUserId !== currentUserId) {
				const sender = this.groupMembers[fromUserId]
				senderName = sender ? sender.name : '未知'
			}

			const message = {
				...data,
				id: messageId,
				from_user_id: fromUserId,
				to_user_id: toUserId,
				group_id: groupId,
				message_type: data.message_type || data.messageType || 0,
				content: data.content || '',
				file_url: data.file_url || data.fileUrl || '',
				file_name: data.file_name || data.fileName || '',
				file_size: data.file_size || data.fileSize || 0,
				is_self: fromUserId === currentUserId,
				sender_name: senderName, // 群聊发送者名称
				created_at: createdAt,
				status: 'sent'
			}

			// 检查消息是否已存在（通过ID匹配）
			const existingIndex = this.messages.findIndex(m => {
				const mId = String(m.id || m.message_id || '')
				const msgId = String(messageId)
				return mId === msgId
			})

			if (existingIndex >= 0) {
				// 如果消息已存在，更新它（可能是临时消息被替换）
				console.log('更新已存在的消息，索引:', existingIndex)
				this.messages[existingIndex] = message
				} else {
					// 如果是自己发送的消息，检查是否有临时消息需要替换（通过内容和时间匹配）
					if (fromUserId === currentUserId) {
						const tempIndex = this.messages.findIndex(m => {
							// 查找发送中的临时消息，且内容匹配
							if (this.isGroup) {
								return m.status === 'sending' && 
								       m.content === message.content &&
								       m.from_user_id === currentUserId &&
								       m.group_id === Number(this.groupId)
							} else {
								return m.status === 'sending' && 
								       m.content === message.content &&
								       m.from_user_id === currentUserId &&
								       m.to_user_id === Number(this.friendId)
							}
						})
					
					if (tempIndex >= 0) {
						// 用真实消息替换临时消息
						console.log('用WebSocket消息替换临时消息，索引:', tempIndex)
						this.messages[tempIndex] = message
					} else {
						// 没有找到临时消息，直接添加
						this.messages.push(message)
					}
				} else {
					// 对方发送的消息，直接添加
					this.messages.push(message)
				}
			}

			// 排序并滚动到底部
			this.messages.sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
			// 使用防抖延迟滚动，避免频繁调用
			if (this.scrollTimer) {
				clearTimeout(this.scrollTimer)
			}
			this.scrollTimer = setTimeout(() => {
				this.scrollToBottom()
			}, 150)
		},

		async sendMessage() {
			await this.ensureUserInfoReady()
			if (!this.inputMessage.trim()) return

			const messageContent = this.inputMessage.trim()
			this.inputMessage = ''

			const tempId = 'temp_' + Date.now()
			const tempMessage = {
				id: tempId,
				content: messageContent,
				is_self: true,
				from_user_id: Number(this.userInfo.id),
				to_user_id: this.isGroup ? 0 : Number(this.friendId),
				group_id: this.isGroup ? Number(this.groupId) : 0,
				created_at: Date.now(),
				status: 'sending',
				message_type: 0
			}
			this.messages.push(tempMessage)
			
			// 延迟滚动，确保DOM更新完成，使用防抖
			if (this.scrollTimer) {
				clearTimeout(this.scrollTimer)
			}
			this.scrollTimer = setTimeout(() => {
				this.scrollToBottom()
			}, 150)

			try {
				const chatApi = await import('@/api/chat.js')
				// 根据是群聊还是私聊构建不同的参数
				const messageData = this.isGroup
					? {
						groupId: Number(this.groupId),
						content: messageContent,
						messageType: 0
					}
					: {
						toUserId: Number(this.friendId),
						content: messageContent,
						messageType: 0
					}
				const response = await chatApi.default.sendMessage(messageData)

				if (response.success) {
					// 更新临时消息的ID，等待WebSocket消息到达后替换
					const realMessageId = response.data.message?.id || response.data.id
					if (realMessageId) {
						tempMessage.id = realMessageId
						tempMessage.status = 'sent'
					}
					// 再次滚动确保消息完整显示，使用防抖
					if (this.scrollTimer) {
						clearTimeout(this.scrollTimer)
					}
					this.scrollTimer = setTimeout(() => {
						this.scrollToBottom()
					}, 200)
				} else {
					tempMessage.status = 'failed'
					uni.showToast({
						title: response.message || '发送失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('发送消息失败:', error)
				tempMessage.status = 'failed'
				uni.showToast({
					title: '发送失败，请重试',
					icon: 'none'
				})
			}
		},

		showMoreActions() {
			const actions = ['图片', '文件', '语音']
			if (this.isGroup) {
				actions.push('群成员')
			}
			uni.showActionSheet({
				itemList: actions,
				success: (res) => {
					if (res.tapIndex === 0) {
						this.selectImage()
					} else if (res.tapIndex === 1) {
						this.selectFile()
					} else if (res.tapIndex === 2) {
						this.startVoiceRecord()
					} else if (res.tapIndex === 3 && this.isGroup) {
						// 群成员管理
						uni.navigateTo({
							url: `/pages/group/group-members?groupId=${this.groupId}`
						})
					}
				}
			})
		},

		selectImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: () => {
					uni.showToast({
						title: '图片发送功能开发中',
						icon: 'none'
					})
				}
			})
		},

		selectFile() {
			uni.showToast({
				title: '文件发送功能开发中',
				icon: 'none'
			})
		},

		startVoiceRecord() {
			uni.showToast({
				title: '语音发送功能开发中',
				icon: 'none'
			})
		},

		previewImage(imageUrl) {
			const fullUrl = this.getFileUrl(imageUrl)
			uni.previewImage({
				urls: [fullUrl],
				current: fullUrl
			})
		},

		getFileUrl(url) {
			if (!url) return ''
			if (url.startsWith('http://') || url.startsWith('https://')) {
				return url
			}
			const { API_CONFIG } = require('@/api/config.js')
			return `${API_CONFIG.BASE_URL}${url}`
		},

		getAvatarUrl(avatar) {
			if (!avatar || avatar === '') {
				return '/static/logo.png'
			}
			
			// 如果已经是完整URL，直接返回
			if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
				return avatar
			}
			
			// 如果是data URI，直接返回
			if (avatar.startsWith('data:')) {
				return avatar
			}
			
			// 如果是相对路径，拼接完整URL
			const { API_CONFIG } = require('@/api/config.js')
			
			// 如果路径以/开头，直接拼接
			if (avatar.startsWith('/')) {
				// 检查是否是 /static/ 路径
				if (avatar.startsWith('/static/')) {
					return `${API_CONFIG.BASE_URL}${avatar}`
				}
				// 其他路径也直接拼接
				return `${API_CONFIG.BASE_URL}${avatar}`
			}
			
			// 如果路径不以/开头，可能是文件名，需要判断是avatar还是upload
			// 根据后端逻辑，头像可能在 /static/avatar/ 或 /static/upload/ 下
			// 先尝试 /static/upload/（因为上传的头像通常在这里）
			if (avatar.includes('upload') || avatar.includes('image')) {
				return `${API_CONFIG.BASE_URL}/static/upload/${avatar}`
			}
			// 默认使用 /static/avatar/
			return `${API_CONFIG.BASE_URL}/static/avatar/${avatar}`
		},

		handleAvatarError(e) {
			console.error('头像加载失败:', e)
			// 头像加载失败时，可以尝试重新加载用户信息
			this.refreshUserInfo()
		},

		async refreshUserInfo() {
			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.getUserInfo()
				if (response.success && response.data) {
					this.userInfo = response.data
					// 更新本地存储
					uni.setStorageSync('userInfo', this.userInfo)
					console.log('用户信息已刷新:', this.userInfo)
				}
			} catch (error) {
				console.error('刷新用户信息失败:', error)
			}
		},

		formatFileSize(bytes) {
			if (!bytes) return '0 B'
			const k = 1024
			const sizes = ['B', 'KB', 'MB', 'GB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
		},

		getMessageBubbleClass(message) {
			const type = message.message_type
			if (type === 1) return 'bubble-image'
			if (type === 2) return 'bubble-file'
			if (type === 3) return 'bubble-emoji'
			if (type === 4) return 'bubble-system'
			return ''
		},

		handleImageError(e) {
			console.log('图片加载失败:', e)
		},

		async retrySend(message) {
			if (message.message_type === 0 || !message.message_type) {
				message.status = 'sending'
				try {
					const chatApi = await import('@/api/chat.js')
					// 根据是群聊还是私聊构建不同的参数
					const messageData = this.isGroup
						? {
							groupId: Number(this.groupId),
							content: message.content,
							messageType: 0
						}
						: {
							toUserId: Number(this.friendId),
							content: message.content,
							messageType: 0
						}
					const response = await chatApi.default.sendMessage(messageData)
					if (response.success) {
						message.status = 'sent'
						message.id = response.data.message?.id || response.data.id || message.id
					} else {
						message.status = 'failed'
					}
				} catch (error) {
					message.status = 'failed'
				}
			}
		},

		formatTime(timestamp) {
			if (!timestamp) return ''
			const time = this.normalizeTimestamp(timestamp)
			const date = new Date(time)
			const now = new Date()
			const diff = now.getTime() - time

			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
			}
		},

		scrollToBottom() {
			if (this.messages.length === 0) {
				this.scrollIntoView = ''
				return
			}
			
			// 防止重复调用 - 如果正在滚动，直接返回
			if (this.isScrolling) {
				console.log('scrollToBottom: 正在滚动中，跳过本次调用')
				return
			}
			
			// 清除之前的定时器
			if (this.scrollTimer) {
				clearTimeout(this.scrollTimer)
				this.scrollTimer = null
			}
			
			// 设置滚动标志
			this.isScrolling = true
			
			// 使用简单的延迟滚动，避免递归
			const target = 'msg-' + (this.messages.length - 1)
			
			// 先设置 scrollTop，再设置 scrollIntoView
			this.scrollTop = 0
			
			// 延迟设置，确保DOM更新
			this.scrollTimer = setTimeout(() => {
				this.scrollIntoView = target
				this.scrollTop = 999999
				
				// 延迟后重置标志
				setTimeout(() => {
					this.isScrolling = false
					this.scrollTimer = null
				}, 200)
			}, 50)
		}
	}
}
</script>

<style scoped>
.chat-detail-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	overflow: hidden;
}

.message-list {
	flex: 1;
	height: calc(100vh - 120rpx);
	padding: 20rpx 0;
	padding-bottom: 220rpx;
	box-sizing: border-box;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}

.message-item {
	display: flex;
	margin-bottom: 30rpx;
	align-items: flex-start;
	min-height: 80rpx;
	word-wrap: break-word;
	word-break: break-all;
	padding: 0 30rpx;
}

.message-item.is-self {
	flex-direction: row-reverse;
	justify-content: flex-start;
}

.message-item:not(.is-self) {
	flex-direction: row;
	justify-content: flex-start;
}

.message-avatar {
	flex-shrink: 0;
	width: 80rpx;
	height: 80rpx;
	margin: 0;
}

.message-item:not(.is-self) .message-avatar {
	margin-right: 20rpx;
	margin-left: 0;
}

.message-item.is-self .message-avatar {
	margin-left: 20rpx;
	margin-right: 0;
}

.avatar-img {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
}

.message-content {
	flex: 1;
	max-width: calc(100% - 100rpx);
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.message-item.is-self .message-content {
	align-items: flex-end;
}

.sender-name {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
	padding: 0 10rpx;
}

.message-bubble {
	display: inline-block;
	align-self: flex-start;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 20rpx 25rpx;
	margin-bottom: 10rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
	max-width: 100%;
	word-wrap: break-word;
	word-break: break-all;
	overflow-wrap: break-word;
}

.message-item.is-self .message-bubble {
	align-self: flex-end;
	background: #4CD964;
	color: #ffffff;
}

.message-item:not(.is-self) .message-bubble {
	background: #ffffff;
	color: #333333;
}

.message-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.4;
	word-wrap: break-word;
	word-break: break-all;
	overflow-wrap: break-word;
	white-space: pre-wrap;
}

.message-item.is-self .message-text {
	color: #ffffff;
}

.message-item:not(.is-self) .message-text {
	color: #333333;
}

.message-time {
	font-size: 20rpx;
	color: #999;
	display: block;
	text-align: left;
}

.message-item.is-self .message-time {
	text-align: right;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 400rpx;
	color: #999;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 32rpx;
	margin-bottom: 10rpx;
}

.empty-desc {
	font-size: 26rpx;
	color: #bbb;
}

.input-section {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
	z-index: 50;
	min-height: 100rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #f7f7f7;
	border-radius: 50rpx;
	padding: 0 20rpx;
}

.input-actions {
	display: flex;
	align-items: center;
	margin-right: 10rpx;
}

.action-icon {
	font-size: 40rpx;
	color: #888;
}

.message-input {
	flex: 1;
	padding: 20rpx 10rpx;
	font-size: 28rpx;
	color: #333;
}

.send-btn {
	margin-left: 20rpx;
	padding: 12rpx 30rpx;
	border-radius: 999rpx;
	background: #d7d7d7;
	color: #fff;
	border: none;
	font-size: 28rpx;
}

.send-btn.can-send {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-image {
	display: flex;
	flex-direction: column;
}

.image-content {
	max-width: 400rpx;
	max-height: 600rpx;
	border-radius: 10rpx;
}

.image-desc {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
}

.message-item.is-self .image-desc {
	color: rgba(255, 255, 255, 0.9);
}

.message-file {
	display: flex;
	align-items: center;
	padding: 10rpx 0;
}

.file-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.file-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.file-name {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 5rpx;
}

.message-item.is-self .file-name {
	color: white;
}

.file-size {
	font-size: 22rpx;
	color: #999;
}

.message-item.is-self .file-size {
	color: rgba(255, 255, 255, 0.7);
}

.file-desc {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
}

.message-item.is-self .file-desc {
	color: rgba(255, 255, 255, 0.9);
}

.message-emoji {
	display: flex;
	align-items: center;
	justify-content: center;
}

.emoji-content {
	width: 200rpx;
	height: 200rpx;
}

.message-system {
	font-size: 24rpx;
	color: #888;
	text-align: center;
}

.message-status {
	display: inline-flex;
	align-items: center;
	margin-left: 10rpx;
}

.status-icon {
	font-size: 24rpx;
}

.status-icon.error {
	cursor: pointer;
}
</style>

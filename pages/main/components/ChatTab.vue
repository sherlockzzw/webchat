<template>
	<view class="chat-tab">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<uni-icons type="search" size="18" color="#999"></uni-icons>
				<input 
					v-model="searchKeyword" 
					placeholder="搜索聊天记录" 
					class="input"
					@input="onSearch"
				/>
			</view>
		</view>
		
		<!-- 聊天列表 -->
		<scroll-view class="chat-list" scroll-y>
			<view 
				v-for="chat in filteredChats" 
				:key="chat.id"
				class="chat-item"
				@click="openChat(chat)"
			>
				<view class="avatar">
					<image :src="chat.avatar || '/static/default-avatar.png'" class="avatar-img"></image>
					<view v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</view>
				</view>
				
				<view class="chat-info">
					<view class="chat-header">
						<text class="chat-name">{{ chat.name }}</text>
						<text class="chat-time">{{ formatTime(chat.lastMessageTime) }}</text>
					</view>
					<view class="chat-preview">
						<text class="last-message">{{ chat.lastMessage }}</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="filteredChats.length === 0" class="empty-state">
				<uni-icons type="chat" size="60" color="#ddd"></uni-icons>
				<text class="empty-text">暂无聊天记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	name: 'ChatTab',
	data() {
		return {
			searchKeyword: '',
			chats: [],
			isLoading: false
		}
	},
	computed: {
		filteredChats() {
			if (!this.searchKeyword) {
				return this.chats
			}
			return this.chats.filter(chat => 
				chat.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
				(chat.lastMessage && chat.lastMessage.toLowerCase().includes(this.searchKeyword.toLowerCase()))
			)
		}
	},
	mounted() {
		this.loadChats()
		this.setupWebSocketListener()
	},
	beforeUnmount() {
		uni.$off('ws:message', this.handleWebSocketMessage)
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
			if (typeof value === 'object' && value !== null) {
				if (value.seconds) {
					return value.seconds * 1000 + Math.floor((value.nanos || 0) / 1e6)
				}
			}
			return Date.now()
		},

		async loadChats() {
			if (this.isLoading) return
			this.isLoading = true

			try {
				const friendApi = await import('@/api/friend.js')
				const chatApi = await import('@/api/chat.js')
				const groupApi = await import('@/api/group.js')

				// 获取好友列表
				const friendResponse = await friendApi.default.getFriendList(1, 100)
				const friends = friendResponse.success && friendResponse.data ? (friendResponse.data.friends || []) : []

				// 获取群组列表
				const groupResponse = await groupApi.default.getUserGroups()
				const groups = groupResponse.success && groupResponse.data ? (groupResponse.data.groups || []) : []

				// 获取未读消息数量
				const unreadResponse = await chatApi.default.getUnreadCount()
				const unreadByUser = unreadResponse.success && unreadResponse.data ? (unreadResponse.data.unread_by_user || {}) : {}

				// 为每个好友获取最后一条消息
				const friendChatPromises = friends.map(async (friend) => {
					const friendId = friend.id || friend.friend_id
					try {
						const historyResponse = await chatApi.default.getMessageHistory({ otherUserId: friendId, page: 1, pageSize: 1 })
						let lastMessage = ''
						let lastMessageTime = Date.now()

						if (historyResponse.success && historyResponse.data) {
							const messages = historyResponse.data.messages || historyResponse.data.Messages || []
							if (messages.length > 0) {
								const msg = messages[messages.length - 1]
								lastMessage = msg.content || ''
								lastMessageTime = this.normalizeTimestamp(msg.created_at)
							}
						}

						return {
							id: friendId,
							type: 'private', // 私聊
							name: friend.remark || friend.name || '未知',
							avatar: friend.avatar || friend.friend_avatar || '/static/default-avatar.png',
							lastMessage: lastMessage,
							lastMessageTime: lastMessageTime,
							unreadCount: unreadByUser[friendId] || 0
						}
					} catch (error) {
						console.error(`获取好友 ${friendId} 的消息历史失败:`, error)
						return {
							id: friendId,
							type: 'private',
							name: friend.remark || friend.name || '未知',
							avatar: friend.avatar || friend.friend_avatar || '/static/default-avatar.png',
							lastMessage: '',
							lastMessageTime: Date.now(),
							unreadCount: unreadByUser[friendId] || 0
						}
					}
				})

				// 为每个群组获取最后一条消息
				const groupChatPromises = groups.map(async (group) => {
					const groupId = group.id || group.group_id
					try {
						const historyResponse = await chatApi.default.getMessageHistory({ groupId: groupId, page: 1, pageSize: 1 })
						let lastMessage = ''
						let lastMessageTime = Date.now()

						if (historyResponse.success && historyResponse.data) {
							const messages = historyResponse.data.messages || historyResponse.data.Messages || []
							if (messages.length > 0) {
								const msg = messages[messages.length - 1]
								lastMessage = msg.content || ''
								lastMessageTime = this.normalizeTimestamp(msg.created_at)
							}
						}

						return {
							id: groupId,
							type: 'group', // 群聊
							name: group.name || '未知群组',
							avatar: group.avatar || '/static/default-avatar.png',
							lastMessage: lastMessage,
							lastMessageTime: lastMessageTime,
							unreadCount: 0, // 群聊未读数量暂时设为0
							memberCount: group.member_count || 0
						}
					} catch (error) {
						console.error(`获取群组 ${groupId} 的消息历史失败:`, error)
						return {
							id: groupId,
							type: 'group',
							name: group.name || '未知群组',
							avatar: group.avatar || '/static/default-avatar.png',
							lastMessage: '',
							lastMessageTime: Date.now(),
							unreadCount: 0,
							memberCount: group.member_count || 0
						}
					}
				})

				const friendChatList = await Promise.all(friendChatPromises)
				const groupChatList = await Promise.all(groupChatPromises)
				const allChats = [...friendChatList, ...groupChatList]
				allChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
				this.chats = allChats
			} catch (error) {
				console.error('加载聊天列表失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		},

		setupWebSocketListener() {
			uni.$on('ws:message', this.handleWebSocketMessage)
		},

		handleWebSocketMessage(data) {
			const userInfo = uni.getStorageSync('userInfo')
			if (!userInfo || !userInfo.id) {
				return
			}

			const currentUserId = Number(userInfo.id)
			const fromUserId = Number(data.from_user_id ?? data.fromUserId)
			const toUserId = Number(data.to_user_id ?? data.toUserId)
			const groupId = Number(data.group_id ?? data.groupId)

			// 判断是群聊还是私聊
			if (groupId && groupId > 0) {
				// 群聊消息：找到对应的群组并更新
				const chatIndex = this.chats.findIndex(chat => chat.type === 'group' && Number(chat.id) === groupId)
				if (chatIndex >= 0) {
					this.chats[chatIndex].lastMessage = data.content || ''
					this.chats[chatIndex].lastMessageTime = this.normalizeTimestamp(data.created_at)
					this.chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
				} else {
					// 如果是新群组，重新加载列表
					this.loadChats()
				}
			} else if (toUserId === currentUserId) {
				// 私聊消息：判断是否是发给当前用户的消息
				const friendId = fromUserId
				const chatIndex = this.chats.findIndex(chat => chat.type === 'private' && Number(chat.id) === friendId)

				if (chatIndex >= 0) {
					// 更新最后一条消息
					this.chats[chatIndex].lastMessage = data.content || ''
					this.chats[chatIndex].lastMessageTime = this.normalizeTimestamp(data.created_at)
					// 增加未读数量
					this.chats[chatIndex].unreadCount = (this.chats[chatIndex].unreadCount || 0) + 1
					// 重新排序
					this.chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
				} else {
					// 如果是新好友，重新加载列表
					this.loadChats()
				}
			}
		},

		onSearch() {
			// 搜索功能
		},

		openChat(chat) {
			// 跳转到聊天详情页
			if (chat.type === 'group') {
				// 群聊
				uni.navigateTo({
					url: `/pages/chat/chat-detail?groupId=${chat.id}&groupName=${chat.name}`
				})
			} else {
				// 私聊
				uni.navigateTo({
					url: `/pages/chat/chat-detail?friendId=${chat.id}&friendName=${chat.name}`
				})
			}
		},
		
		formatTime(timestamp) {
			const time = this.normalizeTimestamp(timestamp)
			const now = Date.now()
			const diff = now - time
			
			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				const date = new Date(time)
				return `${date.getMonth() + 1}/${date.getDate()}`
			}
		}
	}
}
</script>

<style scoped>
.chat-tab {
	height: 100%;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
}

.search-bar {
	padding: 20rpx;
	background: white;
	border-bottom: 1rpx solid #eee;
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.search-input {
	flex: 1;
	display: flex;
	align-items: center;
	background: #f8f8f8;
	border-radius: 20rpx;
	padding: 0 20rpx;
	height: 70rpx;
}

.input {
	flex: 1;
	margin-left: 10rpx;
	font-size: 28rpx;
}

.chat-list {
	flex: 1;
	background: white;
}

.chat-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background-color 0.2s;
}

.chat-item:active {
	background-color: #f8f8f8;
}

.avatar {
	position: relative;
	margin-right: 20rpx;
}

.avatar-img {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
}

.unread-badge {
	position: absolute;
	top: -5rpx;
	right: -5rpx;
	background: #ff4757;
	color: white;
	font-size: 20rpx;
	padding: 2rpx 8rpx;
	border-radius: 20rpx;
	min-width: 30rpx;
	text-align: center;
}

.chat-info {
	flex: 1;
	overflow: hidden;
}

.chat-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}

.chat-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.chat-time {
	font-size: 24rpx;
	color: #999;
}

.chat-preview {
	overflow: hidden;
}

.last-message {
	font-size: 28rpx;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 400rpx;
	color: #999;
}

.empty-text {
	margin-top: 20rpx;
	font-size: 28rpx;
}
</style>
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
			chats: [
				// 模拟聊天数据
				{
					id: 1,
					name: '张三',
					avatar: '/static/avatar1.png',
					lastMessage: '你好，最近怎么样？',
					lastMessageTime: Date.now() - 1000 * 60 * 30, // 30分钟前
					unreadCount: 2
				},
				{
					id: 2,
					name: '李四',
					avatar: '/static/avatar2.png',
					lastMessage: '好的，明天见',
					lastMessageTime: Date.now() - 1000 * 60 * 60 * 2, // 2小时前
					unreadCount: 0
				},
				{
					id: 3,
					name: '王五',
					avatar: '/static/avatar3.png',
					lastMessage: '谢谢你的帮助',
					lastMessageTime: Date.now() - 1000 * 60 * 60 * 24, // 1天前
					unreadCount: 1
				}
			]
		}
	},
	computed: {
		filteredChats() {
			if (!this.searchKeyword) {
				return this.chats
			}
			return this.chats.filter(chat => 
				chat.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
				chat.lastMessage.toLowerCase().includes(this.searchKeyword.toLowerCase())
			)
		}
	},
	methods: {
		onSearch() {
			// 搜索功能
		},
		
		openChat(chat) {
			// 跳转到聊天详情页
			uni.navigateTo({
				url: `/pages/chat/chat-detail?chatId=${chat.id}&name=${chat.name}`
			})
		},
		
		formatTime(timestamp) {
			const now = Date.now()
			const diff = now - timestamp
			
			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				const date = new Date(timestamp)
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
}

.search-input {
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
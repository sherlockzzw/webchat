<template>
	<view class="contact-tab">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<uni-icons type="search" size="18" color="#999"></uni-icons>
				<input 
					v-model="searchKeyword" 
					placeholder="搜索" 
					class="input"
					@input="onSearch"
				/>
			</view>
		</view>
		
		<!-- 功能入口区域 -->
		<view class="function-section">
			<view class="function-item" @click="friendRequests">
				<view class="function-icon">
					<uni-icons type="person-add" size="28" color="#07c160"></uni-icons>
				</view>
				<text class="function-text">新的朋友</text>
				<view v-if="unreadRequests > 0" class="function-badge">{{ unreadRequests }}</view>
				<uni-icons type="right" size="16" color="#c0c0c0"></uni-icons>
			</view>
			
			<view class="function-item" @click="groupChat">
				<view class="function-icon">
					<uni-icons type="chatbubble" size="28" color="#07c160"></uni-icons>
				</view>
				<text class="function-text">群聊</text>
				<uni-icons type="right" size="16" color="#c0c0c0"></uni-icons>
			</view>
			
			<view class="function-item" @click="tags">
				<view class="function-icon">
					<uni-icons type="bookmark" size="28" color="#07c160"></uni-icons>
				</view>
				<text class="function-text">标签</text>
				<uni-icons type="right" size="16" color="#c0c0c0"></uni-icons>
			</view>
		</view>
		
		<!-- 好友列表 -->
		<scroll-view class="friend-list" scroll-y>
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
			
			<view 
				v-for="friend in filteredFriends" 
				:key="friend.id"
				class="friend-item"
				@click="openFriendProfile(friend)"
			>
				<view class="avatar">
					<image 
						:src="friend.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHZpZXdCb3g9IjAgMCA4OCA4OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDQiIGN5PSI0NCIgcj0iNDQiIGZpbGw9IiNGNUY1RjUiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTI0IDIwQzI2LjIwOTEgMjAgMjggMjEuNzkwOSAyOCAyNEMyOCAyNi4yMDkxIDI2LjIwOTEgMjggMjQgMjhDMjEuNzkwOSAyOCAyMCAyNi4yMDkxIDIwIDI0QzIwIDIxLjc5MDkgMjEuNzkwOSAyMCAyNCAyMFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTI0IDMyQzI5LjUyMjggMzIgMzQgMzYuNDc3MiAzNCA0MkgxNEMxNCAzNi40NzcyIDE4LjQ3NzIgMzIgMjQgMzJaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo8L3N2Zz4K'" 
						class="avatar-img"
						@error="handleImageError"
					></image>
					<view v-if="friend.isOnline" class="online-status"></view>
				</view>
				
				<view class="friend-info">
					<view class="friend-header">
						<text class="friend-name">{{ friend.remark || friend.name }}</text>
						<text class="friend-status">{{ friend.isOnline ? '在线' : '离线' }}</text>
					</view>
					<view class="friend-desc">
						<text class="friend-signature">{{ friend.signature || '这个人很懒，什么都没有写' }}</text>
					</view>
				</view>
				
				<view class="friend-actions">
					<text class="chat-icon" @click.stop="startChat(friend)">💬</text>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="filteredFriends.length === 0" class="empty-state">
				<text class="empty-icon">👥</text>
				<text class="empty-text">暂无好友</text>
				<button class="add-friend-btn" @click="addFriend">添加好友</button>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	name: 'ContactTab',
	data() {
		return {
			searchKeyword: '',
			unreadRequests: 0,
			friends: [],
			loading: false
		}
	},
	mounted() {
		console.log('ContactTab: mounted 生命周期触发')
		this.loadFriends()
		this.loadUnreadRequests()
	},
	computed: {
		filteredFriends() {
			if (!this.searchKeyword) {
				return this.friends
			}
			return this.friends.filter(friend => 
				friend.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
				(friend.remark && friend.remark.toLowerCase().includes(this.searchKeyword.toLowerCase()))
			)
		}
	},
	methods: {
		// 加载好友列表
		async loadFriends() {
			console.log('ContactTab: 开始加载好友列表')
			this.loading = true
			try {
				const friendApi = await import('@/api/friend.js')
				console.log('ContactTab: 调用API获取好友列表')
				const response = await friendApi.default.getFriendList(1, 50)
				console.log('ContactTab: API响应:', response)
				
				if (response.success) {
					// 映射后端字段到前端期望的字段
					this.friends = (response.data.friends || []).map(friend => ({
						id: friend.id,
						name: friend.name,
						remark: friend.remark || '',
						avatar: friend.avatar || '/static/default-avatar.png',
						signature: friend.signature || '',
						isOnline: friend.is_online || false,
						isBlocked: friend.is_blocked || false
					}))
					console.log('ContactTab: 映射后的好友数据:', this.friends)
					console.log('ContactTab: 第一个好友的头像URL:', this.friends[0]?.avatar)
				} else {
					uni.showToast({
						title: response.message || '加载好友列表失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载好友列表失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 加载未读申请数量
		async loadUnreadRequests() {
			try {
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.getFriendRequests(1, 1)
				
				if (response.success) {
					this.unreadRequests = response.data.total_count || 0
				}
			} catch (error) {
				console.error('加载未读申请数量失败:', error)
			}
		},
		
		onSearch() {
			// 搜索功能 - 本地搜索
		},
		
		addFriend() {
			// 跳转到添加好友页面
			uni.navigateTo({
				url: '/pages/friend/add-friend'
			})
		},
		
		friendRequests() {
			// 跳转到好友申请页面
			uni.navigateTo({
				url: '/pages/friend/friend-requests'
			})
		},
		
		groupChat() {
			uni.navigateTo({
				url: '/pages/group/group-list'
			})
		},
		
		tags() {
			// 标签功能（暂时显示提示）
			uni.showToast({
				title: '标签功能开发中',
				icon: 'none'
			})
		},
		
		openFriendProfile(friend) {
			// 跳转到好友资料页面
			uni.navigateTo({
				url: `/pages/friend/friend-profile?friendId=${friend.id}`
			})
		},
		
		startChat(friend) {
			// 开始聊天
			uni.navigateTo({
				url: `/pages/chat/chat-detail?chatId=${friend.id}&name=${friend.remark || friend.name}`
			})
		},
		
		handleImageError(e) {
			console.log('头像加载失败:', e)
			console.log('失败的图片URL:', e.target?.src)
			// 可以在这里设置默认头像
		}
	}
}
</script>

<style scoped>
.contact-tab {
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

.function-section {
	background: white;
	margin-bottom: 20rpx;
}

.function-item {
	display: flex;
	align-items: center;
	padding: 24rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	position: relative;
	transition: background-color 0.2s ease;
}

.function-item:active {
	background-color: #f5f5f5;
}

.function-item:last-child {
	border-bottom: none;
}

.function-icon {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f0f0f0;
	border-radius: 8rpx;
	margin-right: 20rpx;
}

.function-text {
	flex: 1;
	font-size: 32rpx;
	color: #333;
	font-weight: 400;
}

.function-badge {
	background: #ff3b30;
	color: white;
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	min-width: 32rpx;
	text-align: center;
	margin-right: 10rpx;
}

.friend-list {
	flex: 1;
	background: white;
}

.friend-item {
	display: flex;
	align-items: center;
	padding: 24rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background-color 0.2s;
	position: relative;
}

.friend-item:active {
	background-color: #f5f5f5;
}

.friend-item:last-child {
	border-bottom: none;
}

.avatar {
	position: relative;
	margin-right: 24rpx;
}

.avatar-img {
	width: 88rpx;
	height: 88rpx;
	border-radius: 8rpx;
}

.online-status {
	position: absolute;
	bottom: 4rpx;
	right: 4rpx;
	width: 18rpx;
	height: 18rpx;
	background: #07c160;
	border-radius: 50%;
	border: 3rpx solid white;
}

.friend-info {
	flex: 1;
	overflow: hidden;
}

.friend-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}

.friend-name {
	font-size: 34rpx;
	font-weight: 500;
	color: #333;
	line-height: 1.2;
}

.friend-status {
	font-size: 22rpx;
	color: #999;
}

.friend-desc {
	overflow: hidden;
}

.friend-signature {
	font-size: 28rpx;
	color: #999;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.friend-actions {
	padding: 10rpx;
}

.chat-icon {
	font-size: 32rpx;
	color: #007AFF;
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
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	margin: 20rpx 0;
	font-size: 28rpx;
}

.add-friend-btn {
	margin-top: 20rpx;
	padding: 15rpx 30rpx;
	background: #007AFF;
	color: white;
	border-radius: 25rpx;
	font-size: 28rpx;
	border: none;
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40rpx 20rpx;
}

.loading-spinner {
	width: 40rpx;
	height: 40rpx;
	border: 4rpx solid #f3f3f3;
	border-top: 4rpx solid #007AFF;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.loading-text {
	font-size: 28rpx;
	color: #999;
	margin-top: 20rpx;
}
</style>
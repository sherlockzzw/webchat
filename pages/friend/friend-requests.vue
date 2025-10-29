<template>
	<view class="friend-requests-page">
		<!-- 申请列表 -->
		<scroll-view class="requests-list" scroll-y>
			<view 
				v-for="request in friendRequests" 
				:key="request.id"
				class="request-item"
			>
				<view class="user-avatar">
					<image :src="request.avatar || '/static/logo.png'" class="avatar-img"></image>
				</view>
				
				<view class="request-content">
					<view class="user-info">
						<text class="user-name">{{ request.name }}</text>
						<text class="request-time">{{ formatTime(request.created_at) }}</text>
					</view>
					<text class="request-message">{{ request.message || '请求添加您为好友' }}</text>
				</view>
				
				<view class="request-actions">
					<button 
						class="action-btn reject-btn" 
						@click="handleRequest(request.id, 'reject')"
						:disabled="request.processing"
					>
						拒绝
					</button>
					<button 
						class="action-btn accept-btn" 
						@click="handleRequest(request.id, 'accept')"
						:disabled="request.processing"
					>
						同意
					</button>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="friendRequests.length === 0" class="empty-state">
				<text class="empty-icon">👥</text>
				<text class="empty-text">暂无好友申请</text>
				<text class="empty-desc">当有人申请添加您为好友时，会显示在这里</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			friendRequests: []
		}
	},
	onLoad() {
		this.loadFriendRequests()
	},
	methods: {
		// 加载好友申请列表
		async loadFriendRequests() {
			try {
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.getFriendRequests()
				
				if (response.success) {
					// 映射后端字段到前端期望的字段
					this.friendRequests = (response.data.requests || []).map(request => ({
						id: request.id,
						name: request.from_user_name || '未知用户',
						avatar: request.from_user_avatar || '/static/logo.png',
						message: request.message || '请求添加您为好友',
						created_at: request.created_at,
						status: request.status,
						processing: false
					}))
				} else {
					uni.showToast({
						title: response.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载好友申请失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 处理好友申请
		async handleRequest(requestId, action) {
			const request = this.friendRequests.find(r => r.id === requestId)
			if (!request) return
			
			request.processing = true
			
			try {
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.handleFriendRequest(requestId, action)
				
				if (response.success) {
					uni.showToast({
						title: action === 'accept' ? '已同意申请' : '已拒绝申请',
						icon: 'success'
					})
					
					// 从列表中移除
					this.friendRequests = this.friendRequests.filter(r => r.id !== requestId)
				} else {
					uni.showToast({
						title: response.message || '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('处理好友申请失败:', error)
				uni.showToast({
					title: '操作失败，请重试',
					icon: 'none'
				})
			} finally {
				request.processing = false
			}
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return '未知时间'
			
			// 处理字符串格式的时间（如 "2025-10-29 18:05:36"）
			let date
			if (typeof timestamp === 'string') {
				// 如果是字符串格式，直接解析
				date = new Date(timestamp)
			} else {
				// 如果是数字时间戳，按原逻辑处理
				date = new Date(timestamp)
			}
			
			// 检查日期是否有效
			if (isNaN(date.getTime())) {
				return '无效时间'
			}
			
			const now = new Date().getTime()
			const diff = now - date.getTime()
			
			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				return `${date.getMonth() + 1}月${date.getDate()}日`
			}
		}
	}
}
</script>

<style scoped>
.friend-requests-page {
	height: 100vh;
	background: #f5f5f5;
}

.requests-list {
	height: 100%;
	padding: 20rpx;
}

.request-item {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
	margin-right: 20rpx;
}

.avatar-img {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
}

.request-content {
	flex: 1;
	margin-right: 20rpx;
}

.user-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.user-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.request-time {
	font-size: 24rpx;
	color: #999;
}

.request-message {
	font-size: 28rpx;
	color: #666;
}

.request-actions {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.action-btn {
	width: 120rpx;
	height: 60rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	border: none;
}

.reject-btn {
	background: #f5f5f5;
	color: #666;
}

.accept-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.action-btn:disabled {
	opacity: 0.5;
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
	font-size: 24rpx;
}
</style>

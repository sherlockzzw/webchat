<template>
	<view class="friend-profile-page">
		<!-- 用户信息卡片 -->
		<view class="user-card">
			<view class="user-avatar">
				<image :src="friendInfo.avatar || '/static/logo.png'" class="avatar-img"></image>
				<view v-if="friendInfo.is_online" class="online-indicator"></view>
			</view>
			<view class="user-info">
				<text class="user-name">{{ friendInfo.name || '未知用户' }}</text>
				<text class="user-id">ID: {{ friendInfo.id || '未知' }}</text>
				<view class="online-status">
					<text v-if="friendInfo.is_online" class="online-text">在线</text>
					<text v-else class="offline-text">离线</text>
				</view>
			</view>
		</view>
		
		<!-- 详细信息 -->
		<view class="info-section">
			<view class="info-item">
				<text class="info-label">手机号</text>
				<text class="info-value">{{ friendInfo.phone || '未设置' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">邮箱</text>
				<text class="info-value">{{ friendInfo.email || '未设置' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">设备信息</text>
				<text class="info-value">{{ friendInfo.device_info || '未知' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">添加时间</text>
				<text class="info-value">{{ formatTime(friendInfo.created_at) }}</text>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="action-section">
			<button class="action-btn chat-btn" @click="startChat">
				<text class="btn-icon">💬</text>
				<text class="btn-text">开始聊天</text>
			</button>
			<button class="action-btn remark-btn" @click="setRemark">
				<text class="btn-icon">✏️</text>
				<text class="btn-text">设置备注</text>
			</button>
			<button class="action-btn block-btn" @click="toggleBlock">
				<text class="btn-icon">{{ friendInfo.is_blocked ? '🔓' : '🚫' }}</text>
				<text class="btn-text">{{ friendInfo.is_blocked ? '取消屏蔽' : '屏蔽好友' }}</text>
			</button>
			<button class="action-btn delete-btn" @click="deleteFriend">
				<text class="btn-icon">🗑️</text>
				<text class="btn-text">删除好友</text>
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			friendId: '',
			friendInfo: {}
		}
	},
	onLoad(options) {
		this.friendId = options.friendId
		if (this.friendId) {
			this.loadFriendInfo()
		}
	},
	methods: {
		// 加载好友信息
		async loadFriendInfo() {
			try {
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.getFriendDetail(this.friendId)
				
				if (response.success) {
					this.friendInfo = response.data
				} else {
					uni.showToast({
						title: response.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载好友信息失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 开始聊天
		startChat() {
			uni.navigateTo({
				url: `/pages/chat/chat-detail?friendId=${this.friendId}&friendName=${this.friendInfo.name}`
			})
		},
		
		// 设置备注
		setRemark() {
			uni.showModal({
				title: '设置备注',
				editable: true,
				placeholderText: '请输入备注名称',
				success: async (res) => {
					if (res.confirm && res.content) {
						try {
							const friendApi = await import('@/api/friend.js')
							const response = await friendApi.default.setFriendRemark(this.friendId, res.content)
							
							if (response.success) {
								uni.showToast({
									title: '设置成功',
									icon: 'success'
								})
								this.friendInfo.remark = res.content
							} else {
								uni.showToast({
									title: response.message || '设置失败',
									icon: 'none'
								})
							}
						} catch (error) {
							console.error('设置备注失败:', error)
							uni.showToast({
								title: '设置失败，请重试',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		// 切换屏蔽状态
		async toggleBlock() {
			const action = this.friendInfo.is_blocked ? '取消屏蔽' : '屏蔽'
			uni.showModal({
				title: `确认${action}`,
				content: `确定要${action}这个好友吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const friendApi = await import('@/api/friend.js')
							const response = await friendApi.default.blockFriend(this.friendId, !this.friendInfo.is_blocked)
							
							if (response.success) {
								uni.showToast({
									title: `${action}成功`,
									icon: 'success'
								})
								this.friendInfo.is_blocked = !this.friendInfo.is_blocked
							} else {
								uni.showToast({
									title: response.message || `${action}失败`,
									icon: 'none'
								})
							}
						} catch (error) {
							console.error(`${action}失败:`, error)
							uni.showToast({
								title: `${action}失败，请重试`,
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		// 删除好友
		deleteFriend() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个好友吗？删除后将无法恢复。',
				success: async (res) => {
					if (res.confirm) {
						try {
							const friendApi = await import('@/api/friend.js')
							const response = await friendApi.default.deleteFriend(this.friendId)
							
							if (response.success) {
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								
								// 返回上一页
								setTimeout(() => {
									uni.navigateBack()
								}, 1500)
							} else {
								uni.showToast({
									title: response.message || '删除失败',
									icon: 'none'
								})
							}
						} catch (error) {
							console.error('删除好友失败:', error)
							uni.showToast({
								title: '删除失败，请重试',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return '未知'
			
			const date = new Date(timestamp)
			return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
		}
	}
}
</script>

<style scoped>
.friend-profile-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 30rpx;
}

.user-card {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
	position: relative;
	margin-right: 30rpx;
}

.avatar-img {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
}

.online-indicator {
	position: absolute;
	bottom: 5rpx;
	right: 5rpx;
	width: 24rpx;
	height: 24rpx;
	background: #4CAF50;
	border-radius: 50%;
	border: 4rpx solid white;
}

.user-info {
	flex: 1;
}

.user-name {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.user-id {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 10rpx;
}

.online-status {
	font-size: 24rpx;
}

.online-text {
	color: #4CAF50;
}

.offline-text {
	color: #999;
}

.info-section {
	background: white;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: #666;
}

.info-value {
	font-size: 28rpx;
	color: #333;
}

.action-section {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
	border-radius: 20rpx;
	font-size: 30rpx;
	border: none;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.chat-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.remark-btn {
	background: white;
	color: #333;
}

.block-btn {
	background: #ff9800;
	color: white;
}

.delete-btn {
	background: #ff4757;
	color: white;
}

.btn-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.btn-text {
	font-size: 30rpx;
}
</style>

<template>
	<view class="profile-tab">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-state">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 可滚动内容区域 -->
		<scroll-view v-else class="content-scroll" scroll-y>
			<!-- 用户信息卡片 -->
			<view class="user-card">
			<view class="user-avatar" @click="changeAvatar">
				<image 
					:src="userInfo.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxzdmcgeD0iMzAiIHk9IjMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0zMCAzMEMzMy4zMTM3IDMwIDM2IDMyLjY4NjMgMzYgMzZDMzYgMzkuMzEzNyAzMy4zMTM3IDQyIDMwIDQyQzI2LjY4NjMgNDIgMjQgMzkuMzEzNyAyNCAzNkMyNCAzMi42ODYzIDI2LjY4NjMgMzAgMzAgMzBaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0zMCA0NEMzNy43MzI0IDQ0IDQ0IDM3LjczMjQgNDQgMzBINEM0IDM3LjczMjQgMTAuMjY3NiA0NCAxOCA0NEgzMFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='" 
					class="avatar-img"
					@error="handleImageError"
				></image>
			</view>
			<view class="user-info">
				<text class="user-name">{{ userInfo.name || '未设置' }}</text>
				<text class="user-id">ID: {{ userInfo.id || '未知' }}</text>
				<text v-if="userInfo.phone" class="user-phone">手机: {{ userInfo.phone }}</text>
				<text v-if="userInfo.email" class="user-email">邮箱: {{ userInfo.email }}</text>
				<text class="user-signature">{{ userInfo.signature || '这个人很懒，什么都没有写' }}</text>
			</view>
			<view class="edit-btn" @click="editProfile">
				<uni-icons type="compose" size="20" color="#007AFF"></uni-icons>
			</view>
		</view>
		
		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-item" @click="goToSettings">
				<view class="menu-icon">
					<uni-icons type="gear" size="20" color="#007AFF"></uni-icons>
				</view>
				<text class="menu-text">设置</text>
				<uni-icons type="right" size="16" color="#ccc"></uni-icons>
			</view>
			
			<view class="menu-item" @click="goToPrivacy">
				<view class="menu-icon">
					<uni-icons type="locked" size="20" color="#007AFF"></uni-icons>
				</view>
				<text class="menu-text">隐私与安全</text>
				<uni-icons type="right" size="16" color="#ccc"></uni-icons>
			</view>
			
			<view class="menu-item" @click="goToNotification">
				<view class="menu-icon">
					<uni-icons type="notification" size="20" color="#007AFF"></uni-icons>
				</view>
				<text class="menu-text">通知设置</text>
				<uni-icons type="right" size="16" color="#ccc"></uni-icons>
			</view>
		</view>
		
		<view class="menu-section">
			<view class="menu-item" @click="goToHelp">
				<view class="menu-icon">
					<uni-icons type="help" size="20" color="#007AFF"></uni-icons>
				</view>
				<text class="menu-text">帮助与反馈</text>
				<uni-icons type="right" size="16" color="#ccc"></uni-icons>
			</view>
			
			<view class="menu-item" @click="goToAbout">
				<view class="menu-icon">
					<uni-icons type="info" size="20" color="#007AFF"></uni-icons>
				</view>
				<text class="menu-text">关于我们</text>
				<uni-icons type="right" size="16" color="#ccc"></uni-icons>
			</view>
		</view>
		</scroll-view>
		
		<!-- 退出登录 - 固定在底部 -->
		<view class="logout-section">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ProfileTab',
	data() {
		return {
			userInfo: {},
			loading: false
		}
	},
	onLoad() {
		console.log('ProfileTab onLoad 触发')
		this.loadUserInfo()
	},
	onShow() {
		console.log('ProfileTab onShow 触发')
		this.loadUserInfo()
	},
	mounted() {
		console.log('ProfileTab mounted 触发')
		this.loadUserInfo()
	},
	methods: {
		// 加载用户信息
		async loadUserInfo() {
			console.log('ProfileTab: 开始加载用户信息')
			this.loading = true
			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.getUserInfo()
				console.log('ProfileTab: 用户信息API响应:', response)
				
				if (response.success) {
					this.userInfo = response.data.user
					console.log('ProfileTab: 更新后的用户信息:', this.userInfo)
					
					// 同时更新本地存储
					uni.setStorageSync('userInfo', this.userInfo)
				} else {
					console.error('ProfileTab: 获取用户信息失败:', response.message)
					// 如果API失败，尝试从本地存储获取
					const localUserInfo = uni.getStorageSync('userInfo')
					if (localUserInfo) {
						this.userInfo = localUserInfo
						console.log('ProfileTab: 使用本地存储的用户信息:', this.userInfo)
					}
				}
			} catch (error) {
				console.error('ProfileTab: 加载用户信息失败:', error)
				// 如果API失败，尝试从本地存储获取
				const localUserInfo = uni.getStorageSync('userInfo')
				if (localUserInfo) {
					this.userInfo = localUserInfo
					console.log('ProfileTab: 使用本地存储的用户信息:', this.userInfo)
				}
			} finally {
				this.loading = false
			}
		},
		
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0]
					// 这里可以上传头像到服务器
					uni.showToast({
						title: '头像上传功能开发中',
						icon: 'none'
					})
				}
			})
		},
		
		editProfile() {
			uni.showModal({
				title: '编辑资料',
				content: '编辑资料功能开发中',
				showCancel: false
			})
		},
		
		goToSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			})
		},
		
		goToPrivacy() {
			uni.showToast({
				title: '隐私设置功能开发中',
				icon: 'none'
			})
		},
		
		goToNotification() {
			uni.showToast({
				title: '通知设置功能开发中',
				icon: 'none'
			})
		},
		
		goToHelp() {
			uni.showToast({
				title: '帮助功能开发中',
				icon: 'none'
			})
		},
		
		goToAbout() {
			uni.showModal({
				title: '关于我们',
				content: 'GoChat v1.0.0\n\n一个基于uni-app开发的即时通讯应用',
				showCancel: false
			})
		},
		
		logout() {
			uni.showModal({
				title: '确认退出',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除本地存储
						uni.removeStorageSync('userInfo')
						uni.removeStorageSync('token')
						uni.removeStorageSync('tokenExpire')
						
						// 跳转到登录页
						uni.reLaunch({
							url: '/pages/login/login'
						})
					}
				}
			})
		},
		
		handleImageError(e) {
			console.log('头像加载失败:', e)
			console.log('失败的图片URL:', e.target?.src)
		}
	}
}
</script>

<style scoped>
.profile-tab {
	height: 100%;
	background: #f5f5f5;
	padding: 20rpx;
	display: flex;
	flex-direction: column;
}

.content-scroll {
	flex: 1;
	overflow: hidden;
}

.user-card {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
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
	color: #999;
	margin-bottom: 8rpx;
}

.user-phone, .user-email {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.user-signature {
	display: block;
	font-size: 26rpx;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.edit-btn {
	padding: 10rpx;
}

.menu-section {
	background: white;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx 40rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background-color 0.2s;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item:active {
	background-color: #f8f8f8;
}

.menu-icon {
	width: 40rpx;
	margin-right: 20rpx;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.logout-section {
	background: #f5f5f5;
	padding: 20rpx 0;
	margin-top: auto;
	flex-shrink: 0;
}

.logout-btn {
	width: 100%;
	height: 80rpx;
	background: #ff4757;
	color: white;
	border-radius: 20rpx;
	font-size: 32rpx;
	border: none;
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 400rpx;
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
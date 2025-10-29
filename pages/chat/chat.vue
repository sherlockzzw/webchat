<template>
	<view class="chat-container">
		<view class="chat-header">
			<text class="chat-title">GoChat</text>
			<text class="user-info">欢迎，{{ userInfo.nickname || userInfo.username }}</text>
		</view>
		
		<view class="chat-content">
			<view class="welcome-message">
				<text class="welcome-text">欢迎使用GoChat！</text>
				<text class="welcome-desc">登录成功，您可以开始聊天了</text>
			</view>
		</view>
		
		<view class="chat-footer">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userInfo: {}
		}
	},
	async onLoad() {
		// 获取用户信息
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			this.userInfo = userInfo
		} else {
			// 如果没有用户信息，跳转到登录页
			uni.reLaunch({
				url: '/pages/login/login'
			})
		}
		
		// 检查登录状态
		try {
			const userApi = await import('@/api/user.js')
			if (!userApi.default.checkLoginStatus()) {
				uni.reLaunch({
					url: '/pages/login/login'
				})
			}
		} catch (error) {
			console.error('检查登录状态失败:', error)
		}
	},
	methods: {
		async handleLogout() {
			uni.showModal({
				title: '确认退出',
				content: '确定要退出登录吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							// 使用API服务清除登录状态
							const userApi = await import('@/api/user.js')
							userApi.default.logout()
							
							// 跳转到登录页
							uni.reLaunch({
								url: '/pages/login/login'
							})
						} catch (error) {
							console.error('退出登录失败:', error)
							// 即使API调用失败，也要清除本地存储
							uni.removeStorageSync('userInfo')
							uni.removeStorageSync('token')
							uni.removeStorageSync('tokenExpire')
							
							uni.reLaunch({
								url: '/pages/login/login'
							})
						}
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.chat-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
}

.chat-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx 30rpx;
	color: white;
	text-align: center;
}

.chat-title {
	display: block;
	font-size: 40rpx;
	font-weight: 800;
	margin-bottom: 10rpx;
	letter-spacing: 2rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	text-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.2);
}

.user-info {
	display: block;
	font-size: 24rpx;
	opacity: 0.8;
}

.chat-content {
	flex: 1;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.welcome-message {
	text-align: center;
}

.welcome-text {
	display: block;
	font-size: 32rpx;
	color: #333;
	margin-bottom: 20rpx;
	font-weight: bold;
}

.welcome-desc {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.chat-footer {
	padding: 30rpx;
	background: white;
	border-top: 1rpx solid #eee;
}

.logout-btn {
	width: 100%;
	height: 80rpx;
	background: #ff4757;
	color: white;
	font-size: 30rpx;
	border: none;
	border-radius: 10rpx;
}
</style>

<template>
	<view class="login-container">
		<view class="login-box">
			<view class="logo-section">
				<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				<text class="app-title">GoChat</text>
				<text class="app-subtitle">欢迎回来</text>
			</view>
			
			<view class="form-section">
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">👤</text>
						<input 
							class="input-field" 
							type="text" 
							v-model="username" 
							placeholder="请输入用户名"
							placeholder-style="color: #999;"
						/>
					</view>
				</view>
				
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input 
							class="input-field" 
							type="password" 
							v-model="password" 
							placeholder="请输入密码"
							placeholder-style="color: #999;"
						/>
					</view>
				</view>
				
				<button 
					class="login-btn" 
					:class="{ 'login-btn-disabled': !canLogin }"
					:disabled="!canLogin"
					@click="handleLogin"
				>
					登录
				</button>
				
				<view class="register-link">
					<text class="register-text">还没有账号？</text>
					<text class="register-btn" @click="goToRegister">立即注册</text>
				</view>
			</view>
		</view>
		
		<!-- 加载提示 -->
		<view v-if="loading" class="loading-overlay">
			<view class="loading-content">
				<text class="loading-text">登录中...</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			username: '',
			password: '',
			loading: false
		}
	},
	computed: {
		canLogin() {
			return this.username.trim() !== '' && this.password.trim() !== '' && !this.loading
		}
	},
	methods: {
		async handleLogin() {
			if (!this.canLogin) return
			
			this.loading = true
			
			try {
				// 调用登录API
				const result = await this.loginApi()
				
				// 调试信息
				console.log('登录结果:', result)
				
				if (result.success) {
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 用户信息和token已在API服务中保存到本地存储
					
					// 跳转到主页面
					console.log('准备跳转到主页面')
					
					// 尝试多种跳转方式
					setTimeout(() => {
						// 方法1: 使用navigateTo
						uni.navigateTo({
							url: '/pages/main/main',
							success: () => {
								console.log('navigateTo跳转到主页面成功')
							},
							fail: (err) => {
								console.error('navigateTo跳转到主页面失败:', err)
								
								// 方法2: 使用reLaunch
								uni.reLaunch({
									url: '/pages/main/main',
									success: () => {
										console.log('reLaunch跳转到主页面成功')
									},
									fail: (err2) => {
										console.error('reLaunch也失败:', err2)
										
										// 方法3: 使用window.location强制跳转
										try {
											console.log('尝试使用window.location跳转')
											window.location.href = '#/pages/main/main'
										} catch (e) {
											console.error('window.location也失败:', e)
										}
									}
								})
							}
						})
					}, 100)
				} else {
					console.log('登录失败:', result.message)
					uni.showToast({
						title: result.message || '登录失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('登录错误:', error)
				uni.showToast({
					title: '网络错误，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 调用真实登录API
		async loginApi() {
			// 导入用户API服务
			const userApi = await import('@/api/user.js')
			return await userApi.default.login(this.username, this.password)
		},
		
		goToRegister() {
			uni.navigateTo({
				url: '/pages/register/register'
			})
		}
	}
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.login-box {
	width: 100%;
	max-width: 600rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10rpx);
}

.logo-section {
	text-align: center;
	margin-bottom: 60rpx;
}

.logo {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 20rpx;
}

.app-title {
	display: block;
	font-size: 52rpx;
	font-weight: 800;
	color: #333;
	margin-bottom: 10rpx;
	letter-spacing: 3rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	text-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
	position: relative;
}

.app-title::after {
	content: '';
	position: absolute;
	bottom: -8rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: linear-gradient(90deg, #667eea, #764ba2);
	border-radius: 2rpx;
}

.app-subtitle {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.form-section {
	width: 100%;
}

.input-group {
	margin-bottom: 30rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 0 20rpx;
	border: 2rpx solid #e9ecef;
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	border-color: #667eea;
	background: #fff;
	box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
}

.input-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	color: #666;
}

.input-field {
	flex: 1;
	height: 88rpx;
	font-size: 32rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
}

.login-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	border-radius: 12rpx;
	margin-top: 40rpx;
	transition: all 0.3s ease;
}

.login-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 8rpx rgba(102, 126, 234, 0.3);
}

.login-btn-disabled {
	background: #ccc !important;
	color: #999 !important;
	transform: none !important;
	box-shadow: none !important;
}

.register-link {
	text-align: center;
	margin-top: 40rpx;
}

.register-text {
	font-size: 28rpx;
	color: #666;
}

.register-btn {
	font-size: 28rpx;
	color: #667eea;
	margin-left: 10rpx;
	text-decoration: underline;
}

.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.loading-content {
	background: white;
	padding: 40rpx;
	border-radius: 12rpx;
	text-align: center;
}

.loading-text {
	font-size: 28rpx;
	color: #333;
}
</style>

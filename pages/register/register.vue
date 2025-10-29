<template>
	<view class="register-container">
		<!-- 顶部装饰 -->
		<view class="header-decoration">
			<view class="decoration-circle circle-1"></view>
			<view class="decoration-circle circle-2"></view>
			<view class="decoration-circle circle-3"></view>
		</view>

		<!-- 注册表单 -->
		<view class="register-form">
			<view class="form-header">
				<text class="welcome-text">欢迎注册</text>
				<text class="subtitle">创建您的账号，开始聊天之旅</text>
			</view>

			<view class="form-content">
				<!-- 用户名输入 -->
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">👤</text>
						<input
							class="form-input"
							type="text"
							v-model="formData.username"
							placeholder="请输入用户名"
							placeholder-style="color: #999;"
							maxlength="20"
						/>
					</view>
				</view>

				<!-- 手机号输入 -->
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">📱</text>
						<input
							class="form-input"
							type="number"
							v-model="formData.phone"
							placeholder="请输入手机号"
							placeholder-style="color: #999;"
							maxlength="11"
						/>
					</view>
				</view>

				<!-- 邮箱输入 -->
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">📧</text>
						<input
							class="form-input"
							type="text"
							v-model="formData.email"
							placeholder="请输入邮箱（可选）"
							placeholder-style="color: #999;"
						/>
					</view>
				</view>

				<!-- 密码输入 -->
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input
							class="form-input"
							:type="showPassword ? 'text' : 'password'"
							v-model="formData.password"
							placeholder="请输入密码"
							placeholder-style="color: #999;"
							maxlength="20"
						/>
						<text class="password-toggle" @click="togglePassword">
							{{ showPassword ? '👁️' : '👁️‍🗨️' }}
						</text>
					</view>
				</view>

				<!-- 确认密码输入 -->
				<view class="input-group">
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input
							class="form-input"
							:type="showConfirmPassword ? 'text' : 'password'"
							v-model="formData.confirmPassword"
							placeholder="请确认密码"
							placeholder-style="color: #999;"
							maxlength="20"
						/>
						<text class="password-toggle" @click="toggleConfirmPassword">
							{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
						</text>
					</view>
				</view>

				<!-- 注册按钮 -->
				<button
					class="register-btn"
					:class="{ 'disabled': !canRegister || loading }"
					:disabled="!canRegister || loading"
					@click="handleRegister"
				>
					<text v-if="loading" class="loading-text">注册中...</text>
					<text v-else class="btn-text">立即注册</text>
				</button>

				<!-- 登录链接 -->
				<view class="login-link">
					<text class="link-text">已有账号？</text>
					<text class="link-btn" @click="goToLogin">立即登录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			formData: {
				username: '',
				phone: '',
				email: '',
				password: '',
				confirmPassword: ''
			},
			showPassword: false,
			showConfirmPassword: false,
			loading: false
		}
	},
	computed: {
		canRegister() {
			return this.formData.username.length > 0 &&
				   this.formData.phone.length > 0 &&
				   this.formData.password.length > 0 &&
				   this.formData.confirmPassword.length > 0 &&
				   this.formData.password === this.formData.confirmPassword
		}
	},
	methods: {
		// 切换密码显示
		togglePassword() {
			this.showPassword = !this.showPassword
		},
		
		// 切换确认密码显示
		toggleConfirmPassword() {
			this.showConfirmPassword = !this.showConfirmPassword
		},

		// 处理注册
		async handleRegister() {
			if (!this.canRegister || this.loading) return

			// 验证手机号格式
			if (!this.validatePhone(this.formData.phone)) {
				uni.showToast({
					title: '请输入正确的手机号',
					icon: 'none'
				})
				return
			}

			// 验证邮箱格式（如果填写了）
			if (this.formData.email && !this.validateEmail(this.formData.email)) {
				uni.showToast({
					title: '请输入正确的邮箱格式',
					icon: 'none'
				})
				return
			}

			// 验证密码强度
			if (this.formData.password.length < 6) {
				uni.showToast({
					title: '密码长度至少6位',
					icon: 'none'
				})
				return
			}

			this.loading = true

			try {
				// 调用注册API
				const result = await this.registerApi()

				if (result.success) {
					uni.showToast({
						title: '注册成功',
						icon: 'success'
					})

					// 延迟跳转到登录页面
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}, 1500)
				} else {
					uni.showToast({
						title: result.message || '注册失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('注册错误:', error)
				uni.showToast({
					title: '网络错误，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		// 调用注册API
		async registerApi() {
			const userApi = await import('@/api/user.js')
			return await userApi.default.register(
				this.formData.username,
				this.formData.phone,
				this.formData.email,
				this.formData.password
			)
		},

		// 验证手机号
		validatePhone(phone) {
			const phoneRegex = /^1[3-9]\d{9}$/
			return phoneRegex.test(phone)
		},

		// 验证邮箱
		validateEmail(email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			return emailRegex.test(email)
		},

		// 跳转到登录页面
		goToLogin() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.register-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	position: relative;
	overflow: hidden;
}

.header-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 200rpx;
	overflow: hidden;
}

.decoration-circle {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
	width: 200rpx;
	height: 200rpx;
	top: -100rpx;
	right: -50rpx;
}

.circle-2 {
	width: 150rpx;
	height: 150rpx;
	top: 50rpx;
	left: -75rpx;
}

.circle-3 {
	width: 100rpx;
	height: 100rpx;
	top: 100rpx;
	right: 100rpx;
}

.register-form {
	position: relative;
	z-index: 1;
	padding: 100rpx 60rpx 60rpx;
}

.form-header {
	text-align: center;
	margin-bottom: 80rpx;
}

.welcome-text {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: white;
	margin-bottom: 20rpx;
}

.subtitle {
	display: block;
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
}

.form-content {
	background: white;
	border-radius: 30rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.input-group {
	margin-bottom: 40rpx;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 25rpx;
	padding: 0 30rpx;
	height: 100rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	border-color: #667eea;
	background: white;
	box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.1);
}

.input-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	color: #666;
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #333;
	height: 60rpx;
	line-height: 60rpx;
}

.password-toggle {
	font-size: 32rpx;
	color: #666;
	padding: 10rpx;
}

.register-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 25rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	margin-top: 40rpx;
	box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
}

.register-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 5rpx 15rpx rgba(102, 126, 234, 0.3);
}

.register-btn.disabled {
	background: #ccc;
	box-shadow: none;
}

.btn-text {
	font-size: 32rpx;
}

.loading-text {
	font-size: 28rpx;
}

.login-link {
	text-align: center;
	margin-top: 40rpx;
}

.link-text {
	font-size: 28rpx;
	color: #666;
}

.link-btn {
	font-size: 28rpx;
	color: #667eea;
	margin-left: 10rpx;
	font-weight: bold;
}
</style>

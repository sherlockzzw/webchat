<template>
	<view class="edit-profile-page">
		<view class="profile-header">
			<view class="avatar-section" @click="changeAvatar">
				<image 
					:src="formData.avatar || defaultAvatar" 
					class="avatar-img"
					mode="aspectFill"
				></image>
				<view class="avatar-mask">
					<uni-icons type="camera" size="30" color="#fff"></uni-icons>
					<text class="mask-text">更换头像</text>
				</view>
			</view>
		</view>

		<view class="form-section">
			<view class="form-item">
				<text class="form-label">昵称</text>
				<input 
					class="form-input" 
					v-model="formData.name" 
					placeholder="请输入昵称"
					maxlength="20"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">手机号</text>
				<input 
					class="form-input" 
					v-model="formData.phone" 
					placeholder="请输入手机号"
					type="number"
					maxlength="11"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">邮箱</text>
				<input 
					class="form-input" 
					v-model="formData.email" 
					placeholder="请输入邮箱"
					type="text"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">个性签名</text>
				<textarea 
					class="form-textarea" 
					v-model="formData.signature" 
					placeholder="请输入个性签名"
					maxlength="100"
				></textarea>
			</view>
		</view>

		<view class="button-section">
			<button class="save-btn" @click="saveProfile" :disabled="saving">
				{{ saving ? '保存中...' : '保存' }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			formData: {
				name: '',
				phone: '',
				email: '',
				avatar: '',
				signature: ''
			},
			defaultAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxzdmcgeD0iMzAiIHk9IjMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0zMCAzMEMzMy4zMTM3IDMwIDM2IDMyLjY4NjMgMzYgMzZDMzYgMzkuMzEzNyAzMy4zMTM3IDQyIDMwIDQyQzI2LjY4NjMgNDIgMjQgMzkuMzEzNyAyNCAzNkMyNCAzMi42ODYzIDI2LjY4NjMgMzAgMzAgMzBaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0zMCA0NEMzNy43MzI0IDQ0IDQ0IDM3LjczMjQgNDQgMzBINEM0IDM3LjczMjQgMTAuMjY3NiA0NCAxOCA0NEgzMFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo=',
			saving: false
		}
	},
	onLoad() {
		this.loadUserInfo()
	},
	methods: {
		async loadUserInfo() {
			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.getUserInfo()
				
				if (response.success && response.data.user) {
					const user = response.data.user
					this.formData = {
						name: user.name || '',
						phone: user.phone || '',
						email: user.email || '',
						avatar: user.avatar || '',
						signature: user.signature || ''
					}
				}
			} catch (error) {
				console.error('加载用户信息失败:', error)
				// 从本地存储加载
				const localUserInfo = uni.getStorageSync('userInfo')
				if (localUserInfo) {
					this.formData = {
						name: localUserInfo.name || '',
						phone: localUserInfo.phone || '',
						email: localUserInfo.email || '',
						avatar: localUserInfo.avatar || '',
						signature: localUserInfo.signature || ''
					}
				}
			}
		},

		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					const tempFilePath = res.tempFilePaths[0]
					uni.showLoading({ title: '上传中...' })
					
					try {
						// 上传头像
						const chatApi = await import('@/api/chat.js')
						const uploadResult = await chatApi.default.uploadFile(tempFilePath, 'image')
						
						uni.hideLoading()
						
						if (uploadResult.success && uploadResult.data.file_url) {
							this.formData.avatar = uploadResult.data.file_url
							uni.showToast({
								title: '头像上传成功',
								icon: 'success'
							})
						} else {
							uni.showToast({
								title: uploadResult.message || '头像上传失败',
								icon: 'none'
							})
						}
					} catch (error) {
						uni.hideLoading()
						console.error('上传头像失败:', error)
						uni.showToast({
							title: '上传失败，请重试',
							icon: 'none'
						})
					}
				},
				fail: (error) => {
					console.error('选择图片失败:', error)
				}
			})
		},

		async saveProfile() {
			if (this.saving) return

			// 验证
			if (!this.formData.name || this.formData.name.trim() === '') {
				uni.showToast({
					title: '请输入昵称',
					icon: 'none'
				})
				return
			}

			this.saving = true
			uni.showLoading({ title: '保存中...' })

			try {
				const userApi = await import('@/api/user.js')
				const response = await userApi.default.updateProfile({
					name: this.formData.name.trim(),
					phone: this.formData.phone.trim(),
					email: this.formData.email.trim(),
					avatar: this.formData.avatar,
					signature: this.formData.signature.trim()
				})

				uni.hideLoading()
				this.saving = false

				if (response.success) {
					// 更新本地存储
					if (response.data.user) {
						uni.setStorageSync('userInfo', response.data.user)
					}

					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})

					// 延迟返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					uni.showToast({
						title: response.message || '保存失败',
						icon: 'none'
					})
				}
			} catch (error) {
				uni.hideLoading()
				this.saving = false
				console.error('保存资料失败:', error)
				uni.showToast({
					title: '保存失败，请重试',
					icon: 'none'
				})
			}
		}
	}
}
</script>

<style scoped>
.edit-profile-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

.profile-header {
	background: white;
	padding: 60rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar-section {
	position: relative;
	width: 200rpx;
	height: 200rpx;
}

.avatar-img {
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	border: 4rpx solid #f0f0f0;
}

.avatar-mask {
	position: absolute;
	top: 0;
	left: 0;
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	opacity: 0;
	transition: opacity 0.3s;
}

.avatar-section:active .avatar-mask {
	opacity: 1;
}

.mask-text {
	color: white;
	font-size: 24rpx;
	margin-top: 10rpx;
}

.form-section {
	background: white;
	margin-bottom: 20rpx;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 30rpx 40rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
	border-bottom: none;
}

.form-label {
	width: 160rpx;
	font-size: 30rpx;
	color: #333;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.form-textarea {
	flex: 1;
	font-size: 30rpx;
	color: #333;
	min-height: 120rpx;
	padding: 10rpx 0;
}

.button-section {
	padding: 40rpx;
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	color: white;
	border-radius: 44rpx;
	font-size: 32rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.save-btn:disabled {
	background: #ccc;
}
</style>


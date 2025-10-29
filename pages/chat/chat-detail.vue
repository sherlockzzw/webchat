<template>
	<view class="chat-detail-page">
		<!-- 消息列表 -->
		<scroll-view 
			class="message-list" 
			scroll-y 
			:scroll-top="scrollTop"
			scroll-with-animation
		>
			<view 
				v-for="message in messages" 
				:key="message.id"
				class="message-item"
				:class="{ 'is-self': message.is_self }"
			>
				<view class="message-avatar" v-if="!message.is_self">
					<image :src="friendInfo.avatar || '/static/logo.png'" class="avatar-img"></image>
				</view>
				
				<view class="message-content">
					<view class="message-bubble">
						<text class="message-text">{{ message.content }}</text>
					</view>
					<text class="message-time">{{ formatTime(message.created_at) }}</text>
				</view>
				
				<view class="message-avatar" v-if="message.is_self">
					<image :src="userInfo.avatar || '/static/logo.png'" class="avatar-img"></image>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="messages.length === 0" class="empty-state">
				<text class="empty-icon">💬</text>
				<text class="empty-text">开始聊天吧</text>
				<text class="empty-desc">发送第一条消息开始你们的对话</text>
			</view>
		</scroll-view>
		
		<!-- 输入框 -->
		<view class="input-section">
			<view class="input-wrapper">
				<view class="input-actions">
					<text class="action-icon" @click="showMoreActions">➕</text>
				</view>
				<input 
					class="message-input" 
					type="text" 
					v-model="inputMessage" 
					placeholder="输入消息..."
					placeholder-style="color: #999;"
					@confirm="sendMessage"
				/>
				<button 
					class="send-btn" 
					:class="{ 'can-send': inputMessage.trim() }"
					:disabled="!inputMessage.trim()"
					@click="sendMessage"
				>
					发送
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			friendId: '',
			friendName: '',
			friendInfo: {},
			userInfo: {},
			messages: [],
			inputMessage: '',
			scrollTop: 0
		}
	},
	onLoad(options) {
		this.friendId = options.friendId
		this.friendName = options.friendName
		
		// 设置导航栏标题
		uni.setNavigationBarTitle({
			title: this.friendName || '聊天'
		})
		
		// 获取用户信息
		this.userInfo = uni.getStorageSync('userInfo') || {}
		
		// 加载聊天记录
		this.loadMessages()
	},
	methods: {
		// 加载聊天记录
		async loadMessages() {
			try {
				const chatApi = await import('@/api/chat.js')
				const response = await chatApi.default.getMessageHistory(this.friendId)
				
				if (response.success) {
					this.messages = response.data || []
					// 滚动到底部
					this.$nextTick(() => {
						this.scrollToBottom()
					})
				} else {
					uni.showToast({
						title: response.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载聊天记录失败:', error)
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 发送消息
		async sendMessage() {
			if (!this.inputMessage.trim()) return
			
			const messageContent = this.inputMessage.trim()
			this.inputMessage = ''
			
			// 添加消息到列表（乐观更新）
			const tempMessage = {
				id: Date.now(),
				content: messageContent,
				is_self: true,
				created_at: new Date().getTime(),
				status: 'sending'
			}
			this.messages.push(tempMessage)
			
			// 滚动到底部
			this.scrollToBottom()
			
			try {
				const chatApi = await import('@/api/chat.js')
				const response = await chatApi.default.sendMessage({
					toUserId: this.friendId,
					content: messageContent,
					messageType: 'text'
				})
				
				if (response.success) {
					// 更新消息状态
					tempMessage.status = 'sent'
					tempMessage.id = response.data.id
				} else {
					// 发送失败，显示错误状态
					tempMessage.status = 'failed'
					uni.showToast({
						title: response.message || '发送失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('发送消息失败:', error)
				tempMessage.status = 'failed'
				uni.showToast({
					title: '发送失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 滚动到底部
		scrollToBottom() {
			this.scrollTop = this.messages.length * 100
		},
		
		// 显示更多操作
		showMoreActions() {
			uni.showActionSheet({
				itemList: ['图片', '文件', '语音'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.selectImage()
					} else if (res.tapIndex === 1) {
						this.selectFile()
					} else if (res.tapIndex === 2) {
						this.startVoiceRecord()
					}
				}
			})
		},
		
		// 选择图片
		selectImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					// TODO: 上传图片并发送
					uni.showToast({
						title: '图片发送功能开发中',
						icon: 'none'
					})
				}
			})
		},
		
		// 选择文件
		selectFile() {
			// TODO: 实现文件选择
			uni.showToast({
				title: '文件发送功能开发中',
				icon: 'none'
			})
		},
		
		// 开始语音录制
		startVoiceRecord() {
			// TODO: 实现语音录制
			uni.showToast({
				title: '语音发送功能开发中',
				icon: 'none'
			})
		},
		
		// 格式化时间
		formatTime(timestamp) {
			const date = new Date(timestamp)
			const now = new Date()
			const diff = now.getTime() - timestamp
			
			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
			}
		}
	}
}
</script>

<style scoped>
.chat-detail-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
}

.message-list {
	flex: 1;
	padding: 20rpx;
}

.message-item {
	display: flex;
	margin-bottom: 30rpx;
	align-items: flex-start;
}

.message-item.is-self {
	flex-direction: row-reverse;
}

.message-avatar {
	margin: 0 20rpx;
}

.avatar-img {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
}

.message-content {
	flex: 1;
	max-width: 70%;
}

.message-bubble {
	background: white;
	border-radius: 20rpx;
	padding: 20rpx 25rpx;
	margin-bottom: 10rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.message-item.is-self .message-bubble {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.4;
}

.message-item.is-self .message-text {
	color: white;
}

.message-time {
	font-size: 20rpx;
	color: #999;
	display: block;
	text-align: right;
}

.message-item.is-self .message-time {
	text-align: left;
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

.input-section {
	background: white;
	border-top: 1rpx solid #eee;
	padding: 20rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 25rpx;
	padding: 0 20rpx;
	height: 80rpx;
}

.input-actions {
	margin-right: 15rpx;
}

.action-icon {
	font-size: 32rpx;
	color: #666;
	padding: 10rpx;
}

.message-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
}

.send-btn {
	background: #ddd;
	color: #999;
	border: none;
	border-radius: 20rpx;
	padding: 15rpx 25rpx;
	font-size: 24rpx;
	margin-left: 15rpx;
	transition: all 0.3s ease;
}

.send-btn.can-send {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}
</style>

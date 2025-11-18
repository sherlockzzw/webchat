<template>
	<view class="create-group-page">
		<!-- 群组信息 -->
		<view class="group-info-section">
			<view class="group-avatar-section" @click="changeAvatar">
				<image :src="groupAvatar || '/static/default-avatar.png'" class="group-avatar"></image>
				<view class="avatar-edit-icon">📷</view>
			</view>
			<view class="group-name-section">
				<text class="label">群名称</text>
				<input 
					v-model="groupName" 
					placeholder="请输入群名称" 
					class="group-name-input"
					maxlength="20"
				/>
			</view>
		</view>

		<!-- 选择成员 -->
		<view class="members-section">
			<view class="section-header">
				<text class="section-title">选择成员</text>
				<text class="member-count">已选择 {{ selectedMembers.length }} 人</text>
			</view>

			<!-- 已选成员列表 -->
			<view v-if="selectedMembers.length > 0" class="selected-members">
				<view 
					v-for="member in selectedMembers" 
					:key="member.id"
					class="selected-member-item"
					@click="removeMember(member.id)"
				>
					<image :src="member.avatar || '/static/default-avatar.png'" class="member-avatar"></image>
					<text class="member-name">{{ member.name }}</text>
					<text class="remove-icon">×</text>
				</view>
			</view>

			<!-- 好友列表 -->
			<scroll-view class="friend-list" scroll-y>
				<view 
					v-for="friend in friends" 
					:key="friend.id"
					class="friend-item"
					:class="{ 'selected': isSelected(friend.id) }"
					@click="toggleMember(friend)"
				>
					<image :src="friend.avatar || '/static/default-avatar.png'" class="friend-avatar"></image>
					<text class="friend-name">{{ friend.remark || friend.name }}</text>
					<view v-if="isSelected(friend.id)" class="check-icon">✓</view>
				</view>

				<view v-if="friends.length === 0" class="empty-state">
					<text class="empty-text">暂无好友，请先添加好友</text>
				</view>
			</scroll-view>
		</view>

		<!-- 创建按钮 -->
		<view class="footer">
			<button 
				class="create-btn" 
				:class="{ 'disabled': !canCreate }"
				:disabled="!canCreate"
				@click="createGroup"
			>
				创建群组
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			groupName: '',
			groupAvatar: '',
			friends: [],
			selectedMembers: [],
			isLoading: false
		}
	},
	computed: {
		canCreate() {
			return this.groupName.trim().length > 0 && this.selectedMembers.length > 0 && !this.isLoading
		}
	},
	onLoad() {
		const prefillMembers = uni.getStorageSync('prefillGroupMembers')
		if (prefillMembers && prefillMembers.length) {
			this.selectedMembers = prefillMembers.map(member => ({
				id: member.id,
				name: member.name,
				avatar: member.avatar
			}))
			uni.removeStorageSync('prefillGroupMembers')
		}
		this.loadFriends()
	},
	methods: {
		async loadFriends() {
			try {
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.getFriendList(1, 100)
				if (response.success && response.data && response.data.friends) {
					this.friends = response.data.friends || []
				}
			} catch (error) {
				console.error('加载好友列表失败:', error)
				uni.showToast({
					title: '加载好友列表失败',
					icon: 'none'
				})
			}
		},

		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					const tempFilePath = res.tempFilePaths[0]
					// 上传头像
					try {
						const chatApi = await import('@/api/chat.js')
						const uploadResult = await chatApi.default.uploadFile(tempFilePath, 'image')
						if (uploadResult.success && uploadResult.data) {
							this.groupAvatar = uploadResult.data.file_url || ''
						} else {
							uni.showToast({
								title: uploadResult.message || '上传失败',
								icon: 'none'
							})
						}
					} catch (error) {
						console.error('上传头像失败:', error)
						uni.showToast({
							title: '上传头像失败',
							icon: 'none'
						})
					}
				}
			})
		},

		isSelected(friendId) {
			return this.selectedMembers.some(m => m.id === friendId)
		},

		toggleMember(friend) {
			const index = this.selectedMembers.findIndex(m => m.id === friend.id)
			if (index >= 0) {
				// 已选择，移除
				this.selectedMembers.splice(index, 1)
			} else {
				// 未选择，添加
				this.selectedMembers.push({
					id: friend.id || friend.friend_id,
					name: friend.remark || friend.name,
					avatar: friend.avatar || friend.friend_avatar
				})
			}
		},

		removeMember(memberId) {
			const index = this.selectedMembers.findIndex(m => m.id === memberId)
			if (index >= 0) {
				this.selectedMembers.splice(index, 1)
			}
		},

		async createGroup() {
			if (!this.canCreate) {
				return
			}

			this.isLoading = true
			try {
				const groupApi = await import('@/api/group.js')
				const memberIds = this.selectedMembers.map(m => m.id)
				
				const response = await groupApi.default.createGroup({
					name: this.groupName.trim(),
					avatar: this.groupAvatar,
					memberIds: memberIds
				})

				if (response.success && response.data && response.data.group) {
					uni.showToast({
						title: '创建成功',
						icon: 'success'
					})
					
					// 延迟跳转到群聊页面
					setTimeout(() => {
						const groupId = response.data.group.id
						const groupName = response.data.group.name
						uni.navigateTo({
							url: `/pages/chat/chat-detail?groupId=${groupId}&groupName=${groupName}`
						})
					}, 1500)
				} else {
					uni.showToast({
						title: response.message || response.msg || '创建失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('创建群组失败:', error)
				uni.showToast({
					title: '创建群组失败',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		}
	}
}
</script>

<style scoped>
.create-group-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 120rpx;
}

.group-info-section {
	background: white;
	padding: 40rpx;
	margin-bottom: 20rpx;
}

.group-avatar-section {
	display: flex;
	justify-content: center;
	margin-bottom: 40rpx;
	position: relative;
}

.group-avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: #f0f0f0;
}

.avatar-edit-icon {
	position: absolute;
	bottom: 0;
	right: calc(50% - 80rpx + 100rpx);
	width: 50rpx;
	height: 50rpx;
	background: #007AFF;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: white;
}

.group-name-section {
	display: flex;
	align-items: center;
}

.label {
	font-size: 32rpx;
	color: #333;
	margin-right: 20rpx;
	width: 120rpx;
}

.group-name-input {
	flex: 1;
	font-size: 32rpx;
	padding: 20rpx;
	background: #f8f8f8;
	border-radius: 10rpx;
}

.members-section {
	background: white;
	padding: 30rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.member-count {
	font-size: 28rpx;
	color: #999;
}

.selected-members {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	margin-bottom: 30rpx;
	padding-bottom: 30rpx;
	border-bottom: 1rpx solid #eee;
}

.selected-member-item {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 120rpx;
}

.member-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: #f0f0f0;
}

.member-name {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.remove-icon {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background: #ff3b30;
	border-radius: 50%;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	line-height: 1;
}

.friend-list {
	max-height: 800rpx;
}

.friend-item {
	display: flex;
	align-items: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	position: relative;
}

.friend-item.selected {
	background: #f0f8ff;
}

.friend-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #f0f0f0;
	margin-right: 20rpx;
}

.friend-name {
	flex: 1;
	font-size: 32rpx;
	color: #333;
}

.check-icon {
	width: 50rpx;
	height: 50rpx;
	background: #007AFF;
	border-radius: 50%;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: bold;
}

.empty-state {
	padding: 100rpx 0;
	text-align: center;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	padding: 20rpx;
	border-top: 1rpx solid #eee;
}

.create-btn {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	color: white;
	border-radius: 10rpx;
	font-size: 32rpx;
	border: none;
}

.create-btn.disabled {
	background: #ccc;
	color: #999;
}
</style>


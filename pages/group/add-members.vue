<template>
	<view class="add-members-page">
		<!-- 已选成员 -->
		<view v-if="selectedMembers.length > 0" class="selected-section">
			<view class="section-header">
				<text class="section-title">已选择 {{ selectedMembers.length }} 人</text>
				<text class="clear-btn" @click="clearSelected">清空</text>
			</view>
			<view class="selected-members">
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
		</view>

		<!-- 好友列表 -->
		<view class="friends-section">
			<view class="section-header">
				<text class="section-title">选择好友</text>
			</view>
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

		<!-- 添加按钮 -->
		<view class="footer">
			<button 
				class="add-btn" 
				:class="{ 'disabled': !canAdd }"
				:disabled="!canAdd"
				@click="addMembers"
			>
				添加成员
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			groupId: 0,
			friends: [],
			selectedMembers: [],
			existingMembers: [], // 已在群组中的成员ID列表
			isLoading: false
		}
	},
	computed: {
		canAdd() {
			return this.selectedMembers.length > 0 && !this.isLoading
		}
	},
	onLoad(options) {
		if (options.groupId) {
			this.groupId = parseInt(options.groupId)
			this.loadFriends()
			this.loadGroupMembers()
		}
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

		async loadGroupMembers() {
			try {
				const groupApi = await import('@/api/group.js')
				const response = await groupApi.default.getGroupInfo(this.groupId)
				if (response.success && response.data && response.data.members) {
					this.existingMembers = response.data.members.map(m => Number(m.user_id))
				}
			} catch (error) {
				console.error('加载群成员失败:', error)
			}
		},

		isSelected(friendId) {
			return this.selectedMembers.some(m => m.id === friendId)
		},

		isInGroup(friendId) {
			return this.existingMembers.includes(Number(friendId))
		},

		toggleMember(friend) {
			// 检查是否已在群组中
			if (this.isInGroup(friend.id)) {
				uni.showToast({
					title: '该用户已在群组中',
					icon: 'none'
				})
				return
			}

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

		clearSelected() {
			this.selectedMembers = []
		},

		async addMembers() {
			if (!this.canAdd) {
				return
			}

			this.isLoading = true
			try {
				const groupApi = await import('@/api/group.js')
				const userIds = this.selectedMembers.map(m => m.id)
				
				const response = await groupApi.default.addGroupMembers(this.groupId, userIds)

				if (response.success) {
					const addedCount = response.data.added_count || 0
					const failedCount = response.data.failed_user_ids ? response.data.failed_user_ids.length : 0
					
					if (addedCount > 0) {
						uni.showToast({
							title: `成功添加 ${addedCount} 位成员`,
							icon: 'success'
						})
						
						// 延迟返回
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					} else if (failedCount > 0) {
						uni.showToast({
							title: '所选成员已在群组中',
							icon: 'none'
						})
					} else {
						uni.showToast({
							title: response.message || response.msg || '添加失败',
							icon: 'none'
						})
					}
				} else {
					uni.showToast({
						title: response.message || response.msg || '添加失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('添加群成员失败:', error)
				uni.showToast({
					title: '添加群成员失败',
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
.add-members-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 120rpx;
}

.selected-section {
	background: white;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.clear-btn {
	font-size: 28rpx;
	color: #007AFF;
}

.selected-members {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
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

.friends-section {
	background: white;
	padding: 30rpx;
}

.friend-list {
	max-height: 1000rpx;
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

.add-btn {
	width: 100%;
	height: 88rpx;
	background: #007AFF;
	color: white;
	border-radius: 10rpx;
	font-size: 32rpx;
	border: none;
}

.add-btn.disabled {
	background: #ccc;
	color: #999;
}
</style>


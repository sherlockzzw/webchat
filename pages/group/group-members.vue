<template>
	<view class="group-members-page">
		<!-- 群组信息 -->
		<view class="group-header">
			<image :src="groupInfo.avatar || '/static/default-avatar.png'" class="group-avatar"></image>
			<text class="group-name">{{ groupInfo.name || '未知群组' }}</text>
			<text class="group-count">{{ groupInfo.member_count || 0 }}人</text>
		</view>

		<!-- 操作按钮 -->
		<view class="actions-section">
			<view class="action-btn" @click="addMembers">
				<text class="action-icon">➕</text>
				<text class="action-text">添加成员</text>
			</view>
		</view>

		<!-- 成员列表 -->
		<scroll-view class="members-list" scroll-y>
			<view 
				v-for="member in members" 
				:key="member.id"
				class="member-item"
			>
				<image :src="member.user_avatar || '/static/default-avatar.png'" class="member-avatar"></image>
				<view class="member-info">
					<view class="member-header">
						<text class="member-name">{{ member.nickname || member.user_name || '未知' }}</text>
						<text v-if="member.role === 'owner'" class="member-role owner">群主</text>
						<text v-else-if="member.role === 'admin'" class="member-role admin">管理员</text>
						<text v-if="member.is_online" class="online-badge">在线</text>
					</view>
					<text class="member-phone" v-if="member.user_phone">{{ member.user_phone }}</text>
				</view>
				<view v-if="canManage(member)" class="member-actions">
					<text class="action-text" @click="removeMember(member)">移除</text>
				</view>
			</view>

			<view v-if="members.length === 0" class="empty-state">
				<text class="empty-text">暂无成员</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			groupId: 0,
			groupInfo: {},
			members: [],
			userInfo: {},
			userRole: ''
		}
	},
	onLoad(options) {
		if (options.groupId) {
			this.groupId = parseInt(options.groupId)
			this.loadGroupInfo()
			this.loadMembers()
		}
		this.userInfo = uni.getStorageSync('userInfo') || {}
	},
	methods: {
		async loadGroupInfo() {
			try {
				const groupApi = await import('@/api/group.js')
				const response = await groupApi.default.getGroupInfo(this.groupId)
				if (response.success && response.data && response.data.group) {
					this.groupInfo = response.data.group
				}
			} catch (error) {
				console.error('加载群组信息失败:', error)
			}
		},

		async loadMembers() {
			try {
				const groupApi = await import('@/api/group.js')
				const response = await groupApi.default.getGroupInfo(this.groupId)
				if (response.success && response.data) {
					this.members = response.data.members || []
					
					// 获取当前用户的角色
					const currentUserId = Number(this.userInfo.id)
					const currentMember = this.members.find(m => Number(m.user_id) === currentUserId)
					if (currentMember) {
						this.userRole = currentMember.role
					}
				}
			} catch (error) {
				console.error('加载成员列表失败:', error)
				uni.showToast({
					title: '加载成员列表失败',
					icon: 'none'
				})
			}
		},

		canManage(member) {
			// 只有群主和管理员可以管理成员
			if (this.userRole !== 'owner' && this.userRole !== 'admin') {
				return false
			}
			// 不能移除群主
			if (member.role === 'owner') {
				return false
			}
			// 管理员不能移除其他管理员（只有群主可以）
			if (this.userRole === 'admin' && member.role === 'admin') {
				return false
			}
			// 不能移除自己
			if (Number(member.user_id) === Number(this.userInfo.id)) {
				return false
			}
			return true
		},

		async addMembers() {
			// 跳转到添加成员页面（可以选择好友）
			uni.navigateTo({
				url: `/pages/group/add-members?groupId=${this.groupId}`
			})
		},

		async removeMember(member) {
			if (!this.canManage(member)) {
				return
			}

			uni.showModal({
				title: '确认移除',
				content: `确定要移除成员"${member.nickname || member.user_name}"吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const groupApi = await import('@/api/group.js')
							const response = await groupApi.default.removeGroupMember(this.groupId, member.user_id)
							
							if (response.success) {
								uni.showToast({
									title: '移除成功',
									icon: 'success'
								})
								// 重新加载成员列表
								this.loadMembers()
								this.loadGroupInfo()
							} else {
								uni.showToast({
									title: response.message || response.msg || '移除失败',
									icon: 'none'
								})
							}
						} catch (error) {
							console.error('移除成员失败:', error)
							uni.showToast({
								title: '移除成员失败',
								icon: 'none'
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
.group-members-page {
	min-height: 100vh;
	background: #f5f5f5;
}

.group-header {
	background: white;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;
}

.group-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: #f0f0f0;
	margin-bottom: 20rpx;
}

.group-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.group-count {
	font-size: 28rpx;
	color: #999;
}

.actions-section {
	background: white;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #f8f8f8;
	border-radius: 10rpx;
}

.action-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
}

.action-text {
	font-size: 32rpx;
	color: #007AFF;
}

.members-list {
	background: white;
	padding: 0 30rpx;
}

.member-item {
	display: flex;
	align-items: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.member-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #f0f0f0;
	margin-right: 20rpx;
}

.member-info {
	flex: 1;
}

.member-header {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
}

.member-name {
	font-size: 32rpx;
	color: #333;
	margin-right: 10rpx;
}

.member-role {
	font-size: 24rpx;
	padding: 4rpx 12rpx;
	border-radius: 4rpx;
	margin-right: 10rpx;
}

.member-role.owner {
	background: #ffd700;
	color: #333;
}

.member-role.admin {
	background: #007AFF;
	color: white;
}

.online-badge {
	font-size: 24rpx;
	color: #4cd964;
}

.member-phone {
	font-size: 28rpx;
	color: #999;
}

.member-actions {
	padding: 10rpx 20rpx;
}

.member-actions .action-text {
	font-size: 28rpx;
	color: #ff3b30;
}

.empty-state {
	padding: 100rpx 0;
	text-align: center;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>


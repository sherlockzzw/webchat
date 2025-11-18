<template>
	<view class="group-list-page">
		<view class="header">
			<text class="title">我的群聊</text>
			<button class="create-btn" @click="createGroup">发起群聊</button>
		</view>

		<scroll-view scroll-y class="group-scroll">
			<view v-if="loading" class="loading-state">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>

			<view
				v-for="group in groups"
				:key="group.id"
				class="group-item"
				@click="openGroup(group)"
			>
				<image :src="getAvatar(group.avatar)" class="group-avatar" />
				<view class="group-info">
					<view class="group-name">{{ group.name }}</view>
					<view class="group-desc">{{ group.member_count || 0 }}人</view>
				</view>
				<uni-icons type="right" size="18" color="#ccc"></uni-icons>
			</view>

			<view v-if="!loading && groups.length === 0" class="empty-state">
				<text class="empty-icon">👥</text>
				<text class="empty-text">暂无群聊</text>
				<button class="create-btn" @click="createGroup">去创建</button>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			groups: [],
			loading: false
		}
	},
	onShow() {
		this.loadGroups()
	},
	methods: {
		async loadGroups() {
			this.loading = true
			try {
				const groupApi = await import('@/api/group.js')
				const response = await groupApi.default.getUserGroups()
				if (response.success && response.data) {
					const list = response.data.groups || response.data.Groups || []
					this.groups = list.map(item => ({
						id: item.id || item.Id,
						name: item.name || item.Name,
						avatar: item.avatar || item.Avatar,
						member_count: item.member_count || item.MemberCount || 0
					}))
				} else {
					this.groups = []
				}
			} catch (error) {
				console.error('加载群聊列表失败:', error)
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},

		getAvatar(avatar) {
			if (!avatar) {
				return '/static/logo.png'
			}
			if (avatar.startsWith('http')) {
				return avatar
			}
			return avatar
		},

		openGroup(group) {
			uni.navigateTo({
				url: `/pages/chat/chat-detail?groupId=${group.id}&groupName=${group.name}`
			})
		},

		createGroup() {
			uni.navigateTo({
				url: '/pages/group/create-group'
			})
		}
	}
}
</script>

<style scoped>
.group-list-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 20rpx;
	box-sizing: border-box;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
}

.create-btn {
	background: #07c160;
	color: #fff;
	border: none;
	border-radius: 50rpx;
	padding: 12rpx 28rpx;
	font-size: 28rpx;
}

.group-scroll {
	background: #fff;
	border-radius: 20rpx;
}

.group-item {
	display: flex;
	align-items: center;
	padding: 24rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.group-item:last-child {
	border-bottom: none;
}

.group-avatar {
	width: 90rpx;
	height: 90rpx;
	border-radius: 10rpx;
	margin-right: 20rpx;
	background: #f2f2f2;
}

.group-info {
	flex: 1;
}

.group-name {
	font-size: 32rpx;
	color: #333;
	margin-bottom: 6rpx;
}

.group-desc {
	font-size: 24rpx;
	color: #999;
}

.loading-state {
	padding: 80rpx 0;
	text-align: center;
}

.loading-spinner {
	width: 40rpx;
	height: 40rpx;
	border: 4rpx solid #f3f3f3;
	border-top: 4rpx solid #07c160;
	border-radius: 50%;
	margin: 0 auto 20rpx;
	animation: spin 1s linear infinite;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.empty-state {
	padding: 100rpx 0;
	text-align: center;
}

.empty-icon {
	font-size: 60rpx;
	color: #ccc;
}

.empty-text {
	font-size: 30rpx;
	color: #999;
	margin: 20rpx 0;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
</style>


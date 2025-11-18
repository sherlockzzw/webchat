<template>
	<view class="main-container">
		<!-- 顶部状态栏 -->
		<view class="status-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="header">
				<text class="app-title">GoChat</text>
				<view class="header-right">
					<view class="plus-btn" @click="openFriendSelector">
						<uni-icons type="plusempty" size="24" color="#fff"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 内容区域 -->
		<view class="content">
			<!-- 聊天页面 -->
			<view v-if="currentTab === 0" class="tab-content">
				<ChatTab ref="chatTab" />
			</view>
			
			<!-- 通讯录页面 -->
			<view v-if="currentTab === 1" class="tab-content">
				<ContactTab ref="contactTab" />
			</view>
			
			<!-- 个人中心页面 -->
			<view v-if="currentTab === 2" class="tab-content">
				<ProfileTab ref="profileTab" />
			</view>
		</view>
		
		<!-- 底部导航栏 -->
		<view class="bottom-tabs">
			<view 
				v-for="(tab, index) in tabs" 
				:key="index"
				class="tab-item"
				:class="{ 'active': currentTab === index }"
				@click="switchTab(index)"
			>
				<uni-icons :type="tab.icon" size="24" :color="currentTab === index ? '#007AFF' : '#888'"></uni-icons>
				<text class="tab-text">{{ tab.name }}</text>
			</view>
		</view>

		<!-- 发起群聊好友选择 -->
		<view v-if="showFriendSelector" class="friend-selector-overlay">
			<view class="friend-selector-panel">
				<view class="panel-header">
					<text class="panel-title">发起群聊</text>
					<text class="panel-close" @click="closeFriendSelector">×</text>
				</view>
				<view class="panel-body">
					<scroll-view scroll-y class="friend-scroll">
						<view v-if="isFriendLoading" class="loading-text">加载好友中...</view>
						<view 
							v-for="friend in friendList" 
							:key="getFriendId(friend)"
							class="selector-item"
							@click="toggleFriend(friend)"
						>
							<image :src="getFriendAvatar(friend)" class="selector-avatar"></image>
							<view class="selector-info">
								<text class="selector-name">{{ getFriendName(friend) }}</text>
								<text v-if="friend.phone" class="selector-desc">{{ friend.phone }}</text>
							</view>
							<view class="selector-check" :class="{ selected: isFriendSelected(friend) }">
								<uni-icons 
									v-if="isFriendSelected(friend)" 
									type="checkmarkempty" 
									size="20" 
									color="#fff"
								></uni-icons>
							</view>
						</view>
						<view v-if="!isFriendLoading && friendList.length === 0" class="empty-text">
							暂无好友，请先添加好友
						</view>
					</scroll-view>
				</view>
				<view class="panel-footer">
					<button 
						class="confirm-btn" 
						:class="{ disabled: selectedFriendIds.length === 0 }"
						@click="confirmStartGroup"
					>
						开始群聊 <text v-if="selectedFriendIds.length">({{ selectedFriendIds.length }})</text>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import ChatTab from './components/ChatTab.vue'
import ContactTab from './components/ContactTab.vue'
import ProfileTab from './components/ProfileTab.vue'

export default {
	components: {
		ChatTab,
		ContactTab,
		ProfileTab
	},
	data() {
		return {
			currentTab: 0,
			statusBarHeight: 0,
			userInfo: {},
			showFriendSelector: false,
			friendList: [],
			isFriendLoading: false,
			selectedFriendIds: [],
			tabs: [
				{ name: '聊天', icon: 'chat' },
				{ name: '通讯录', icon: 'contact' },
				{ name: '我', icon: 'person' }
			]
		}
	},
	onLoad() {
		// 获取状态栏高度
		const systemInfo = uni.getSystemInfoSync()
		this.statusBarHeight = systemInfo.statusBarHeight || 0
		
		// 获取用户信息
		this.loadUserInfo()
		
		// 检查登录状态
		this.checkLoginStatus()
	},
	onShow() {
		// 每次显示时重新加载用户信息
		this.loadUserInfo()
		this.refreshCurrentTab()
	},
	methods: {
		// 加载用户信息
		loadUserInfo() {
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo) {
				this.userInfo = userInfo
				console.log('主页面加载用户信息:', userInfo)
			}
		},
		
		// 检查登录状态
		async checkLoginStatus() {
			try {
				const userApi = await import('@/api/user.js')
				if (!userApi.default.checkLoginStatus()) {
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}
			} catch (error) {
				console.error('检查登录状态失败:', error)
				uni.reLaunch({
					url: '/pages/login/login'
				})
			}
		},
		
		// 切换标签页
		switchTab(index) {
			console.log('Main: 切换到tab', index)
			this.currentTab = index
			this.refreshCurrentTab()
		},
		
		refreshCurrentTab() {
			this.$nextTick(() => {
				if (this.currentTab === 0 && this.$refs.chatTab) {
					this.$refs.chatTab.loadChats()
				}
				if (this.currentTab === 1 && this.$refs.contactTab) {
					this.$refs.contactTab.loadFriends()
					this.$refs.contactTab.loadUnreadRequests()
				}
				if (this.currentTab === 2 && this.$refs.profileTab) {
					this.$refs.profileTab.loadUserInfo()
				}
			})
		},
		
		// 跳转到个人中心
		goToProfile() {
			this.currentTab = 2
			},

			async openFriendSelector() {
				this.showFriendSelector = true
				if (this.friendList.length === 0 && !this.isFriendLoading) {
					await this.loadFriendList()
				}
			},

			async loadFriendList() {
				this.isFriendLoading = true
				try {
					const friendApi = await import('@/api/friend.js')
					const response = await friendApi.default.getFriendList(1, 200)
					if (response.success && response.data && response.data.friends) {
						this.friendList = response.data.friends
					} else {
						this.friendList = []
					}
				} catch (error) {
					console.error('加载好友列表失败:', error)
					uni.showToast({
						title: '加载好友失败',
						icon: 'none'
					})
				} finally {
					this.isFriendLoading = false
				}
			},

			closeFriendSelector() {
				this.showFriendSelector = false
				this.selectedFriendIds = []
			},

			getFriendId(friend) {
				return Number(friend.id || friend.friend_id || friend.user_id || 0)
			},

			getFriendName(friend) {
				return friend.remark || friend.name || friend.friend_name || '好友'
			},

			getFriendAvatar(friend) {
				const avatar = friend.avatar || friend.friend_avatar || ''
				if (!avatar) {
					return '/static/logo.png'
				}
				if (avatar.startsWith('http')) {
					return avatar
				}
				return avatar
			},

			isFriendSelected(friend) {
				const friendId = this.getFriendId(friend)
				return this.selectedFriendIds.includes(friendId)
			},

			toggleFriend(friend) {
				const friendId = this.getFriendId(friend)
				if (!friendId) {
					return
				}
				const index = this.selectedFriendIds.indexOf(friendId)
				if (index >= 0) {
					this.selectedFriendIds.splice(index, 1)
				} else {
					this.selectedFriendIds.push(friendId)
				}
			},

			confirmStartGroup() {
				if (this.selectedFriendIds.length === 0) {
					uni.showToast({
						title: '请至少选择一位好友',
						icon: 'none'
					})
					return
				}

				const selectedMembers = this.friendList
					.filter(friend => this.selectedFriendIds.includes(this.getFriendId(friend)))
					.map(friend => ({
						id: this.getFriendId(friend),
						name: this.getFriendName(friend),
						avatar: this.getFriendAvatar(friend)
					}))

				uni.setStorageSync('prefillGroupMembers', selectedMembers)
				this.closeFriendSelector()

				uni.navigateTo({
					url: '/pages/group/create-group'
				})
			}
	}
}
</script>

<style scoped>
.main-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
}

.status-bar {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
}

.app-title {
	color: white;
	font-size: 42rpx;
	font-weight: 800;
	letter-spacing: 2rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	background: linear-gradient(45deg, #ffffff, #e8f4fd);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	position: relative;
}

.app-title::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	z-index: -1;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.plus-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	border: 1rpx solid rgba(255, 255, 255, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-img {
	width: 100%;
	height: 100%;
}

.content {
	flex: 1;
	overflow: hidden;
}

.tab-content {
	height: 100%;
	overflow: hidden;
}

.bottom-tabs {
	display: flex;
	background: #f7f7f7;
	border-top: 1rpx solid #e5e5e5;
	padding-bottom: env(safe-area-inset-bottom);
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16rpx 0 12rpx;
	transition: all 0.2s ease;
	position: relative;
}

.tab-item.active {
	color: #07c160;
}

.tab-item.active::before {
	content: '';
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: #07c160;
	border-radius: 2rpx;
}

.tab-text {
	font-size: 22rpx;
	color: #666;
	margin-top: 6rpx;
	font-weight: 400;
	transition: all 0.2s ease;
}

.tab-item.active .tab-text {
	color: #07c160;
	font-weight: 500;
}

.friend-selector-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 999;
}

.friend-selector-panel {
	width: 100%;
	max-height: 80%;
	background: #fff;
	border-top-left-radius: 30rpx;
	border-top-right-radius: 30rpx;
	display: flex;
	flex-direction: column;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.panel-title {
	font-size: 32rpx;
	font-weight: bold;
}

.panel-close {
	font-size: 40rpx;
	color: #999;
}

.panel-body {
	flex: 1;
}

.friend-scroll {
	max-height: 100%;
}

.selector-item {
	display: flex;
	align-items: center;
	padding: 24rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.selector-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	background: #f5f5f5;
}

.selector-info {
	flex: 1;
}

.selector-name {
	font-size: 32rpx;
	color: #333;
}

.selector-desc {
	font-size: 24rpx;
	color: #999;
}

.selector-check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid #ccc;
	display: flex;
	align-items: center;
	justify-content: center;
}

.selector-check.selected {
	background: #07c160;
	border-color: #07c160;
}

.panel-footer {
	padding: 20rpx 30rpx 40rpx;
}

.confirm-btn {
	width: 100%;
	height: 90rpx;
	background: #07c160;
	color: white;
	border-radius: 45rpx;
	font-size: 32rpx;
	border: none;
}

.confirm-btn.disabled {
	background: #ccc;
}

.loading-text,
.empty-text {
	text-align: center;
	padding: 40rpx;
	color: #999;
	font-size: 28rpx;
}
</style>

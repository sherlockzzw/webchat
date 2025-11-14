<template>
	<view class="main-container">
		<!-- 顶部状态栏 -->
		<view class="status-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="header">
				<text class="app-title">GoChat</text>
				<view class="user-avatar" @click="goToProfile">
					<image :src="userInfo.avatar || '/static/logo.png'" class="avatar-img"></image>
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
			
			// 当切换到聊天时，触发数据加载
			if (index === 0) {
				this.$nextTick(() => {
					if (this.$refs.chatTab) {
						this.$refs.chatTab.loadChats()
					}
				})
			}
			
			// 当切换到通讯录时，触发数据加载
			if (index === 1) {
				console.log('Main: 切换到通讯录，准备加载数据')
				this.$nextTick(() => {
					if (this.$refs.contactTab) {
						console.log('Main: 调用ContactTab的loadFriends方法')
						this.$refs.contactTab.loadFriends()
						this.$refs.contactTab.loadUnreadRequests()
					} else {
						console.log('Main: ContactTab ref不存在')
					}
				})
			}
			
			// 当切换到"我"页面时，触发数据加载
			if (index === 2) {
				console.log('Main: 切换到"我"页面，准备加载数据')
				this.$nextTick(() => {
					if (this.$refs.profileTab) {
						console.log('Main: 调用ProfileTab的loadUserInfo方法')
						this.$refs.profileTab.loadUserInfo()
					} else {
						console.log('Main: ProfileTab ref不存在')
					}
				})
			}
		},
		
		// 跳转到个人中心
		goToProfile() {
			this.currentTab = 2
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

.user-avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	overflow: hidden;
	border: 2rpx solid rgba(255, 255, 255, 0.3);
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
</style>

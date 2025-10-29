<template>
	<view class="add-friend-page">
		<!-- 搜索栏 -->
		<view class="search-section">
			<view class="search-input-wrapper">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					type="text" 
					v-model="searchKeyword" 
					placeholder="请输入用户名或手机号"
					placeholder-style="color: #999;"
					@input="onSearchInput"
				/>
				<view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
					<text class="clear-icon">✕</text>
				</view>
			</view>
		</view>
		
		<!-- 搜索结果 -->
		<view v-if="searchResults && searchResults.length > 0" class="search-results">
			<view 
				v-for="user in searchResults" 
				:key="user.id"
				class="result-card"
			>
				<view class="user-avatar">
					<image :src="user.avatar || '/static/logo.png'" class="avatar-img"></image>
				</view>
				<view class="user-info">
					<text class="user-name">{{ user.name }}</text>
					<text class="user-id">ID: {{ user.id }}</text>
					<text v-if="user.phone" class="user-phone">手机: {{ user.phone }}</text>
					<text v-if="user.email" class="user-email">邮箱: {{ user.email }}</text>
				</view>
				<view class="add-btn-wrapper">
					<button 
						v-if="!user.is_friend"
						class="add-btn" 
						:class="{ 'adding': addingUsers[user.id] }"
						:disabled="addingUsers[user.id]"
						@click="addFriend(user)"
					>
						{{ addingUsers[user.id] ? '添加中...' : '添加好友' }}
					</button>
					<text v-else class="already-friend">已是好友</text>
				</view>
			</view>
		</view>
		
		<!-- 搜索提示 -->
		<view v-else-if="hasSearched && !isSearching" class="no-result">
			<text class="no-result-icon">🔍</text>
			<text class="no-result-text">未找到用户</text>
			<text class="no-result-desc">请检查用户名或手机号是否正确</text>
		</view>
		
		<!-- 搜索中 -->
		<view v-else-if="isSearching" class="searching">
			<text class="searching-text">搜索中...</text>
		</view>
		
		<!-- 默认提示 -->
		<view v-else class="default-tip">
			<text class="tip-icon">👥</text>
			<text class="tip-text">搜索好友</text>
			<text class="tip-desc">输入用户名或手机号来搜索好友</text>
		</view>
		
		<!-- 最近搜索 -->
		<view v-if="recentSearches.length > 0 && !searchKeyword" class="recent-searches">
			<view class="section-title">
				<text class="title-text">最近搜索</text>
				<text class="clear-recent" @click="clearRecentSearches">清空</text>
			</view>
			<view class="recent-list">
				<view 
					v-for="item in recentSearches" 
					:key="item.id"
					class="recent-item"
					@click="searchUser(item.keyword)"
				>
					<text class="recent-icon">🔍</text>
					<text class="recent-keyword">{{ item.keyword }}</text>
					<text class="recent-time">{{ formatTime(item.time) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			searchResults: [],
			isSearching: false,
			hasSearched: false,
			addingUsers: {}, // 记录每个用户的添加状态
			recentSearches: []
		}
	},
	onLoad() {
		// 加载最近搜索记录
		this.loadRecentSearches()
	},
	methods: {
		// 搜索输入处理
		onSearchInput() {
			if (this.searchKeyword.trim()) {
				// 防抖处理
				clearTimeout(this.searchTimer)
				this.searchTimer = setTimeout(() => {
					this.searchUser(this.searchKeyword.trim())
				}, 500)
			} else {
				this.clearSearch()
			}
		},
		
		// 搜索用户
		async searchUser(keyword) {
			if (!keyword) return
			
			this.isSearching = true
			this.hasSearched = true
			this.searchResults = []
			
			try {
				// 调用搜索用户API
				const chatApi = await import('@/api/chat.js')
				const response = await chatApi.default.searchUser(keyword)
				
				console.log('搜索用户响应:', response)
				
				if (response.success && response.data && response.data.users) {
					this.searchResults = response.data.users
					
					// 保存到最近搜索
					this.saveRecentSearch(keyword)
				} else {
					this.searchResults = []
				}
			} catch (error) {
				console.error('搜索用户失败:', error)
				uni.showToast({
					title: '搜索失败，请重试',
					icon: 'none'
				})
			} finally {
				this.isSearching = false
			}
		},
		
		// 添加好友
		async addFriend(user) {
			if (!user || this.addingUsers[user.id]) return
			
			// 获取当前用户信息
			const currentUser = uni.getStorageSync('userInfo')
			if (!currentUser) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			// 检查不能添加自己为好友
			if (currentUser.id === user.id) {
				uni.showToast({
					title: '不能添加自己为好友',
					icon: 'none'
				})
				return
			}
			
			// 设置该用户为添加中状态
			this.$set(this.addingUsers, user.id, true)
			
			try {
				// 调用添加好友API
				const friendApi = await import('@/api/friend.js')
				const response = await friendApi.default.addFriend(user.id)
				
				if (response.success) {
					uni.showToast({
						title: '好友申请已发送',
						icon: 'success'
					})
					// 标记为已是好友
					this.$set(user, 'is_friend', true)
				} else {
					uni.showToast({
						title: response.message || '添加失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('添加好友失败:', error)
				uni.showToast({
					title: '添加失败，请重试',
					icon: 'none'
				})
			} finally {
				// 清除添加中状态
				this.$set(this.addingUsers, user.id, false)
			}
		},
		
		// 清除搜索
		clearSearch() {
			this.searchKeyword = ''
			this.searchResults = []
			this.hasSearched = false
			this.isSearching = false
		},
		
		// 保存最近搜索
		saveRecentSearch(keyword) {
			const recent = {
				id: Date.now(),
				keyword: keyword,
				time: new Date().getTime()
			}
			
			// 移除重复项
			this.recentSearches = this.recentSearches.filter(item => item.keyword !== keyword)
			
			// 添加到开头
			this.recentSearches.unshift(recent)
			
			// 限制数量
			if (this.recentSearches.length > 10) {
				this.recentSearches = this.recentSearches.slice(0, 10)
			}
			
			// 保存到本地存储
			uni.setStorageSync('recentSearches', this.recentSearches)
		},
		
		// 加载最近搜索
		loadRecentSearches() {
			this.recentSearches = uni.getStorageSync('recentSearches') || []
		},
		
		// 清空最近搜索
		clearRecentSearches() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空最近搜索记录吗？',
				success: (res) => {
					if (res.confirm) {
						this.recentSearches = []
						uni.removeStorageSync('recentSearches')
					}
				}
			})
		},
		
		// 格式化时间
		formatTime(timestamp) {
			const now = new Date().getTime()
			const diff = now - timestamp
			
			if (diff < 1000 * 60) {
				return '刚刚'
			} else if (diff < 1000 * 60 * 60) {
				return Math.floor(diff / (1000 * 60)) + '分钟前'
			} else if (diff < 1000 * 60 * 60 * 24) {
				return Math.floor(diff / (1000 * 60 * 60)) + '小时前'
			} else {
				const date = new Date(timestamp)
				return `${date.getMonth() + 1}月${date.getDate()}日`
			}
		}
	}
}
</script>

<style scoped>
.add-friend-page {
	min-height: 100vh;
	background: #f5f5f5;
}

.search-section {
	padding: 30rpx;
	background: white;
	border-bottom: 1rpx solid #eee;
}

.search-input-wrapper {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 25rpx;
	padding: 0 20rpx;
	height: 80rpx;
}

.search-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
	color: #999;
}

.search-input {
	flex: 1;
	font-size: 30rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
}

.clear-btn {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ddd;
	border-radius: 50%;
	margin-left: 15rpx;
}

.clear-icon {
	font-size: 20rpx;
	color: #666;
}

.search-results {
	padding: 30rpx;
}

.search-result {
	padding: 30rpx;
}

.result-card {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
	margin-right: 30rpx;
}

.avatar-img {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
}

.user-info {
	flex: 1;
}

.user-name {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.user-id {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 5rpx;
}

.user-phone, .user-email {
	display: block;
	font-size: 24rpx;
	color: #666;
}

.add-btn-wrapper {
	margin-left: 20rpx;
}

.add-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 25rpx;
	padding: 20rpx 30rpx;
	font-size: 28rpx;
}

.add-btn.adding {
	background: #ccc;
}

.already-friend {
	font-size: 24rpx;
	color: #4CAF50;
	padding: 20rpx 30rpx;
}

.no-result, .searching, .default-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 30rpx;
	color: #999;
}

.no-result-icon, .tip-icon {
	font-size: 120rpx;
	margin-bottom: 20rpx;
}

.no-result-text, .tip-text {
	font-size: 32rpx;
	margin-bottom: 10rpx;
}

.no-result-desc, .tip-desc {
	font-size: 24rpx;
}

.searching-text {
	font-size: 28rpx;
}

.recent-searches {
	padding: 30rpx;
}

.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.title-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.clear-recent {
	font-size: 24rpx;
	color: #667eea;
}

.recent-list {
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
}

.recent-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background-color 0.2s ease;
}

.recent-item:last-child {
	border-bottom: none;
}

.recent-item:active {
	background-color: #f8f9fa;
}

.recent-icon {
	font-size: 28rpx;
	margin-right: 20rpx;
	color: #999;
}

.recent-keyword {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.recent-time {
	font-size: 24rpx;
	color: #999;
}
</style>

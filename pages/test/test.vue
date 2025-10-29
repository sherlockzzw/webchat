<template>
	<view class="test-page">
		<text class="test-text">测试页面 - 跳转成功！</text>
		<button @click="goBack" class="back-btn">返回登录</button>
	</view>
</template>

<script>
export default {
	methods: {
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.test-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: #f5f5f5;
}

.test-text {
	font-size: 32rpx;
	color: #333;
	margin-bottom: 40rpx;
}

.back-btn {
	background: #667eea;
	color: white;
	border: none;
	border-radius: 10rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}
</style>

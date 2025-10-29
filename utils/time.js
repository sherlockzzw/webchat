// 时间格式化工具函数

/**
 * 格式化时间戳为相对时间（如：刚刚、5分钟前、2小时前等）
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimeAgo(timestamp) {
	if (!timestamp) return '未知时间'
	
	const now = Date.now()
	const diff = now - timestamp
	
	// 小于1分钟
	if (diff < 60 * 1000) {
		return '刚刚'
	}
	
	// 小于1小时
	if (diff < 60 * 60 * 1000) {
		const minutes = Math.floor(diff / (60 * 1000))
		return `${minutes}分钟前`
	}
	
	// 小于1天
	if (diff < 24 * 60 * 60 * 1000) {
		const hours = Math.floor(diff / (60 * 60 * 1000))
		return `${hours}小时前`
	}
	
	// 小于7天
	if (diff < 7 * 24 * 60 * 60 * 1000) {
		const days = Math.floor(diff / (24 * 60 * 60 * 1000))
		return `${days}天前`
	}
	
	// 超过7天，显示具体日期
	const date = new Date(timestamp)
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	
	// 如果是今年，不显示年份
	if (year === new Date().getFullYear()) {
		return `${month}月${day}日`
	}
	
	return `${year}年${month}月${day}日`
}

/**
 * 格式化时间戳为完整日期时间
 * @param {number} timestamp - 时间戳（毫秒）
 * @param {string} format - 格式类型：'date' | 'time' | 'datetime' | 'full'
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp, format = 'datetime') {
	if (!timestamp) return '未知时间'
	
	const date = new Date(timestamp)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	const seconds = String(date.getSeconds()).padStart(2, '0')
	
	switch (format) {
		case 'date':
			return `${year}-${month}-${day}`
		case 'time':
			return `${hours}:${minutes}`
		case 'datetime':
			return `${year}-${month}-${day} ${hours}:${minutes}`
		case 'full':
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
		default:
			return `${year}-${month}-${day} ${hours}:${minutes}`
	}
}

/**
 * 格式化时间戳为聊天时间显示格式
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 聊天时间格式
 */
export function formatChatTime(timestamp) {
	if (!timestamp) return ''
	
	const now = new Date()
	const date = new Date(timestamp)
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	
	// 今天
	if (messageDate.getTime() === today.getTime()) {
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${hours}:${minutes}`
	}
	
	// 昨天
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
	if (messageDate.getTime() === yesterday.getTime()) {
		return '昨天'
	}
	
	// 本周内
	const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
	if (messageDate.getTime() > weekAgo.getTime()) {
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
		return weekdays[date.getDay()]
	}
	
	// 更早的时间
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	
	// 如果是今年，不显示年份
	if (year === now.getFullYear()) {
		return `${month}月${day}日`
	}
	
	return `${year}年${month}月${day}日`
}

/**
 * 获取时间戳的日期部分（去除时间）
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {number} 日期时间戳（当天0点的时间戳）
 */
export function getDateTimestamp(timestamp) {
	if (!timestamp) return 0
	
	const date = new Date(timestamp)
	date.setHours(0, 0, 0, 0)
	return date.getTime()
}

/**
 * 判断是否为今天
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {boolean} 是否为今天
 */
export function isToday(timestamp) {
	if (!timestamp) return false
	
	const now = new Date()
	const date = new Date(timestamp)
	
	return now.getFullYear() === date.getFullYear() &&
		   now.getMonth() === date.getMonth() &&
		   now.getDate() === date.getDate()
}

/**
 * 判断是否为昨天
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {boolean} 是否为昨天
 */
export function isYesterday(timestamp) {
	if (!timestamp) return false
	
	const now = new Date()
	const date = new Date(timestamp)
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
	
	return yesterday.getFullYear() === date.getFullYear() &&
		   yesterday.getMonth() === date.getMonth() &&
		   yesterday.getDate() === date.getDate()
}

/**
 * 获取当前时间戳
 * @returns {number} 当前时间戳（毫秒）
 */
export function getCurrentTimestamp() {
	return Date.now()
}

/**
 * 将日期字符串转换为时间戳
 * @param {string} dateString - 日期字符串
 * @returns {number} 时间戳（毫秒）
 */
export function parseDateString(dateString) {
	if (!dateString) return 0
	
	const date = new Date(dateString)
	return isNaN(date.getTime()) ? 0 : date.getTime()
}

// 用户相关API服务
import apiRequest from './request.js'
import { API_CONFIG } from './config.js'

class UserApi {
  // 用户登录
  async login(username, password) {
    try {
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.LOGIN, {
        name: username,
        password: password
      })
      
      // 调试信息
      console.log('登录API响应:', response)
      
      if (response.success) {
        // 保存用户信息和token到本地存储
        // 后端返回格式: {code, msg, data: {data: UserInfo, token, expire}, trace_id}
        console.log('保存用户信息:', response.data)
        console.log('用户详细信息:', response.data.data)
        uni.setStorageSync('userInfo', response.data.data)
        uni.setStorageSync('token', response.data.token)
        uni.setStorageSync('tokenExpire', response.data.expire)
        
        // 验证保存是否成功
        const savedUserInfo = uni.getStorageSync('userInfo')
        console.log('验证保存的用户信息:', savedUserInfo)
      }
      
      return response
    } catch (error) {
      console.error('登录API调用失败:', error)
      return {
        success: false,
        message: '登录失败，请重试'
      }
    }
  }

  // 用户注册
  async register(userData) {
    try {
      // 获取设备信息
      const systemInfo = uni.getSystemInfoSync()
      const deviceInfo = `${systemInfo.platform}-${systemInfo.model}-${systemInfo.system}`
      
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.REGISTER, {
        name: userData.username,
        password: userData.password,
        phone: userData.phone || '',
        email: userData.email || '',
        client_ip: userData.clientIp || '',
        client_port: userData.clientPort || '',
        device_info: userData.deviceInfo || deviceInfo
      })
      
      return response
    } catch (error) {
      console.error('注册API调用失败:', error)
      return {
        success: false,
        message: '注册失败，请重试'
      }
    }
  }

  // 获取用户信息
  async getUserInfo() {
    try {
      // 从本地存储获取用户ID
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        return {
          success: false,
          message: '用户未登录'
        }
      }
      
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.USER_INFO, {
        id: userInfo.id
      })
      return response
    } catch (error) {
      console.error('获取用户信息API调用失败:', error)
      return {
        success: false,
        message: '获取用户信息失败'
      }
    }
  }

  // 检查登录状态
  checkLoginStatus() {
    const token = uni.getStorageSync('token')
    const tokenExpire = uni.getStorageSync('tokenExpire')
    
    console.log('检查登录状态:', {
      token: token ? '存在' : '不存在',
      tokenExpire: tokenExpire,
      tokenExpireMs: tokenExpire ? tokenExpire * 1000 : null,
      currentTime: Date.now(),
      isExpired: tokenExpire ? Date.now() > tokenExpire * 1000 : false
    })
    
    if (!token) {
      console.log('没有token，登录状态无效')
      return false
    }
    
    // 检查token是否过期
    // 后端返回的是秒时间戳，需要转换为毫秒进行比较
    if (tokenExpire && Date.now() > tokenExpire * 1000) {
      console.log('token已过期，清除登录状态')
      this.logout()
      return false
    }
    
    console.log('登录状态有效')
    return true
  }

  // 退出登录
  logout() {
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('token')
    uni.removeStorageSync('tokenExpire')
  }

  // 获取当前用户信息
  getCurrentUser() {
    return uni.getStorageSync('userInfo') || null
  }

  // 更新用户信息到本地存储
  updateUserInfo(userInfo) {
    uni.setStorageSync('userInfo', userInfo)
  }
}

// 创建实例
const userApi = new UserApi()

export default userApi

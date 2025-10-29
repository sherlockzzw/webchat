// HTTP请求封装
import { API_CONFIG, RESPONSE_CODES, ERROR_MESSAGES } from './config.js'

class ApiRequest {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  // 通用请求方法
  async request(options) {
    const {
      url,
      method = 'GET',
      data = null,
      headers = {},
      showLoading = true
    } = options

    // 显示加载提示
    if (showLoading) {
      uni.showLoading({
        title: '请求中...',
        mask: true
      })
    }

    try {
      // 获取token
      const token = uni.getStorageSync('token')
      
      // 构建请求头
      const requestHeaders = {
        ...API_CONFIG.HEADERS,
        ...headers
      }
      
      // 如果有token，添加到请求头
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }

      // 调试信息
      console.log('API请求信息:', {
        url: this.baseURL + url,
        method: method,
        data: data,
        headers: requestHeaders
      })

      // 发起请求
      const response = await uni.request({
        url: this.baseURL + url,
        method: method,
        data: data,
        header: requestHeaders,
        timeout: this.timeout,
        // 添加跨域配置
        withCredentials: false,
        // 确保请求被发送
        sslVerify: false
      })

      // 调试响应信息
      console.log('API响应信息:', response)

      // 隐藏加载提示
      if (showLoading) {
        uni.hideLoading()
      }

      // 处理响应
      return this.handleResponse(response)
    } catch (error) {
      // 隐藏加载提示
      if (showLoading) {
        uni.hideLoading()
      }

      // 处理错误
      return this.handleError(error)
    }
  }

  // 处理响应
  handleResponse(response) {
    const { statusCode, data } = response

    // HTTP状态码检查
    if (statusCode >= 200 && statusCode < 300) {
      // 业务状态码检查 - 后端返回格式: {code, msg, data, trace_id, debug}
      if (data.code === RESPONSE_CODES.SUCCESS) {
        return {
          success: true,
          data: data.data,
          message: data.msg || '请求成功',
          traceId: data.trace_id
        }
      } else {
        // 业务错误
        return {
          success: false,
          code: data.code,
          message: this.getErrorMessage(data.code, data.msg),
          traceId: data.trace_id,
          debug: data.debug
        }
      }
    } else {
      // HTTP错误
      return {
        success: false,
        code: statusCode,
        message: `HTTP错误: ${statusCode}`
      }
    }
  }

  // 处理错误
  handleError(error) {
    console.error('API请求错误:', error)
    
    let message = ERROR_MESSAGES.UNKNOWN_ERROR
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        message = ERROR_MESSAGES.TIMEOUT_ERROR
      } else if (error.errMsg.includes('fail')) {
        message = ERROR_MESSAGES.NETWORK_ERROR
      }
    }

    return {
      success: false,
      code: -1,
      message: message
    }
  }

  // 获取错误消息
  getErrorMessage(code, defaultMessage) {
    return ERROR_MESSAGES[code] || defaultMessage || ERROR_MESSAGES.UNKNOWN_ERROR
  }

  // GET请求
  get(url, params = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data: params,
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }
}

// 创建实例
const apiRequest = new ApiRequest()

export default apiRequest

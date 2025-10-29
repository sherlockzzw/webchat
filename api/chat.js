// 聊天相关API服务
import apiRequest from './request.js'
import { API_CONFIG } from './config.js'

class ChatApi {
  // 搜索用户
  async searchUser(keyword, page = 1, pageSize = 20) {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.SEARCH_USER, {
        keyword: keyword,
        page: page,
        page_size: pageSize
      })
      return response
    } catch (error) {
      console.error('搜索用户API调用失败:', error)
      return {
        success: false,
        message: '搜索用户失败'
      }
    }
  }

  // 发送消息
  async sendMessage(messageData) {
    try {
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.SEND_MESSAGE, {
        to_user_id: messageData.toUserId,
        message_type: messageData.messageType || 'text',
        content: messageData.content,
        file_url: messageData.fileUrl || '',
        file_name: messageData.fileName || ''
      })
      return response
    } catch (error) {
      console.error('发送消息API调用失败:', error)
      return {
        success: false,
        message: '发送消息失败'
      }
    }
  }

  // 获取消息历史
  async getMessageHistory(toUserId, page = 1, pageSize = 50) {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.MESSAGE_HISTORY, {
        to_user_id: toUserId,
        page: page,
        page_size: pageSize
      })
      return response
    } catch (error) {
      console.error('获取消息历史API调用失败:', error)
      return {
        success: false,
        message: '获取消息历史失败'
      }
    }
  }

  // 标记消息为已读
  async markMessageRead(messageIds) {
    try {
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.MARK_MESSAGE_READ, {
        message_ids: messageIds
      })
      return response
    } catch (error) {
      console.error('标记消息已读API调用失败:', error)
      return {
        success: false,
        message: '标记消息已读失败'
      }
    }
  }

  // 获取未读消息数量
  async getUnreadCount() {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.UNREAD_COUNT)
      return response
    } catch (error) {
      console.error('获取未读消息数量API调用失败:', error)
      return {
        success: false,
        message: '获取未读消息数量失败'
      }
    }
  }

  // 上传文件
  async uploadFile(filePath, fileType = 'image') {
    try {
      // 使用uni.uploadFile上传文件
      const token = uni.getStorageSync('token')
      
      const uploadResult = await new Promise((resolve, reject) => {
        uni.uploadFile({
          url: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.UPLOAD_FILE,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (e) {
              reject(new Error('上传响应解析失败'))
            }
          },
          fail: (error) => {
            reject(error)
          }
        })
      })

      if (uploadResult.code === 0) {
        return {
          success: true,
          data: uploadResult.data,
          message: '上传成功'
        }
      } else {
        return {
          success: false,
          message: uploadResult.message || '上传失败'
        }
      }
    } catch (error) {
      console.error('上传文件API调用失败:', error)
      return {
        success: false,
        message: '上传文件失败'
      }
    }
  }

  // 获取WebSocket连接URL
  getWebSocketUrl() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//127.0.0.1:8080${API_CONFIG.ENDPOINTS.WS_CONNECT}`
  }

  // 检查WebSocket健康状态
  async checkWebSocketHealth() {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.WS_HEALTH)
      return response
    } catch (error) {
      console.error('检查WebSocket健康状态失败:', error)
      return {
        success: false,
        message: 'WebSocket服务不可用'
      }
    }
  }
}

// 创建实例
const chatApi = new ChatApi()

export default chatApi

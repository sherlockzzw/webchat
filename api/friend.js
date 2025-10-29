// 好友相关API服务
import apiRequest from './request.js'
import { API_CONFIG } from './config.js'

class FriendApi {
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

  // 添加好友
  async addFriend(friendId, message = '') {
    try {
      const response = await apiRequest.post('/api/friend/add', {
        friend_id: friendId,
        message: message
      })
      return response
    } catch (error) {
      console.error('添加好友API调用失败:', error)
      return {
        success: false,
        message: '添加好友失败'
      }
    }
  }

  // 获取好友列表
  async getFriendList(page = 1, pageSize = 50) {
    try {
      const response = await apiRequest.get('/api/friend/list', {
        page: page,
        page_size: pageSize
      })
      return response
    } catch (error) {
      console.error('获取好友列表API调用失败:', error)
      return {
        success: false,
        message: '获取好友列表失败'
      }
    }
  }

  // 获取好友申请列表
  async getFriendRequests(page = 1, pageSize = 20) {
    try {
      const response = await apiRequest.get('/api/friend/requests', {
        page: page,
        page_size: pageSize
      })
      return response
    } catch (error) {
      console.error('获取好友申请列表API调用失败:', error)
      return {
        success: false,
        message: '获取好友申请列表失败'
      }
    }
  }

  // 处理好友申请
  async handleFriendRequest(requestId, action) {
    try {
      const response = await apiRequest.post('/api/friend/handle-request', {
        request_id: requestId,
        action: action // 'accept' 或 'reject'
      })
      return response
    } catch (error) {
      console.error('处理好友申请API调用失败:', error)
      return {
        success: false,
        message: '处理好友申请失败'
      }
    }
  }

  // 删除好友
  async deleteFriend(friendId) {
    try {
      const response = await apiRequest.delete('/api/friend/delete', {
        friend_id: friendId
      })
      return response
    } catch (error) {
      console.error('删除好友API调用失败:', error)
      return {
        success: false,
        message: '删除好友失败'
      }
    }
  }

  // 获取好友详情
  async getFriendDetail(friendId) {
    try {
      const response = await apiRequest.get(`/api/friend/detail/${friendId}`)
      return response
    } catch (error) {
      console.error('获取好友详情API调用失败:', error)
      return {
        success: false,
        message: '获取好友详情失败'
      }
    }
  }

  // 设置好友备注
  async setFriendRemark(friendId, remark) {
    try {
      const response = await apiRequest.post('/api/friend/set-remark', {
        friend_id: friendId,
        remark: remark
      })
      return response
    } catch (error) {
      console.error('设置好友备注API调用失败:', error)
      return {
        success: false,
        message: '设置好友备注失败'
      }
    }
  }

  // 检查是否为好友
  async checkIsFriend(friendId) {
    try {
      const response = await apiRequest.get('/api/friend/check', {
        friend_id: friendId
      })
      return response
    } catch (error) {
      console.error('检查好友关系API调用失败:', error)
      return {
        success: false,
        message: '检查好友关系失败'
      }
    }
  }

  // 获取在线好友列表
  async getOnlineFriends() {
    try {
      const response = await apiRequest.get('/api/friend/online')
      return response
    } catch (error) {
      console.error('获取在线好友列表API调用失败:', error)
      return {
        success: false,
        message: '获取在线好友列表失败'
      }
    }
  }

  // 屏蔽/取消屏蔽好友
  async blockFriend(friendId, isBlock) {
    try {
      const response = await apiRequest.post('/api/friend/block', {
        friend_id: friendId,
        is_block: isBlock
      })
      return response
    } catch (error) {
      console.error('屏蔽好友API调用失败:', error)
      return {
        success: false,
        message: '屏蔽好友失败'
      }
    }
  }
}

// 创建实例
const friendApi = new FriendApi()

export default friendApi

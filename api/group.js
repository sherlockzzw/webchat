// 群组相关API服务
import apiRequest from './request.js'
import { API_CONFIG } from './config.js'

class GroupApi {
  // 创建群组
  async createGroup(groupData) {
    try {
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.CREATE_GROUP, {
        name: groupData.name,
        avatar: groupData.avatar || '',
        member_ids: groupData.memberIds || []
      })
      return response
    } catch (error) {
      console.error('创建群组API调用失败:', error)
      return {
        success: false,
        message: '创建群组失败'
      }
    }
  }

  // 获取群组信息
  async getGroupInfo(groupId) {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.GROUP_INFO, {
        group_id: Number(groupId)
      })
      return response
    } catch (error) {
      console.error('获取群组信息API调用失败:', error)
      return {
        success: false,
        message: '获取群组信息失败'
      }
    }
  }

  // 获取用户群组列表
  async getUserGroups() {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.USER_GROUPS)
      return response
    } catch (error) {
      console.error('获取群组列表API调用失败:', error)
      return {
        success: false,
        message: '获取群组列表失败'
      }
    }
  }

  // 添加群成员
  async addGroupMembers(groupId, userIds) {
    try {
      // 确保userIds是数字数组
      const userIdsNum = userIds.map(id => Number(id)).filter(id => !isNaN(id))
      
      const response = await apiRequest.post(API_CONFIG.ENDPOINTS.ADD_GROUP_MEMBERS, {
        group_id: Number(groupId),
        user_ids: userIdsNum
      })
      return response
    } catch (error) {
      console.error('添加群成员API调用失败:', error)
      return {
        success: false,
        message: '添加群成员失败'
      }
    }
  }

  // 移除群成员（踢人）
  async removeGroupMember(groupId, userId) {
    try {
      const response = await apiRequest.delete(API_CONFIG.ENDPOINTS.REMOVE_GROUP_MEMBER, {
        group_id: Number(groupId),
        user_id: Number(userId)
      })
      return response
    } catch (error) {
      console.error('移除群成员API调用失败:', error)
      return {
        success: false,
        message: '移除群成员失败'
      }
    }
  }

  // 检查用户是否在群组中
  async checkMemberInGroup(groupId, userId) {
    try {
      const response = await apiRequest.get(API_CONFIG.ENDPOINTS.CHECK_MEMBER_IN_GROUP, {
        group_id: Number(groupId),
        user_id: Number(userId)
      })
      return response
    } catch (error) {
      console.error('检查群成员API调用失败:', error)
      return {
        success: false,
        message: '检查群成员失败'
      }
    }
  }
}

const groupApi = new GroupApi()
export default groupApi


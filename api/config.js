// API配置文件
export const API_CONFIG = {
  // 基础配置
  BASE_URL: 'http://127.0.0.1:8080',
  TIMEOUT: 10000, // 10秒超时
  
  // API路径
  ENDPOINTS: {
    // 用户相关
    LOGIN: '/api/login',
    REGISTER: '/api/user/register',
    USER_INFO: '/api/user/info',
    
    // 聊天相关
    SEARCH_USER: '/api/chat/search',
    SEND_MESSAGE: '/api/chat/message/send',
    MESSAGE_HISTORY: '/api/chat/message/history',
    MARK_MESSAGE_READ: '/api/chat/message/read',
    UNREAD_COUNT: '/api/chat/message/unread',
    UPLOAD_FILE: '/api/chat/upload',
    
    // WebSocket
    WS_CONNECT: '/ws/connect',
    WS_ONLINE: '/ws/online',
    WS_HEALTH: '/ws/health'
  },
  
  // 请求头配置
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// 响应状态码 - 匹配后端code_msg定义
export const RESPONSE_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  REQUEST_CONFLICT: 409,
  REQUEST_DELETE: 410,
  REQUEST_TOO_LARGE: 413,
  REQUEST_TOO_LONG: 414,
  REQUEST_TOO_MANY: 429,
  SERVER_ERROR: 500,
  SERVER_TIMEOUT: 504,
  
  // 身份校验相关
  USER_CHECK_TOKEN_ILLEGAL: 4001,
  USER_CHECK_TOKEN_SIGNATURE_INVALID: 4002,
  USER_CHECK_TOKEN_STALE: 4003,
  ADMIN_CHECK_NOT_API_PERMISSION: 4101,
  
  // 用户相关
  USER_ROLE_HARDER_NOT_SET: 4200,
  INVALID_MOBILE_PHONE: 4201,
  USER_NOT_EXISTS: 4202,
  INVALID_SMS_CODE: 4203,
  INVALID_TOKEN: 4204,
  PASSWORD_ERROR: 4205,
  
  // 用户名相关
  USER_NAME_EXISTED: 4301
}

// 错误消息映射 - 匹配后端错误消息
export const ERROR_MESSAGES = {
  [RESPONSE_CODES.SUCCESS]: '请求成功',
  [RESPONSE_CODES.BAD_REQUEST]: '请求参数有误',
  [RESPONSE_CODES.UNAUTHORIZED]: '请登录后访问',
  [RESPONSE_CODES.FORBIDDEN]: '拒绝访问',
  [RESPONSE_CODES.NOT_FOUND]: '服务器无法找到所请求的资源',
  [RESPONSE_CODES.METHOD_NOT_ALLOWED]: '禁止了使用当前 HTTP 方法的请求',
  [RESPONSE_CODES.NOT_ACCEPTABLE]: '服务器端无法提供与 Accept-Charset 以及 Accept-Language 消息头指定的值相匹配的响应',
  [RESPONSE_CODES.PROXY_AUTHENTICATION_REQUIRED]: '缺乏位于浏览器与可以访问所请求资源的服务器之间的代理服务器',
  [RESPONSE_CODES.REQUEST_TIMEOUT]: '服务器想要将没有在使用的连接关闭',
  [RESPONSE_CODES.REQUEST_CONFLICT]: '服务器在完成请求时发生冲突',
  [RESPONSE_CODES.REQUEST_DELETE]: '如果请求的资源已永久删除，服务器就会返回此响应',
  [RESPONSE_CODES.REQUEST_TOO_LARGE]: '服务器无法处理请求，因为请求实体过大，超出服务器的处理能力',
  [RESPONSE_CODES.REQUEST_TOO_LONG]: '请求的URI过长，服务器无法处理',
  [RESPONSE_CODES.REQUEST_TOO_MANY]: '请求过于频繁，请稍后再试',
  [RESPONSE_CODES.SERVER_ERROR]: '服务器开小差～',
  [RESPONSE_CODES.SERVER_TIMEOUT]: '请求超时',
  
  // 身份校验相关
  [RESPONSE_CODES.USER_CHECK_TOKEN_ILLEGAL]: '身份信息不合法',
  [RESPONSE_CODES.USER_CHECK_TOKEN_SIGNATURE_INVALID]: '签名无效',
  [RESPONSE_CODES.USER_CHECK_TOKEN_STALE]: '身份信息已过期，请重新登陆',
  [RESPONSE_CODES.ADMIN_CHECK_NOT_API_PERMISSION]: '没有该接口权限',
  
  // 用户相关
  [RESPONSE_CODES.USER_ROLE_HARDER_NOT_SET]: '用户角色未设置',
  [RESPONSE_CODES.INVALID_MOBILE_PHONE]: '手机号格式错误',
  [RESPONSE_CODES.USER_NOT_EXISTS]: '用户不存在',
  [RESPONSE_CODES.INVALID_SMS_CODE]: '短信验证码错误',
  [RESPONSE_CODES.INVALID_TOKEN]: 'Token无效',
  [RESPONSE_CODES.PASSWORD_ERROR]: '密码错误',
  [RESPONSE_CODES.USER_NAME_EXISTED]: '用户名已存在',
  
  // 网络相关
  NETWORK_ERROR: '网络连接失败',
  TIMEOUT_ERROR: '请求超时',
  UNKNOWN_ERROR: '未知错误'
}

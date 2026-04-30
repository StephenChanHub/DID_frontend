/**
 * 环境配置
 *
 * 资源基础地址：用于拼接图片、音频等静态资源的完整 URL
 * 通过环境变量 VITE_API_BASE_URL 配置，默认值为开发环境后端地址
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://192.168.64.2:3000';

/**
 * 构建完整的文件 URL
 * @param url 相对路径或完整 URL
 * @returns 完整的 URL 字符串，如果输入为空则返回 null
 */
export const buildFileUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith('javascript:') || url.startsWith('data:')) {
    return null;
  }

  // 如果已经是完整的 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const trustedHosts = [
      window.location.host,
      new URL(API_BASE_URL, window.location.origin).host
    ];
    try {
      const parsed = new URL(url);
      if (!trustedHosts.includes(parsed.host)) return null;
    } catch {
      return null;
    }
    return url;
  }

  // 开发环境下，如果 API_BASE_URL 是默认值，可能无法在手机上访问
  // 改为使用相对路径，依赖 vite 代理转发
  if (import.meta.env.DEV && API_BASE_URL === 'http://192.168.64.2:3000') {
    // 确保路径以 / 开头
    return url.startsWith('/') ? url : '/' + url;
  }

  // 如果是相对路径（以 / 开头），直接拼接基础 URL
  // 如果不是以 / 开头，添加 / 前缀再拼接
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
};

// 全局积分刷新管理器
class CreditRefreshManager {
  private listeners: Array<() => void> = []

  // 注册监听器
  subscribe(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // 触发所有监听器刷新积分
  refresh() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('积分刷新回调执行失败:', error)
      }
    })
  }
}

// 导出单例实例
export const creditRefreshManager = new CreditRefreshManager()

// 便捷函数
export const refreshCredits = () => {
  creditRefreshManager.refresh()
}
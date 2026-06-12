/**
 * 全局路由导航单例
 * api 模块通过 getRouter() 获取 navigate 函数，避免在 axios 拦截器中直接使用 window.location
 */
let _navigate = null;

export function setRouterNavigate(fn) {
  _navigate = fn;
}

export function getRouter() {
  return _navigate ? { navigate: _navigate } : null;
}

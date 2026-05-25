export const API_SITES = {
  ruyi: {
    name: "如意资源",
    api: "https://cj.rycjapi.com/api.php/provide/vod"
  },
  sl: {
    name: "森林资源",
    api: "https://slapibf.com/api.php/provide/vod",
  },
  tyyszy: {
    name: "天涯资源",
    api: "https://tyyszy.com/api.php/provide/vod"
  },
  bfzy: {
    name: "暴风资源",
    api: "https://bfzyapi.com/api.php/provide/vod"
  },
  dyttzy: {
    name: "电影天堂",
    api: "https://caiji.dyttzyapi.com/api.php/provide/vod",
  },
  ffzy: {
    name: "非凡影视",
    api: "https://ffzy5.tv/api.php/provide/vod",
  },
  dbzy: {
    name: "豆瓣资源",
    api: "https://dbzy.tv/api.php/provide/vod"
  },
  lovedan: {
    name: "爱乐资源",
    api: "https://lovedan.net/api.php/provide/vod"
  },
  wujin: {
    name: "无尽资源",
    api: "https://api.wujinapi.me/api.php/provide/vod"
  },
  bd: {
    name: "百度资源",
    api: "https://api.apibdzy.com/api.php/provide/vod"
  }
};

export const DEFAULT_SELECTED_SOURCES = ["ruyi"];

export const API_HEADERS = {
  Accept: "application/json,text/plain,*/*"
};

// 本地代理地址，仅在 Web 平台使用以绕过 CORS 限制
export const PROXY_BASE_URL = "http://localhost:19001/proxy";

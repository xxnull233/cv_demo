export const API_SITES = {
  tyyszy: {
    name: "天涯资源",
    api: "https://tyyszy.com/api.php/provide/vod"
  },
  bfzy: {
    name: "暴风资源",
    api: "https://bfzyapi.com/api.php/provide/vod"
  },
  dyttzy: {
    name: "电影天堂资源",
    api: "http://caiji.dyttzyapi.com/api.php/provide/vod",
    detail: "http://caiji.dyttzyapi.com"
  },
  ruyi: {
    name: "如意资源",
    api: "https://cj.rycjapi.com/api.php/provide/vod"
  },
  heimuer: {
    name: "黑木耳",
    api: "https://json.heimuer.xyz/api.php/provide/vod",
    detail: "https://heimuer.tv"
  },
  ffzy: {
    name: "非凡影视",
    api: "http://ffzy5.tv/api.php/provide/vod",
    detail: "http://ffzy5.tv"
  },
  dbzy: {
    name: "豆瓣资源",
    api: "https://dbzy.tv/api.php/provide/vod"
  },
  wolong: {
    name: "卧龙资源",
    api: "https://wolongzyw.com/api.php/provide/vod"
  },
  wujin: {
    name: "无尽资源",
    api: "https://api.wujinapi.me/api.php/provide/vod"
  }
};

export const DEFAULT_SELECTED_SOURCES = ["tyyszy", "bfzy", "dyttzy", "ruyi"];

export const API_HEADERS = {
  Accept: "application/json,text/plain,*/*"
};

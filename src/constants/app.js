export const APP_NAME = "CV";
// 须与 EAS 云端项目 slug 一致，否则远程打包失败
export const APP_SLUG = "libretv-mobile";
export const APP_PACKAGE = "com.anonymous.cv";

export const API_HEADERS = { Accept: 'application/json,text/plain,*/*' };

export const PROXY_BASE = 'http://localhost:19001';

// react-native-toast-message 暗色主题配置
import React from "react";
import { BaseToast } from "react-native-toast-message";

function makeToastConfig(borderColor) {
  return function (props) {
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: borderColor,
          backgroundColor: "#1a1a1a",
          borderLeftWidth: 3,
          borderRadius: 12,
          height: 44,
          paddingHorizontal: 8,
        }}
        text1Style={{ color: "#f8fafc", fontSize: 13 }}
      />
    );
  };
}

export const TOAST_CONFIG = {
  success: makeToastConfig("#4ade80"),
  error: makeToastConfig("#ef4444"),
  info: makeToastConfig("#38bdf8"),
};

import { Platform, StatusBar } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * 进入播放器全屏：锁定方向 + 隐藏系统栏（Android 含导航栏）
 */
export async function enterPlayerFullscreen(mode) {
  if (mode === "landscape") {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT).catch(function () {});
  } else {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
  }

  StatusBar.setHidden(true, "fade");

  if (Platform.OS === "android") {
    await NavigationBar.setVisibilityAsync("hidden").catch(function () {});
    await NavigationBar.setBehaviorAsync("overlay-swipe").catch(function () {});
  }
}

/**
 * 退出播放器全屏：恢复竖屏 + 显示系统栏
 */
export async function exitPlayerFullscreen() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
  StatusBar.setHidden(false, "fade");

  if (Platform.OS === "android") {
    await NavigationBar.setVisibilityAsync("visible").catch(function () {});
  }
}

/** 进入播放页时锁定竖屏 */
export async function lockPortraitOnPlayerMount() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
}

/** 离开播放页时恢复系统 UI 与方向 */
export async function restoreSystemUiOnPlayerUnmount() {
  await ScreenOrientation.unlockAsync().catch(function () {});
  StatusBar.setHidden(false, "fade");

  if (Platform.OS === "android") {
    await NavigationBar.setVisibilityAsync("visible").catch(function () {});
  }
}

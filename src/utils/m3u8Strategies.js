import { detectByDiscontinuity, detectByUniformDuration, createDetector } from "./m3u8Parser";

/**
 * 策略名 → 检测函数映射
 * 值为 undefined/不存在于映射中 → 不执行过滤
 */
export const STRATEGY_MAP = {
  "none":             null,
  "discontinuity":    detectByDiscontinuity,
  "uniform-duration": detectByUniformDuration,
};

/** 源配置中 adStrategy 字段的合法值 */
export const STRATEGY_VALUES = ["none", "discontinuity", "uniform-duration"];

/** UI 选择器选项 */
export const STRATEGY_OPTIONS = [
  { value: "none",             label: "不过滤（原始地址直播）" },
  { value: "discontinuity",    label: "仅 DISCONTINUITY" },
  { value: "uniform-duration", label: "均匀时长（4s×5 判定为广告）" },
];

/**
 * 根据源配置的策略名构建 detector
 * @param {string} adStrategy - 源配置中的策略名
 * @returns {Function|null} 可传入 filterSegmentsText / filterM3u8ByUrl 的 detector
 */
export function getDetectorForSource(adStrategy) {
  const fn = STRATEGY_MAP[adStrategy];
  return fn ? createDetector(fn) : null;
}

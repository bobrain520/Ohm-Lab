/* Pure model, shared by every teaching mode and the offline tests. */
(function (root) {
  'use strict';
  const limits = { v: { min: 0, max: 12, step: 0.1 }, r: { min: 50, max: 1000, step: 10 } };
  function current(v, r) { return v / r; }
  function validate(key, raw) {
    const rule = limits[key];
    if (typeof raw === 'string' && raw.trim() === '') return { valid: false, message: '請輸入數值，已保留上一個有效設定。' };
    const value = Number(raw);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) return { valid: false, message: `請輸入 ${rule.min}–${rule.max} 之間的數值。` };
    const steps = (value - rule.min) / rule.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-7) return { valid: false, message: `請以 ${rule.step} 為間隔調整。` };
    return { valid: true, value: Number(value.toFixed(3)) };
  }
  function format(value, digits = 3) { return Number(value.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits, useGrouping: false }); }
  function matches(v, r, target) { return Math.abs(current(v, r) - target) < 1e-10; }
  const api = { current, validate, format, matches, limits };
  root.OhmModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);

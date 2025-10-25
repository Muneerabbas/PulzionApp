// src/utils/tMiddleware.js
import { useTheme } from "../context/ThemeContext";

/**
 * Compose styles efficiently for React Native.
 * - Returns a flat array of styles (lets RN handle merging efficiently)
 * - Flattens nested arrays
 * - Ignores falsy values
 * - Supports a small set of string tokens (e.g., 'flx-row')
 * Usage: T(m2, bg('red'), color('white'), ['extra'], condition && p2, 'flx-row')
 */
const tokenMap = {
  'flx-row': { flexDirection: 'row' },
  'row': { flexDirection: 'row' },
  'col': { flexDirection: 'column' },
  'center': { justifyContent: 'center', alignItems: 'center' },
  'ai-center': { alignItems: 'center' },
  'jc-center': { justifyContent: 'center' },
  'jc-space-between': { justifyContent: 'space-between' },
};

export const T = (...args) => {
  const out = [];
  const push = (v) => {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach(push);
      return;
    }
    if (typeof v === 'string') {
      const token = tokenMap[v];
      if (token) out.push(token);
      return;
    }
    if (typeof v === 'object') {
      out.push(v);
    }
  };
  args.forEach(push);
  return out;
};

// Tx: same inputs as T but returns a merged single object
export const Tx = (...args) => Object.assign({}, ...T(...args));

/**
 * Theme-aware styling utilities
 */
export const useT = () => {
  const { colors } = useTheme();

  // 🎨 Color helpers (theme-aware)
  const color = (v) => ({ color: colors[v] || v });
  const bg = (v) => ({ backgroundColor: colors[v] || v });
  const bc = (v) => ({ borderColor: colors[v] || v });

  // 🧱 Spacing
  const m = (v) => ({ margin: v });
  const mt = (v) => ({ marginTop: v });
  const mb = (v) => ({ marginBottom: v });
  const ml = (v) => ({ marginLeft: v });
  const mr = (v) => ({ marginRight: v });
  const mh = (v) => ({ marginHorizontal: v });
  const mv = (v) => ({ marginVertical: v });



  const p = (v) => ({ padding: v });
  const pt = (v) => ({ paddingTop: v });
  const pb = (v) => ({ paddingBottom: v });
  const pl = (v) => ({ paddingLeft: v });
  const pr = (v) => ({ paddingRight: v });
  const ph = (v) => ({ paddingHorizontal: v });
  const pv = (v) => ({ paddingVertical: v });


  // 🔤 Typography
  const f = (v) => ({ fontSize: v });
  const fw = (v) => ({ fontWeight: v });
  const ta = (v) => ({ textAlign: v });
  const lh = (v) => ({ lineHeight: v });

  //Custom Fonts
  const fr = (v) => ({ fontSize: v, fontFamily: "MonaSans-Regular" });
  const fb = (v) => ({ fontSize: v, fontFamily: "MonaSans-Bold" });
  const fm = (v) => ({ fontSize: v, fontFamily: "MonaSans-Medium" });
  const fs = (v) => ({ fontSize: v, fontFamily: "MonaSans-SemiBold" });

  // 🧭 Flex utilities
  const row = { flexDirection: "row" };
  const col = { flexDirection: "column" };
  const center = { justifyContent: "center", alignItems: "center" };
  const jc = (v) => ({ justifyContent: v });
  const ai = (v) => ({ alignItems: v });

  // 🧍‍♂️ Layout
  const w = (v) => ({ width: v });
  const h = (v) => ({ height: v });
  const flex = (v) => ({ flex: v });
  const abs = { position: "absolute" };
  const rel = { position: "relative" };
  const top = (v) => ({ top: v });
  const left = (v) => ({ left: v });
  const right = (v) => ({ right: v });
  const bottom = (v) => ({ bottom: v });

  // 🖼️ Border & radius
  const br = (v) => ({ borderRadius: v });
  const bw = (v) => ({ borderWidth: v });

  // 🌫️ Opacity
  const op = (v) => ({ opacity: v });

  // 🧩 Predefined spacings
  const m1 = { margin: 4 };
  const m2 = { margin: 8 };
  const m3 = { margin: 12 };
  const p1 = { padding: 4 };
  const p2 = { padding: 8 };
  const p3 = { padding: 12 };
  const oh = { overflow: "hidden" };
  const bwc = { borderWidth: 1, borderColor: colors.secondary };
const gap = (v) => ({ gap: v });
  // Tachyons-like token parser helpers
  const spaceScale = [0, 4, 8, 12, 16, 20, 24, 32, 40]; // 0..8
  const fontScale = { 1: 36, 2: 30, 3: 24, 4: 20, 5: 16, 6: 14, 7: 12 };

  const tokenToStyle = (t) => {
    if (!t || typeof t !== 'string') return null;
    // Flex directions and centers
    if (t === 'row') return { flexDirection: 'row' };
    if (t === 'col') return { flexDirection: 'column' };
    if (t === 'center') return { justifyContent: 'center', alignItems: 'center' };
    // Align/justify shortcuts
    if (t === 'ai-start') return { alignItems: 'flex-start' };
    if (t === 'ai-center') return { alignItems: 'center' };
    if (t === 'ai-end') return { alignItems: 'flex-end' };
    if (t === 'jc-start') return { justifyContent: 'flex-start' };
    if (t === 'jc-center') return { justifyContent: 'center' };
    if (t === 'jc-end') return { justifyContent: 'flex-end' };
    if (t === 'jc-between') return { justifyContent: 'space-between' };
    if (t === 'jc-around') return { justifyContent: 'space-around' };
    if (t === 'flx') return { flex: 1 };
    const mFlx = t.match(/^flx-(\d+)$/); if (mFlx) return { flex: Number(mFlx[1]) };

    // Spacing: p*/m* with directions
    const mSpace = t.match(/^([pm])([trblhv]?)(\d)$/);
    if (mSpace) {
      const [, type, dir, nStr] = mSpace;
      const n = Number(nStr);
      const val = spaceScale[n] ?? n;
      const map = {
        '': type === 'p' ? 'padding' : 'margin',
        t: type === 'p' ? 'paddingTop' : 'marginTop',
        r: type === 'p' ? 'paddingRight' : 'marginRight',
        b: type === 'p' ? 'paddingBottom' : 'marginBottom',
        l: type === 'p' ? 'paddingLeft' : 'marginLeft',
        h: type === 'p' ? 'paddingHorizontal' : 'marginHorizontal',
        v: type === 'p' ? 'paddingVertical' : 'marginVertical',
      };
      const key = map[dir || ''];
      return { [key]: val };
    }

    // Font size f1..f7
    const mF = t.match(/^f(\d)$/); if (mF) { const sz = fontScale[mF[1]] || Number(mF[1]); return { fontSize: sz }; }
    // Font weight fw1..fw9 -> '100'..'900'
    const mFw = t.match(/^fw([1-9])$/); if (mFw) return { fontWeight: String(Number(mFw[1]) * 100) };
    // Text align
    if (t === 'tc') return { textAlign: 'center' };
    if (t === 'tl') return { textAlign: 'left' };
    if (t === 'tr') return { textAlign: 'right' };
    if (t === 'tj') return { textAlign: 'justify' };

    // Line height: lh-<number>
    const mLh = t.match(/^lh-(\d+)$/); if (mLh) return { lineHeight: Number(mLh[1]) };

    // Colors: bg-*, color-*
    const mBg = t.match(/^bg-(.+)$/); if (mBg) return { backgroundColor: colors[mBg[1]] || mBg[1] };
    const mColor = t.match(/^color-(.+)$/); if (mColor) return { color: colors[mColor[1]] || mColor[1] };
    const mBc = t.match(/^bc-(.+)$/); if (mBc) return { borderColor: colors[mBc[1]] || mBc[1] };

    // Border radius / width
    const mBr = t.match(/^br(\d+)$/); if (mBr) return { borderRadius: Number(mBr[1]) };
    const mBw = t.match(/^bw(\d+)$/); if (mBw) return { borderWidth: Number(mBw[1]) };

    // Width/Height: w-<n>, h-<n>
    const mW = t.match(/^w-(\d+)$/); if (mW) return { width: Number(mW[1]) };
    const mH = t.match(/^h-(\d+)$/); if (mH) return { height: Number(mH[1]) };

    return null;
  };

  const Cx = (...args) => {
    const out = [];
    const push = (v) => {
      if (!v) return;
      if (Array.isArray(v)) { v.forEach(push); return; }
      if (typeof v === 'string') {
        v.split(/\s+/).forEach((tok) => { const st = tokenToStyle(tok); if (st) out.push(st); });
        return;
      }
      if (typeof v === 'object') out.push(v);
    };
    args.forEach(push);
    return out;
  };

  const CxObj = (...args) => Object.assign({}, ...Cx(...args));

  // Namespaced helpers to avoid auto-import collisions in editors
  const u = {
    color, bg, bc,
    m, mt, mb, ml, mr, mh, mv,
    p, pt, pb, pl, pr, ph, pv,
    f, fw, ta, lh,
    fr, fb, fm, fs,
    row, col, center,
    jc, ai,
    w, h, flex,
    abs, rel,
    top, left, right, bottom,
    br, bw,
    op,
    m1, m2, m3,
    p1, p2, p3,
  };

  return {
    T,
    Tx,
    Cx,
    CxObj,
    u,
    color,
    bg,
    bc,
    m,
    mt,
    mb,
    ml,
    mr,
    p,
    pt,
    pb,
    pl,
    pr,
    f,
    fw,
    ta,
    lh,
    row,
    col,
    center,
    jc,
    ai,
    w,
    h,
    flex,
    abs,
    rel,
    top,
    left,
    right,
    bottom,
    br,
    bw,
    op,
    m1,
    m2,
    m3,
    p1,
    p2,
    p3,
    fr,
    fb,
    fm,
    fs,
    ph,
    pv,
    mh,
    mv,
    gap,
  };
};

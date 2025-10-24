// src/utils/tMiddleware.js
import { useTheme } from "../context/ThemeContext";

/**
 * Combines multiple style objects into one.
 * Usage: T(m2, bg('red'), color('white'))
 */
export const T = (...args) => Object.assign({}, ...args);

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
  const p = (v) => ({ padding: v });
  const pt = (v) => ({ paddingTop: v });
  const pb = (v) => ({ paddingBottom: v });
  const pl = (v) => ({ paddingLeft: v });
  const pr = (v) => ({ paddingRight: v });

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

  return {
    T,
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
  };
};

import { AbsoluteFill } from "remotion";
import { fontFamily, monoFamily } from "../fonts";
import { colors, SITE_URL } from "../theme";
import { useEntrance } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

export const CtaScene: React.FC<SceneProps> = () => {
  const badge = useEntrance(0, 20);
  const url = useEntrance(10, 24);
  const cta = useEntrance(24, 22);
  const note = useEntrance(38, 20);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        <p
          style={{
            ...badge,
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          Product Hunt · Hacker News
        </p>
        <h2
          style={{
            ...url,
            margin: "28px 0 0",
            fontFamily: monoFamily,
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: colors.foreground,
          }}
        >
          {SITE_URL}
        </h2>
        <div
          style={{
            ...cta,
            display: "inline-block",
            marginTop: 44,
            padding: "18px 44px",
            borderRadius: 999,
            background: colors.foreground,
            color: colors.surface,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          Get started free
        </div>
        <p
          style={{
            ...note,
            margin: "36px 0 0",
            fontSize: 18,
            color: colors.muted,
          }}
        >
          Kitchen is a working codename — not the final product name.
        </p>
      </div>
    </AbsoluteFill>
  );
};
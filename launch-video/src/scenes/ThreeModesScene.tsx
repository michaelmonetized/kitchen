import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { fontFamily, monoFamily } from "../fonts";
import { colors } from "../theme";
import { useEntrance, useExit } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

const MODES = [
  {
    title: "Solo live sync",
    when: "You alone, saving normally",
    flow: "Save → version insert → mirror on other devices",
    accent: true,
  },
  {
    title: "Async concurrent",
    when: "Two people save without pairing",
    flow: "Two version heads → fork → Pierre Merge",
    accent: false,
  },
  {
    title: "Live collab",
    when: "Pair programming",
    flow: "Collab agent + relay → checkpoint → version",
    accent: false,
  },
] as const;

export const ThreeModesScene: React.FC<SceneProps> = ({ sceneDurationInFrames }) => {
  const frame = useCurrentFrame();
  const title = useEntrance(0, 22);
  const exit = useExit(Math.max(sceneDurationInFrames - 18, 0), 16);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
        fontFamily,
        opacity: exit.opacity,
      }}
    >
      <div style={{ width: 1500 }}>
        <h2
          style={{
            ...title,
            margin: "0 0 16px",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          Three modes of work
        </h2>
        <p
          style={{
            ...title,
            margin: "0 0 48px",
            fontSize: 22,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          Solo sync, async merge, or live pair — same storage model.
        </p>

        <div style={{ display: "flex", gap: 24 }}>
          {MODES.map((mode, index) => {
            const delay = 18 + index * 16;
            const opacity = interpolate(frame - delay, [0, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            const translateY = interpolate(frame - delay, [0, 22], [32, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });

            return (
              <div
                key={mode.title}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  flex: 1,
                  padding: 28,
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  borderTop: `3px solid ${mode.accent ? colors.accent : colors.borderStrong}`,
                  background: colors.surface,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 600,
                    color: colors.foreground,
                  }}
                >
                  {mode.title}
                </h3>
                <p style={{ margin: "12px 0 0", fontSize: 17, color: colors.muted }}>
                  {mode.when}
                </p>
                <div
                  style={{
                    marginTop: 20,
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: colors.surfaceMuted,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: monoFamily,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: colors.mutedForeground,
                    }}
                  >
                    {mode.flow}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
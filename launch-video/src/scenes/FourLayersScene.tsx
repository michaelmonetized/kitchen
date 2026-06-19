import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { fontFamily } from "../fonts";
import { colors } from "../theme";
import { useEntrance, useExit } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

const LAYERS: Array<{
  title: string;
  subtitle: string;
  highlight?: boolean;
}> = [
  { title: "Sync Store", subtitle: "Storage", highlight: true },
  { title: "WebSockets", subtitle: "Sync" },
  { title: "Mirror", subtitle: "Work" },
  { title: "Any editor", subtitle: "nvim · VS Code · Zed" },
];

const DETAILS = [
  { title: "Files = rows", subtitle: "Versions = append-only history" },
  { title: "Live push in seconds", subtitle: "No commit / push / pull" },
  { title: "$HOME/Projects mirror", subtitle: "Your editor, your terminal" },
] as const;

export const FourLayersScene: React.FC<SceneProps> = ({ sceneDurationInFrames }) => {
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
            margin: "0 0 48px",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          Four layers
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 36,
          }}
        >
          {LAYERS.map((layer, index) => {
            const delay = 12 + index * 14;
            const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            const scale = interpolate(frame - delay, [0, 20], [0.92, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });

            return (
              <div key={layer.title} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    opacity,
                    transform: `scale(${scale})`,
                    flex: 1,
                    padding: "22px 18px",
                    borderRadius: 12,
                    border: `1.5px solid ${layer.highlight ? colors.accent : colors.borderStrong}`,
                    background: layer.highlight ? colors.accentMuted : colors.surface,
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 600,
                      color: colors.foreground,
                    }}
                  >
                    {layer.title}
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 15,
                      color: colors.muted,
                    }}
                  >
                    {layer.subtitle}
                  </p>
                </div>
                {index < LAYERS.length - 1 ? (
                  <div
                    style={{
                      opacity: interpolate(frame - delay - 8, [0, 12], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                      margin: "0 8px",
                      fontSize: 24,
                      color: colors.stone400,
                    }}
                  >
                    →
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: interpolate(frame - 70, [0, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            padding: "24px 28px",
            borderRadius: 12,
            border: `1.5px dashed ${colors.border}`,
            background: "#fafaf9",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.foreground }}>
            Collaboration layer
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 16, color: colors.muted }}>
            Collab relay → Collab agent → checkpoint → version insert
          </p>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {DETAILS.map((detail, index) => {
            const delay = 90 + index * 12;
            const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={detail.title}
                style={{
                  opacity,
                  flex: 1,
                  padding: "22px 20px",
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: colors.foreground }}>
                  {detail.title}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: colors.muted }}>
                  {detail.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
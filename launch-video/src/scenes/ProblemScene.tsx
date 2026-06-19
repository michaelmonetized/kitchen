import { AbsoluteFill } from "remotion";
import { fontFamily, monoFamily } from "../fonts";
import { colors } from "../theme";
import { useEntrance, useExit } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

const OLD_STACK = "Editor → Disk → Git → Remote";
const NEW_STACK = "Sync Store → WebSockets → Mirror → Any editor";

export const ProblemScene: React.FC<SceneProps> = ({ sceneDurationInFrames }) => {
  const title = useEntrance(0, 22);
  const oldBox = useEntrance(10, 24);
  const newBox = useEntrance(28, 24);
  const exit = useExit(Math.max(sceneDurationInFrames - 18, 0), 16);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        fontFamily,
        opacity: exit.opacity,
      }}
    >
      <div style={{ width: 1200 }}>
        <h2
          style={{
            ...title,
            margin: 0,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          One stack. Four layers.
        </h2>
        <p
          style={{
            ...title,
            margin: "16px 0 48px",
            fontSize: 24,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          Storage, sync, work, and collaboration — collapsed into one model.
        </p>

        <div
          style={{
            ...oldBox,
            padding: "28px 32px",
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Today
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: monoFamily,
              fontSize: 26,
              color: colors.mutedForeground,
            }}
          >
            {OLD_STACK}
          </p>
        </div>

        <div
          style={{
            ...newBox,
            padding: "28px 32px",
            borderRadius: 16,
            border: `2px solid ${colors.accent}`,
            background: colors.accentMuted,
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.accent,
            }}
          >
            Kitchen
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: monoFamily,
              fontSize: 26,
              fontWeight: 500,
              color: colors.foreground,
            }}
          >
            {NEW_STACK}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
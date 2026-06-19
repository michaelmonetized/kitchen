import { AbsoluteFill } from "remotion";
import { fontFamily } from "../fonts";
import { colors } from "../theme";
import { useEntrance, useExit } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

export const HookScene: React.FC<SceneProps> = ({ sceneDurationInFrames }) => {
  const line1 = useEntrance(0, 28);
  const line2 = useEntrance(12, 28);
  const punch = useEntrance(30, 24);
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
      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        <p
          style={{
            ...line1,
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          Introducing Kitchen
        </p>
        <h1
          style={{
            ...line2,
            margin: "28px 0 0",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: colors.foreground,
          }}
        >
          Your projects live in the cloud.
          <br />
          <span style={{ color: colors.mutedForeground }}>
            Your editor sees them on disk.
          </span>
        </h1>
        <p
          style={{
            ...punch,
            margin: "40px 0 0",
            fontSize: 42,
            fontWeight: 600,
            color: colors.foreground,
          }}
        >
          There is no git.
        </p>
      </div>
    </AbsoluteFill>
  );
};
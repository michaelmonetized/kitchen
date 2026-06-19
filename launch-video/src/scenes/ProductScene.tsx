import { AbsoluteFill } from "remotion";
import { fontFamily } from "../fonts";
import { colors } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { useEntrance, useExit } from "../components/useEntrance";
import type { SceneProps } from "../scene-types";

const FEATURES = [
  "Live sync — every save is a version row",
  "Human merge — Pierre line-pick when forks happen",
  "Editor-agnostic pair — nvim + VS Code together",
] as const;

export const ProductScene: React.FC<SceneProps> = ({ sceneDurationInFrames }) => {
  const title = useEntrance(0, 22);
  const browser = useEntrance(14, 28);
  const feature0 = useEntrance(24, 20);
  const feature1 = useEntrance(34, 20);
  const feature2 = useEntrance(44, 20);
  const exit = useExit(Math.max(sceneDurationInFrames - 18, 0), 16);
  const featureStyles = [feature0, feature1, feature2];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 100px",
        fontFamily,
        opacity: exit.opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 64,
          width: "100%",
          maxWidth: 1700,
        }}
      >
        <div style={{ flex: "0 0 380px" }}>
          <p
            style={{
              ...title,
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: colors.accent,
            }}
          >
            Web beta
          </p>
          <h2
            style={{
              ...title,
              margin: "16px 0 32px",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: colors.foreground,
            }}
          >
            See it live
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {FEATURES.map((feature, index) => (
                <li
                  key={feature}
                  style={{
                    ...featureStyles[index],
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    marginBottom: 20,
                    fontSize: 20,
                    lineHeight: 1.45,
                    color: colors.mutedForeground,
                  }}
                >
                  <span
                    style={{
                      marginTop: 8,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: colors.accent,
                      flexShrink: 0,
                    }}
                  />
                  {feature}
                </li>
            ))}
          </ul>
        </div>

        <div style={{ ...browser, flex: 1, display: "flex", justifyContent: "center" }}>
          <BrowserFrame
            image="landing-hero.png"
            zoomStart={20}
            zoomEnd={Math.max(sceneDurationInFrames - 20, 60)}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
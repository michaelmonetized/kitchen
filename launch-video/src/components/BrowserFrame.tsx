import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { colors } from "../theme";

type BrowserFrameProps = {
  image: string;
  url?: string;
  zoomStart?: number;
  zoomEnd?: number;
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  image,
  url = "kitchen-gilt-nine.vercel.app",
  zoomStart = 0,
  zoomEnd = 120,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [zoomStart, zoomEnd], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 1500,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 32px 80px rgba(28, 25, 23, 0.14)",
        background: colors.surface,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {["#f87171", "#fbbf24", "#4ade80"].map((dot) => (
            <div
              key={dot}
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: dot,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            marginLeft: 12,
            padding: "8px 16px",
            borderRadius: 8,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            fontSize: 15,
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ overflow: "hidden", height: 780 }}>
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        />
      </div>
    </div>
  );
};
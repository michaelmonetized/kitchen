import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const Background: React.FC<{ accentStrength?: number }> = ({
  accentStrength = 0.35,
}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 1], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.surfaceMuted,
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at ${50 + drift * 4}% ${18 + drift * 2}%, rgba(255, 251, 235, ${accentStrength}) 0%, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 40% at 85% 90%, rgba(214, 211, 209, 0.25) 0%, transparent 70%)",
        }}
      />
    </AbsoluteFill>
  );
};
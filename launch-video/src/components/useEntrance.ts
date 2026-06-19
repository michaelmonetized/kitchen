import { Easing, interpolate, useCurrentFrame } from "remotion";

export const useEntrance = (delay = 0, duration = 24) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const translateY = interpolate(frame - delay, [0, duration], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return { opacity, transform: `translateY(${translateY}px)` };
};

export const useExit = (start: number, duration = 18) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - start, [0, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 1, 1),
  });

  return { opacity };
};
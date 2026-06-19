import "./index.css";
import { Composition } from "remotion";
import { DURATION_IN_FRAMES, FPS, KitchenLaunch } from "./KitchenLaunch";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KitchenLaunch"
        component={KitchenLaunch}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
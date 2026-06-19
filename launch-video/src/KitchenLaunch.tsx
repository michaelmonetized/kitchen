import { AbsoluteFill, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { Background } from "./components/Background";
import { fontFamily } from "./fonts";
import {
  FPS,
  getSceneFrames,
  getSceneOffsets,
  getTotalFrames,
  VOICEOVER_SCENES,
} from "./voiceover-config";

export const DURATION_IN_FRAMES = getTotalFrames();
export { FPS };

export const KitchenLaunch: React.FC = () => {
  const offsets = getSceneOffsets();

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      {VOICEOVER_SCENES.map((scene, index) => {
        const durationInFrames = getSceneFrames(scene);
        const Scene = scene.component;

        return (
          <Sequence
            key={scene.id}
            from={offsets[index]}
            durationInFrames={durationInFrames}
          >
            <Audio src={staticFile(scene.audio)} volume={1} />
            <Scene sceneDurationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
import manifest from "../public/voiceover/manifest.json";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { FourLayersScene } from "./scenes/FourLayersScene";
import { ThreeModesScene } from "./scenes/ThreeModesScene";
import { ProductScene } from "./scenes/ProductScene";
import { CtaScene } from "./scenes/CtaScene";
import type { SceneProps } from "./scene-types";

export type VoiceoverScene = {
  id: string;
  audio: string;
  durationSeconds: number;
  padSeconds: number;
  component: React.FC<SceneProps>;
};

const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {
  "01-hook": HookScene,
  "02-problem": ProblemScene,
  "03-four-layers": FourLayersScene,
  "04-three-modes": ThreeModesScene,
  "05-product": ProductScene,
  "06-cta": CtaScene,
};

export const FPS = manifest.fps;
export const PERSONAL_VOICE_NAME =
  "voiceName" in manifest
    ? (manifest as { voiceName: string }).voiceName
    : "voiceId" in manifest
      ? (manifest as { voiceId: string }).voiceId
      : "Personal Voice";

export const VOICEOVER_SCENES: VoiceoverScene[] = manifest.scenes.map((scene) => ({
  ...scene,
  component: SCENE_COMPONENTS[scene.id],
}));

export const getSceneFrames = (scene: VoiceoverScene) =>
  Math.ceil((scene.durationSeconds + scene.padSeconds) * FPS);

export const getTotalFrames = () =>
  VOICEOVER_SCENES.reduce((sum, scene) => sum + getSceneFrames(scene), 0);

export const getSceneOffsets = () => {
  const offsets: number[] = [];
  let cursor = 0;
  for (const scene of VOICEOVER_SCENES) {
    offsets.push(cursor);
    cursor += getSceneFrames(scene);
  }
  return offsets;
};
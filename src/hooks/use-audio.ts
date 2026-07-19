import { useEffect, useState } from "react";
import * as audio from "@/state/audio-controller";

export function useAudio() {
  const [state, setState] = useState(audio.getState());
  useEffect(() => audio.subscribe(setState), []);
  return {
    ...state,
    play: audio.play,
    stop: audio.stop,
    toggle: (id: string, opts: { seed?: number; durationSec?: number }) => {
      if (state.playingId === id) audio.stop();
      else audio.play(id, opts);
    },
  };
}

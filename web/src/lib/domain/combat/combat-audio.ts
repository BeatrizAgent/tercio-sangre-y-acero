export type CombatSound = "rain" | "arquebus-shot" | "steel-clash" | "ui-confirm" | "result-stamp";

const soundPaths: Record<CombatSound, string> = {
  rain: "/assets/combat/audio/rain.ogg",
  "arquebus-shot": "/assets/combat/audio/arquebus-shot.ogg",
  "steel-clash": "/assets/combat/audio/steel-clash.ogg",
  "ui-confirm": "/assets/combat/audio/ui-confirm.ogg",
  "result-stamp": "/assets/combat/audio/result-stamp.ogg",
};

export async function playCombatSound(sound: CombatSound) {
  if (typeof window === "undefined") return;
  const enabled = window.localStorage.getItem("tercio-combat-audio") === "enabled";
  if (!enabled) return;
  try {
    const { Howl } = await import("howler");
    const howl = new Howl({
      src: [soundPaths[sound]],
      volume: sound === "rain" ? 0.18 : 0.5,
      html5: false,
      onloaderror: () => howl.unload(),
      onplayerror: () => howl.unload(),
    });
    howl.play();
  } catch {
    // Missing files, blocked audio, or optional dependency issues must not break combat resolution.
  }
}

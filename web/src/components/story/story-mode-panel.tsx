"use client";

// StoryModePanel: visual-novel style story viewer. Full-bleed scene, dialogue
// box at the bottom, choices inline, outcome rendered as an overlay on the
// same scene. No redundant rails/asides. Item rewards are delivered to the
// mailbox by the server action when a database is active.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FastForward, MessageSquare } from "lucide-react";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { prepareActionGateAction } from "@/lib/actions/gate";
import { resolveStoryChoiceAction } from "@/lib/actions/story";
import { featuredAssetPaths, getAssetPathById, getItem, prologueStoryArc } from "@/lib/game-data";
import { getPlayerPortraitPathById } from "@/lib/data/player-portraits";
import { processChapterForBackground } from "@/lib/domain/story";
import type { GameState, StatId, StoryChapter, StoryChoice, StoryDialogueLine, StoryProgress } from "@/lib/types";

type StoryState = Pick<GameState, "soldier" | "storyProgress">;

interface StoryOutcome {
  chapterTitle: string;
  choiceLabel: string;
  resultText: string;
  message: string;
  reportId?: string;
  effects: StoryChoice["effects"];
}

const STAT_LABELS: Record<StatId, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

type UiIconId = React.ComponentProps<typeof UiAssetIcon>["id"];

interface RewardChip {
  key: string;
  label: string;
  value: string;
  iconId?: UiIconId;
  imageSrc?: string;
  tone?: "good" | "bad" | "neutral";
}

const SCENE_MIN_HEIGHT = "min-h-[calc(100vh-13rem)]";

export function StoryModePanel({
  state,
  onHydrate,
  onOpenCampaign,
}: {
  state: StoryState;
  onHydrate: (state: GameState) => void;
  onOpenCampaign: () => void;
}) {
  const progress = normalizeProgress(state.storyProgress);
  const complete = prologueStoryArc.chapters.every((chapter) => progress.completedChapterIds.includes(chapter.id));
  const rawActiveChapter =
    prologueStoryArc.chapters.find((chapter) => chapter.id === progress.currentChapterId) ??
    prologueStoryArc.chapters[0];
  const activeChapter = useMemo(
    () => processChapterForBackground(rawActiveChapter, state.soldier.background, state.soldier.name),
    [rawActiveChapter, state.soldier.background, state.soldier.name],
  );

  return (
    <section className="flex flex-col gap-3">
      <StoryHeader progress={progress} activeChapterId={activeChapter.id} />

      {complete ? (
        <StoryCompletePanel progress={progress} onOpenCampaign={onOpenCampaign} />
      ) : (
        <StoryChapterView
          key={activeChapter.id}
          chapter={activeChapter}
          soldierName={state.soldier.name}
          soldierPortraitId={state.soldier.portraitAssetId}
          onHydrate={onHydrate}
        />
      )}
    </section>
  );
}

function StoryChapterView({
  chapter,
  soldierName,
  soldierPortraitId,
  onHydrate,
}: {
  chapter: StoryChapter;
  soldierName: string;
  soldierPortraitId?: string;
  onHydrate: (state: GameState) => void;
}) {
  const [busyChoice, setBusyChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<StoryOutcome | null>(null);
  const [pendingHydrate, setPendingHydrate] = useState<GameState | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const dialogueLines = chapter.dialogue ?? [];
  const choiceStep = dialogueLines.length + 1;
  const isChoiceStep = currentStep >= choiceStep && !outcome;
  const currentDialogue = !isChoiceStep && currentStep > 0 ? dialogueLines[currentStep - 1] : null;

  const advance = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, choiceStep));
  }, [choiceStep]);

  const nextChapter = useCallback(() => {
    if (pendingHydrate) onHydrate(pendingHydrate);
    setPendingHydrate(null);
    setOutcome(null);
    setCurrentStep(0);
  }, [pendingHydrate, onHydrate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (outcome) return;
      const active = document.activeElement?.tagName;
      if (active === "INPUT" || active === "TEXTAREA" || active === "BUTTON") return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advance, outcome]);

  const resolveChoice = async (choice: StoryChoice) => {
    if (busyChoice) return;
    setBusyChoice(choice.id);
    setError(null);
    try {
      const gate = await prepareActionGateAction({ kind: "story", targetId: `${chapter.id}:${choice.id}` });
      const result = await resolveStoryChoiceAction({
        chapterId: chapter.id,
        choiceId: choice.id,
        gateToken: gate.token,
      });

      if (result.ok && result.data?.state) {
        setOutcome({
          chapterTitle: chapter.title,
          choiceLabel: choice.label,
          resultText: choice.resultText,
          message: result.message,
          reportId: result.data.reportId,
          effects: choice.effects,
        });
        setPendingHydrate(result.data.state);
      } else {
        setError(result.message);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo resolver la historia.");
    } finally {
      setBusyChoice(null);
    }
  };

  return (
    <StoryNovelScene
      chapter={chapter}
      soldierName={soldierName}
      soldierPortraitId={soldierPortraitId}
      currentStep={currentStep}
      choiceStep={choiceStep}
      currentDialogue={currentDialogue}
      onAdvance={advance}
      onSkip={() => setCurrentStep(choiceStep)}
      outcome={outcome}
      error={error}
      busyChoice={busyChoice}
      onResolve={(choice) => void resolveChoice(choice)}
      onNext={nextChapter}
    />
  );
}

function StoryHeader({ progress, activeChapterId }: { progress: StoryProgress; activeChapterId: string }) {
  const activeIndex = prologueStoryArc.chapters.findIndex((chapter) => chapter.id === activeChapterId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xs border border-iron/60 bg-stone-950/80 px-3 py-2">
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-widest text-gold/70">Modo historia</p>
        <h2 className="truncate font-cinzel text-sm font-bold uppercase tracking-wider text-gold-soft">
          {prologueStoryArc.title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ol className="hidden items-center gap-1 sm:flex">
          {prologueStoryArc.chapters.map((chapter, index) => {
            const isCompleted = progress.completedChapterIds.includes(chapter.id);
            const isActive = chapter.id === activeChapterId;
            return (
              <li
                key={chapter.id}
                title={`Cap. ${index + 1} — ${chapter.title}`}
                className={`h-1.5 w-6 rounded-full ${
                  isCompleted ? "bg-success" : isActive ? "bg-gold" : "bg-iron/40"
                }`}
              />
            );
          })}
        </ol>
        <span className="rounded-xs border border-iron px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {progress.completedChapterIds.length}/{prologueStoryArc.chapters.length}
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-widest text-text-muted md:inline">
          Cap. {Math.max(1, activeIndex + 1)}
        </span>
      </div>
    </div>
  );
}

function StoryNovelScene({
  chapter,
  soldierName,
  soldierPortraitId,
  currentStep,
  choiceStep,
  currentDialogue,
  onAdvance,
  onSkip,
  outcome,
  error,
  busyChoice,
  onResolve,
  onNext,
}: {
  chapter: StoryChapter;
  soldierName: string;
  soldierPortraitId?: string;
  currentStep: number;
  choiceStep: number;
  currentDialogue: StoryDialogueLine | null;
  onAdvance: () => void;
  onSkip: () => void;
  outcome: StoryOutcome | null;
  error: string | null;
  busyChoice: string | null;
  onResolve: (choice: StoryChoice) => void;
  onNext: () => void;
}) {
  const scenePath = getAssetPathById(chapter.sceneAssetId) ?? "/assets/gpt-bank/scenes/events/story_castilla_choza_hermanos.png";
  const isChoiceStep = currentStep >= choiceStep && !outcome;
  const activeSpeakerId = currentDialogue?.speakerId;
  const npcCharacter = getVisibleNpc(chapter, activeSpeakerId);
  const playerSpeaking = activeSpeakerId === "diego";
  const npcSpeaking = Boolean(activeSpeakerId && activeSpeakerId !== "diego");
  const playerPortrait =
    getPlayerPortraitPathById(soldierPortraitId) ?? "/assets/gpt-bank/characters/diego/portraits/diego_retrato_serio.png";
  const npcPortrait = getStoryPortraitPath(npcCharacter?.portraitAssetId);
  const showPortraits = !outcome;

  return (
    <div
      role="dialog"
      aria-label={chapter.title}
      className={`relative ${SCENE_MIN_HEIGHT} overflow-hidden rounded-xs border border-gold/45 bg-stone-950 shadow-2xl`}
    >
      <img
        src={scenePath}
        alt=""
        className={`absolute inset-0 h-full w-full scale-105 object-cover opacity-45 ${chapter.presentation === "blurred" ? "blur-md" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-stone-950/75" />

      <div className={`relative z-10 flex ${SCENE_MIN_HEIGHT} flex-col`}>
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex items-start justify-between gap-3">
          <span className="rounded-xs border border-gold/35 bg-stone-950/78 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-gold-soft backdrop-blur-sm">
            {chapter.title}
          </span>
          {!isChoiceStep && !outcome && (
            <button
              type="button"
              onClick={onSkip}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-xs border border-iron/50 bg-stone-950/78 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-text-muted backdrop-blur-sm transition hover:border-gold/60 hover:text-gold"
            >
              <FastForward className="h-3 w-3" />
              Saltar
            </button>
          )}
        </div>

        <div className="grid flex-1 items-end gap-2 px-4 pt-16 md:grid-cols-2 md:px-12 md:pt-20">
          {showPortraits && (
            <StoryPortrait
              name={soldierName}
              src={playerPortrait}
              active={playerSpeaking || currentStep === 0}
              muted={isChoiceStep || (Boolean(activeSpeakerId) && !playerSpeaking)}
            />
          )}
          {showPortraits && npcCharacter && (
            <StoryPortrait
              name={npcCharacter.name}
              src={npcPortrait ?? playerPortrait}
              active={npcSpeaking || currentStep === 0}
              muted={isChoiceStep || (Boolean(activeSpeakerId) && !npcSpeaking)}
              memory={npcCharacter.id === "mother"}
            />
          )}
        </div>

        <div className="p-3 md:p-4">
          {outcome ? (
            <StoryOutcomeCard outcome={outcome} onNext={onNext} busy={busyChoice !== null} />
          ) : error ? (
            <div className="relative w-full rounded-xs border border-danger/40 bg-stone-950/92 p-4 text-left shadow-2xl backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-widest text-danger">{error}</p>
            </div>
          ) : isChoiceStep ? (
            <StoryChoiceList chapter={chapter} busyChoice={busyChoice} onResolve={onResolve} />
          ) : (
            <button
              type="button"
              onClick={onAdvance}
              className="relative w-full rounded-xs border border-gold/45 bg-stone-950/92 p-4 text-left shadow-2xl backdrop-blur-md transition hover:border-gold"
            >
              <span className="absolute -top-3 left-4 rounded-xs border border-gold-soft bg-gold px-3 py-0.5 font-cinzel text-[9px] font-bold uppercase tracking-wider text-stone-950">
                {speakerLabel(chapter, currentDialogue, soldierName, isChoiceStep)}
              </span>
              <p className="mt-1 min-h-16 font-serif text-sm leading-relaxed text-stone-100 md:text-base">
                {currentStep === 0 && chapter.text}
                {currentDialogue && `"${currentDialogue.text}"`}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-gold/70">
                <MessageSquare className="h-3 w-3" />
                Continuar
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryPortrait({
  name,
  src,
  active,
  muted,
  memory = false,
}: {
  name: string;
  src: string;
  active: boolean;
  muted: boolean;
  memory?: boolean;
}) {
  return (
    <div
      className={`flex origin-bottom flex-col items-center transition duration-500 ${
        active ? "translate-y-0 scale-105 opacity-100" : muted ? "translate-y-4 scale-95 opacity-45" : "opacity-80"
      } ${memory ? "sepia" : ""}`}
    >
      <img
        src={src}
        alt={name}
        className="h-52 w-52 object-contain object-bottom drop-shadow-[0_14px_22px_rgba(0,0,0,0.9)] md:h-80 md:w-80"
      />
      <span className="mt-1 rounded-full border border-gold/25 bg-stone-950/90 px-3 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-gold">
        {name}
      </span>
    </div>
  );
}

function StoryChoiceList({
  chapter,
  busyChoice,
  onResolve,
}: {
  chapter: StoryChapter;
  busyChoice: string | null;
  onResolve: (choice: StoryChoice) => void;
}) {
  return (
    <div className="relative w-full space-y-2 rounded-xs border border-gold/45 bg-stone-950/92 p-4 text-left shadow-2xl backdrop-blur-md">
      <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-xs border border-gold-soft bg-gold px-3 py-0.5 font-cinzel text-[9px] font-bold uppercase tracking-wider text-stone-950">
        <UiAssetIcon id="order" label="" className="h-3.5 w-3.5" />
        Decisión
      </span>
      <p className="mt-1 mb-2 font-serif text-sm leading-relaxed text-stone-100 md:text-base">
        Elige cómo proceder. Tu decisión cambia a Diego.
      </p>
      <div className="grid gap-2">
        {chapter.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={Boolean(busyChoice)}
            onClick={() => onResolve(choice)}
            style={{ clipPath: "polygon(2% 0, 100% 0, 98% 100%, 0 100%)" }}
            className={`group w-full border px-5 py-3 text-left shadow-xl backdrop-blur-md transition ${
              busyChoice === choice.id
                ? "border-gold bg-gold/10"
                : "border-gold/45 bg-black/85 hover:-translate-y-0.5 hover:border-gold hover:bg-stone-950/95"
            } disabled:cursor-not-allowed`}
          >
            <span className="flex items-center gap-3">
              <UiAssetIcon
                id={busyChoice === choice.id ? "order" : "confirm"}
                label=""
                className="h-7 w-7 shrink-0 transition group-hover:scale-105"
              />
              <span className="font-cinzel text-sm font-bold text-stone-100 md:text-base">{choice.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoryOutcomeCard({ outcome, onNext, busy }: { outcome: StoryOutcome; onNext: () => void; busy: boolean }) {
  const chips = rewardChips(outcome.effects);
  const mailedItems = chips.filter((chip) => chip.imageSrc && chip.tone === "good");
  return (
    <div className="relative w-full rounded-xs border border-gold/50 bg-stone-950/95 p-5 text-left shadow-2xl backdrop-blur-md">
      <span className="absolute -top-3 left-4 rounded-xs border border-gold-soft bg-gold px-3 py-0.5 font-cinzel text-[9px] font-bold uppercase tracking-wider text-stone-950">
        {outcome.chapterTitle}
      </span>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gold">{outcome.message}</p>
      <p className="mt-2 font-serif text-sm leading-relaxed text-stone-100 md:text-base">
        <span className="font-semibold text-gold-soft">{outcome.choiceLabel}.</span> {outcome.resultText}
      </p>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <StoryRewardChip key={chip.key} chip={chip} />
          ))}
        </div>
      )}
      {mailedItems.length > 0 && (
        <p className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-gold/70">
          <UiAssetIcon id="mailbox" label="" className="h-3.5 w-3.5" />
          Objetos enviados al buzón
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="blood-button inline-flex items-center justify-center gap-2 px-3 py-2 text-xs"
        >
          <ArrowRight className="h-4 w-4" />
          Siguiente capítulo
        </button>
        {outcome.reportId && (
          <Link
            href={`/reports/${outcome.reportId}`}
            className="inline-flex items-center justify-center rounded-xs border border-iron px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted transition hover:border-gold/60 hover:text-gold"
          >
            Ver reporte
          </Link>
        )}
        <Link
          href="/mailbox"
          className="inline-flex items-center justify-center rounded-xs border border-iron px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted transition hover:border-gold/60 hover:text-gold"
        >
          Abrir buzón
        </Link>
      </div>
    </div>
  );
}

function StoryRewardChip({ chip }: { chip: RewardChip }) {
  const toneClass =
    chip.tone === "bad"
      ? "border-danger/35 bg-danger/10 text-danger"
      : chip.tone === "good"
        ? "border-gold/40 bg-gold/10 text-gold-soft"
        : "border-iron/60 bg-stone-950/80 text-text-muted";

  return (
    <span
      title={`${chip.label}: ${chip.value}`}
      aria-label={`${chip.label}: ${chip.value}`}
      className={`inline-flex items-center gap-1 rounded-xs border font-mono font-bold uppercase tracking-wider px-2 py-1 text-[10px] ${toneClass}`}
    >
      {chip.imageSrc ? (
        <img src={chip.imageSrc} alt="" className="h-5 w-5 shrink-0 object-contain" />
      ) : chip.iconId ? (
        <UiAssetIcon id={chip.iconId} label="" className="h-5 w-5 shrink-0" />
      ) : null}
      <span className="leading-none">{chip.value}</span>
    </span>
  );
}

function StoryCompletePanel({
  progress,
  onOpenCampaign,
}: {
  progress: StoryProgress;
  onOpenCampaign: () => void;
}) {
  return (
    <div
      className={`relative ${SCENE_MIN_HEIGHT} overflow-hidden rounded-xs border border-gold/50 bg-stone-950 shadow-2xl`}
    >
      <img
        src={featuredAssetPaths.campaignMap}
        alt="Mapa de campaña desbloqueado"
        className="h-full min-h-[360px] w-full object-cover opacity-65"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <span className="mb-2 inline-flex rounded-xs border border-success/50 bg-success/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-success">
          Prólogo cerrado
        </span>
        <h3 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-gold">Diego ya no vuelve igual</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
          La aldea queda atrás. La deuda, el barro y la primera sangre ya pesan en la mochila.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenCampaign} className="blood-button inline-flex items-center gap-2 px-4 py-2 text-xs">
            <UiAssetIcon id="missions" label="" className="h-5 w-5" />
            Abrir campaña
          </button>
          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-xs border border-iron px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted transition hover:border-gold/60 hover:text-gold"
          >
            Ver reportes
          </Link>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {prologueStoryArc.chapters.map((chapter, index) => {
            const choice = chapter.choices.find((entry) => entry.id === progress.choices[chapter.id]);
            return (
              <li key={chapter.id} className="rounded-xs border border-iron/60 bg-stone-950/70 p-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Cap. {index + 1}</p>
                <p className="mt-0.5 font-cinzel text-xs font-bold uppercase text-gold-soft">{chapter.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                  {choice?.label ?? "Sin decisión registrada"}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function rewardChips(effects: StoryChoice["effects"]): RewardChip[] {
  const chips: RewardChip[] = [];
  if (effects.xp !== undefined) chips.push(makeRewardChip("xp", "XP", signed(effects.xp), "xp", effects.xp));
  if (effects.coins !== undefined) chips.push(makeRewardChip("coins", "Doblones", signed(effects.coins), "coins", effects.coins));
  if (effects.honor !== undefined) chips.push(makeRewardChip("honor", "Honor", signed(effects.honor), "honor", effects.honor));
  if (effects.fatigue !== undefined) chips.push(makeRewardChip("fatigue", "Fatiga", signed(effects.fatigue), "fatigue", -effects.fatigue));
  if (effects.reputation !== undefined) {
    chips.push(makeRewardChip("reputation", "Reputación", signed(effects.reputation), "rank", effects.reputation));
  }
  if (effects.corruption !== undefined) {
    chips.push(makeRewardChip("corruption", "Corrupción", signed(effects.corruption), "risk", -effects.corruption));
  }
  for (const [stat, value] of Object.entries(effects.stats ?? {})) {
    if (value) {
      const statId = stat as StatId;
      chips.push({
        key: `stat-${statId}`,
        label: STAT_LABELS[statId],
        value: signed(value),
        iconId: statRewardIcon(statId),
        tone: value > 0 ? "good" : "bad",
      });
    }
  }
  for (const item of effects.items ?? []) {
    const definition = getItem(item.itemId);
    chips.push({
      key: `item-${item.itemId}`,
      label: definition?.name ?? item.itemId,
      value: `+${item.quantity}`,
      imageSrc: getAssetPathById(definition?.assetId),
      iconId: "inventory",
      tone: "good",
    });
  }
  for (const [slot, itemId] of Object.entries(effects.equipment ?? {})) {
    if (itemId) {
      const definition = getItem(itemId);
      chips.push({
        key: `equipment-${slot}-${itemId}`,
        label: `Equipa ${slot}: ${definition?.name ?? itemId}`,
        value: definition?.name ?? itemId,
        imageSrc: getAssetPathById(definition?.assetId),
        iconId: "equipment",
        tone: "good",
      });
    }
  }
  if (effects.wound) {
    chips.push({ key: "wound", label: "Herida", value: "Herida", iconId: "wound", tone: "bad" });
  }
  return chips.length > 0
    ? chips
    : [{ key: "none", label: "Sin cambios directos", value: "Sin cambios", iconId: "info", tone: "neutral" }];
}

function makeRewardChip(key: string, label: string, value: string, iconId: UiIconId, toneValue: number): RewardChip {
  return {
    key,
    label,
    value,
    iconId,
    tone: toneValue > 0 ? "good" : toneValue < 0 ? "bad" : "neutral",
  };
}

function statRewardIcon(stat: StatId): UiIconId {
  switch (stat) {
    case "pike":
    case "command":
      return "missions";
    case "sword":
      return "arena";
    case "arquebus":
      return "armory";
    case "discipline":
      return "rank";
    case "vigor":
      return "xp";
    case "cunning":
      return "battleReports";
  }
}

function normalizeProgress(progress: StoryProgress | undefined): StoryProgress {
  return (
    progress ?? {
      arcId: prologueStoryArc.id,
      currentChapterId: prologueStoryArc.chapters[0]?.id ?? "",
      completedChapterIds: [],
      choices: {},
    }
  );
}

function getVisibleNpc(chapter: StoryChapter, speakerId: string | undefined) {
  if (speakerId && speakerId !== "diego") {
    return chapter.characters?.find((character) => character.id === speakerId);
  }
  return chapter.characters?.find((character) => character.id !== "diego");
}

function getStoryPortraitPath(assetId: string | undefined) {
  if (!assetId) return undefined;
  if (assetId.startsWith("/")) return assetId;
  return getAssetPathById(assetId) ?? (assetId.startsWith("story_") ? `/assets/gpt-bank/portraits/story/${assetId}.png` : undefined);
}

function speakerLabel(
  chapter: StoryChapter,
  dialogue: StoryDialogueLine | null,
  soldierName: string,
  isChoiceStep: boolean,
) {
  if (isChoiceStep) return "Decisión";
  if (!dialogue) return "Narrador";
  if (dialogue.speakerId === "diego") return soldierName;
  return chapter.characters?.find((character) => character.id === dialogue.speakerId)?.name ?? dialogue.speakerId;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

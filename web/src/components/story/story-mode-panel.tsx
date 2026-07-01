"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FastForward, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
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

const STORY_ACTS = [
  {
    id: 1,
    title: "Acto 1: Castilla",
    subtitle: "La leva de Castilla",
    description: "Origen, familia, deuda y primer equipo.",
    active: true,
  },
  {
    id: 2,
    title: "Acto 2: El camino español",
    subtitle: "Génova a Milán",
    description: "Marcha, hambre y paga pendiente.",
    active: false,
  },
  {
    id: 3,
    title: "Acto 3: Flandes en llamas",
    subtitle: "Flandes y el Rin",
    description: "Frío, trincheras y disciplina.",
    active: false,
  },
  {
    id: 4,
    title: "Acto 4: El asedio de Breda",
    subtitle: "Picas contra murallas",
    description: "Cerco largo bajo barro y pólvora.",
    active: false,
  },
  {
    id: 5,
    title: "Acto 5: Rocroi",
    subtitle: "El ocaso",
    description: "La última prueba del viejo tercio.",
    active: false,
  },
];

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

export function StoryModePanel({
  state,
  onHydrate,
  onOpenCampaign,
}: {
  state: StoryState;
  onHydrate: (state: GameState) => void;
  onOpenCampaign: () => void;
}) {
  const [busyChoice, setBusyChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPuzzleOptionIds, setSelectedPuzzleOptionIds] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<StoryOutcome | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const progress = normalizeProgress(state.storyProgress);
  const complete = prologueStoryArc.chapters.every((chapter) => progress.completedChapterIds.includes(chapter.id));
  const rawActiveChapter =
    prologueStoryArc.chapters.find((chapter) => chapter.id === progress.currentChapterId) ??
    prologueStoryArc.chapters[0];
  const activeChapter = useMemo(
    () => processChapterForBackground(rawActiveChapter, state.soldier.background, state.soldier.name),
    [rawActiveChapter, state.soldier.background, state.soldier.name],
  );

  const dialogueLines = activeChapter.dialogue ?? [];
  const choiceStep = dialogueLines.length + 1;
  const isChoiceStep = currentStep >= choiceStep;
  const currentDialogue = !isChoiceStep && currentStep > 0 ? dialogueLines[currentStep - 1] : null;
  const puzzleSolved = activeChapter.puzzle ? arraysEqual(selectedPuzzleOptionIds, activeChapter.puzzle.answer) : true;
  const choiceGridClass = activeChapter.puzzle
    ? "grid gap-3 lg:grid-cols-[minmax(240px,0.8fr)_minmax(280px,1fr)]"
    : "mx-auto grid max-w-3xl gap-3";
  const hasAside = Boolean(outcome || error);

  useEffect(() => {
    setCurrentStep(0);
    setSelectedPuzzleOptionIds([]);
    setError(null);
  }, [activeChapter.id]);

  const advance = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, choiceStep));
  }, [choiceStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement?.tagName;
      if (active === "INPUT" || active === "TEXTAREA" || active === "BUTTON") return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advance]);

  const resolveChoice = async (chapter: StoryChapter, choice: StoryChoice) => {
    if (busyChoice) return;
    setBusyChoice(choice.id);
    setError(null);
    try {
      const gate = await prepareActionGateAction({ kind: "story", targetId: `${chapter.id}:${choice.id}` });
      const result = await resolveStoryChoiceAction({
        chapterId: chapter.id,
        choiceId: choice.id,
        puzzleAnswer: chapter.puzzle ? selectedPuzzleOptionIds : undefined,
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
        onHydrate(result.data.state);
      } else {
        setError(result.message);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo resolver la historia.");
    } finally {
      setBusyChoice(null);
    }
  };

  const togglePuzzleOption = (optionId: string) => {
    setSelectedPuzzleOptionIds((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
    );
  };

  return (
    <section className="space-y-4">
      <StoryHeader progress={progress} />
      <StoryChapterRail progress={progress} activeChapterId={activeChapter.id} />

      {complete ? (
        <StoryCompletePanel progress={progress} onOpenCampaign={onOpenCampaign} />
      ) : (
        <div className={`grid gap-4 ${hasAside ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          <div className="space-y-3">
            <StoryNovelScene
              chapter={activeChapter}
              soldierName={state.soldier.name}
              soldierPortraitId={state.soldier.portraitAssetId}
              currentStep={currentStep}
              choiceStep={choiceStep}
              currentDialogue={currentDialogue}
              onAdvance={advance}
              onSkip={() => setCurrentStep(choiceStep)}
              choiceContent={
                <div className={choiceGridClass}>
                  <StoryPuzzleControls
                    chapter={activeChapter}
                    selectedOptionIds={selectedPuzzleOptionIds}
                    solved={puzzleSolved}
                    onToggle={togglePuzzleOption}
                  />
                  <StoryChoiceList
                    state={state}
                    chapter={activeChapter}
                    puzzleSolved={puzzleSolved}
                    busyChoice={busyChoice}
                    onResolve={(choice) => void resolveChoice(activeChapter, choice)}
                  />
                </div>
              }
            />
          </div>

          {hasAside && (
            <aside className="space-y-3">
              {outcome && <StoryOutcomePanel outcome={outcome} onNext={advance} />}
              {error && (
                <div className="rounded-xs border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-danger">
                  {error}
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      <StoryActRail />
    </section>
  );
}

function StoryHeader({ progress }: { progress: StoryProgress }) {
  return (
    <div className="page-header">
      <div>
        <p className="page-header__eyebrow">Modo historia</p>
        <h2 className="page-header__title">{prologueStoryArc.title}</h2>
        <p className="page-header__subtitle">{prologueStoryArc.subtitle}</p>
      </div>
      <span className="rounded-xs border border-iron px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {progress.completedChapterIds.length}/{prologueStoryArc.chapters.length}
      </span>
    </div>
  );
}

function StoryChapterRail({
  progress,
  activeChapterId,
}: {
  progress: StoryProgress;
  activeChapterId: string;
}) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
      {prologueStoryArc.chapters.map((chapter, index) => {
        const isCompleted = progress.completedChapterIds.includes(chapter.id);
        const isActive = chapter.id === activeChapterId;
        const stateIcon = isCompleted ? "confirm" : isActive ? storyChapterIcon(index) : "risk";
        return (
          <li
            key={chapter.id}
            className={`relative flex min-h-20 min-w-0 flex-col justify-between overflow-hidden rounded-xs border px-2 py-2 font-mono text-[9px] uppercase leading-tight ${
              isCompleted
                ? "border-success/50 bg-success/10 text-success"
                : isActive
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-iron/30 bg-stone-950/70 text-text-muted opacity-55"
            }`}
          >
            <div className="flex items-start gap-2">
              <UiAssetIcon id={stateIcon} label="" className="h-7 w-7 opacity-95" />
              <div className="min-w-0">
                <span className="block text-[8px] text-text-muted">Cap. {index + 1}</span>
                <span className="block truncate font-bold">{chapter.title}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="h-1.5 flex-1 rounded-full bg-black/60 ring-1 ring-inset ring-iron/30">
                <span
                  className={`block h-full rounded-full ${isCompleted ? "bg-success" : isActive ? "bg-gold" : "bg-iron/50"}`}
                  style={{ width: isCompleted ? "100%" : isActive ? "55%" : "12%" }}
                />
              </span>
              <span className="shrink-0 text-[7px]">{isCompleted ? "Resuelto" : isActive ? "Activo" : "Bloqueado"}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StoryNovelScene({
  chapter,
  soldierName,
  soldierPortraitId,
  currentStep,
  choiceStep,
  currentDialogue,
  choiceContent,
  onAdvance,
  onSkip,
}: {
  chapter: StoryChapter;
  soldierName: string;
  soldierPortraitId?: string;
  currentStep: number;
  choiceStep: number;
  currentDialogue: StoryDialogueLine | null;
  choiceContent: React.ReactNode;
  onAdvance: () => void;
  onSkip: () => void;
}) {
  const scenePath = getAssetPathById(chapter.sceneAssetId) ?? "/assets/gpt-bank/scenes/events/story_castilla_choza_hermanos.png";
  const isChoiceStep = currentStep >= choiceStep;
  const activeSpeakerId = currentDialogue?.speakerId;
  const npcCharacter = getVisibleNpc(chapter, activeSpeakerId);
  const playerSpeaking = activeSpeakerId === "diego";
  const npcSpeaking = Boolean(activeSpeakerId && activeSpeakerId !== "diego");
  const playerPortrait =
    getPlayerPortraitPathById(soldierPortraitId) ?? "/assets/gpt-bank/characters/diego/portraits/diego_retrato_serio.png";
  const npcPortrait = getStoryPortraitPath(npcCharacter?.portraitAssetId);

  return (
    <div
      role="dialog"
      aria-label={chapter.title}
      className="relative min-h-[620px] overflow-hidden rounded-xs border border-gold/45 bg-stone-950 shadow-2xl"
    >
      <img
        src={scenePath}
        alt=""
        className={`absolute inset-0 h-full w-full scale-105 object-cover opacity-45 ${chapter.presentation === "blurred" ? "blur-md" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-stone-950/75" />

      <div className="relative z-10 flex min-h-[620px] flex-col justify-between">
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex items-start justify-between gap-3">
          <span className="rounded-xs border border-gold/35 bg-stone-950/78 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-gold-soft backdrop-blur-sm">
            {chapter.title}
          </span>
          {!isChoiceStep && (
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

        {isChoiceStep && (
          <div className="absolute left-1/2 top-1/2 z-20 w-[min(92%,760px)] -translate-x-1/2 -translate-y-1/2 px-2 md:px-0">
            {choiceContent}
          </div>
        )}

        <div className="grid flex-1 items-end gap-2 px-4 pt-16 md:grid-cols-2 md:px-12 md:pt-20">
          <StoryPortrait
            name={soldierName}
            src={playerPortrait}
            active={playerSpeaking || currentStep === 0}
            muted={isChoiceStep || (Boolean(activeSpeakerId) && !playerSpeaking)}
          />
          {npcCharacter && (
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
          {isChoiceStep ? (
            <div className="relative w-full rounded-xs border border-gold/45 bg-stone-950/92 p-4 text-left shadow-2xl backdrop-blur-md">
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-xs border border-gold-soft bg-gold px-3 py-0.5 font-cinzel text-[9px] font-bold uppercase tracking-wider text-stone-950">
                <UiAssetIcon id="order" label="" className="h-3.5 w-3.5" />
                {speakerLabel(chapter, currentDialogue, soldierName, isChoiceStep)}
              </span>
              <p className="mt-1 min-h-14 font-serif text-sm leading-relaxed text-stone-100 md:text-base">
                {chapter.puzzle ? chapter.puzzle.prompt : "Elige cómo proceder. Tu decisión cambia a Diego."}
              </p>
            </div>
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

function StoryPuzzleControls({
  chapter,
  selectedOptionIds,
  solved,
  onToggle,
}: {
  chapter: StoryChapter;
  selectedOptionIds: string[];
  solved: boolean;
  onToggle: (optionId: string) => void;
}) {
  if (!chapter.puzzle) return null;

  const selectedLabels = selectedOptionIds
    .map((id) => chapter.puzzle?.options.find((option) => option.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="rounded-xs border border-iron/70 bg-stone-950/88 p-3 shadow-2xl backdrop-blur-md">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UiAssetIcon id={solved ? "confirm" : "order"} label="" className="h-5 w-5" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-gold-soft">
            {chapter.puzzle.title}
          </p>
        </div>
        <div className="grid gap-2">
          {chapter.puzzle.options.map((option) => {
            const selectedIndex = selectedOptionIds.indexOf(option.id);
            const selected = selectedIndex >= 0;
            return (
              <label
                key={option.id}
                className={`relative cursor-pointer rounded-xs border px-3 py-2 transition ${
                  selected
                    ? "border-gold bg-gold/10 text-gold-soft"
                    : "border-iron bg-black/55 text-text-muted hover:border-gold/50"
                }`}
              >
                <input type="checkbox" checked={selected} onChange={() => onToggle(option.id)} className="sr-only" />
                <span className="block pr-8 font-cinzel text-sm font-bold">{option.label}</span>
                {option.description && <span className="mt-1 block text-xs leading-relaxed">{option.description}</span>}
                {selected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold font-mono text-[10px] font-bold text-stone-950">
                    {selectedIndex + 1}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <div className="rounded-xs border border-iron/50 bg-stone-950/70 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
          {selectedLabels.length > 0 ? `Orden: ${selectedLabels.join(" > ")}` : "Selecciona en orden"}
        </div>
        <div className={`rounded-xs border px-3 py-2 font-mono text-[9px] uppercase tracking-widest ${solved ? "border-success/50 bg-success/10 text-success" : "border-warning/50 bg-warning/10 text-warning"}`}>
          {solved ? "Puzle resuelto. Decide." : "Pendiente. La decisión sigue bloqueada."}
        </div>
      </div>
    </div>
  );
}

function StoryChoiceList({
  state,
  chapter,
  puzzleSolved,
  busyChoice,
  onResolve,
}: {
  state: StoryState;
  chapter: StoryChapter;
  puzzleSolved: boolean;
  busyChoice: string | null;
  onResolve: (choice: StoryChoice) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-xs border border-gold/25 bg-stone-950/85 px-3 py-1 shadow-2xl backdrop-blur-md">
        <UiAssetIcon id="order" label="" className="h-5 w-5" />
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-gold-soft">Decisión</p>
      </div>
      <div className="space-y-3">
        {chapter.choices.map((choice) => {
          const blocked = storyChoiceBlockReason(state, choice, chapter, puzzleSolved);
          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(blocked) || Boolean(busyChoice)}
              onClick={() => onResolve(choice)}
              style={{ clipPath: "polygon(2% 0, 100% 0, 98% 100%, 0 100%)" }}
              className={`group w-full border px-5 py-3 text-left shadow-2xl backdrop-blur-md transition ${
                blocked
                  ? "cursor-not-allowed border-iron/30 bg-stone-950/75 opacity-60"
                  : "border-gold/45 bg-black/88 hover:-translate-y-0.5 hover:border-gold hover:bg-stone-950/95"
              }`}
            >
              <span className="flex items-center gap-3">
                <UiAssetIcon id={blocked ? "risk" : "confirm"} label="" className="h-9 w-9 shrink-0 transition group-hover:scale-105" />
                <span className="min-w-0 flex-1">
                  <span className="block font-cinzel text-base font-bold text-stone-100 md:text-lg">{choice.label}</span>
                  <StoryRewardPreview choice={choice} />
                  {blocked && <span className="mt-2 block font-mono text-[9px] uppercase tracking-widest text-danger">{blocked}</span>}
                  {busyChoice === choice.id && <span className="mt-2 block font-mono text-[9px] uppercase tracking-widest text-gold">Resolviendo...</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StoryRewardPreview({ choice }: { choice: StoryChoice }) {
  const effects = rewardChips(choice.effects);
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {effects.map((effect) => (
        <StoryRewardChip key={effect.key} chip={effect} compact />
      ))}
    </span>
  );
}

function StoryOutcomePanel({ outcome, onNext }: { outcome: StoryOutcome; onNext: () => void }) {
  return (
    <div className="rounded-xs border border-gold/40 bg-gold/10 p-3 shadow-inner">
      <p className="font-mono text-[10px] uppercase tracking-widest text-gold">{outcome.message}</p>
      <h3 className="mt-1 font-cinzel text-base font-bold uppercase text-gold-soft">{outcome.chapterTitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        <span className="font-semibold text-text">{outcome.choiceLabel}.</span> {outcome.resultText}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {rewardChips(outcome.effects).map((effect) => (
          <StoryRewardChip key={effect.key} chip={effect} />
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <button type="button" onClick={onNext} className="blood-button inline-flex items-center justify-center gap-2 px-3 py-2 text-xs">
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
          href="/soldier"
          className="inline-flex items-center justify-center rounded-xs border border-iron px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted transition hover:border-gold/60 hover:text-gold"
        >
          Abrir soldado
        </Link>
      </div>
    </div>
  );
}

function StoryRewardChip({ chip, compact = false }: { chip: RewardChip; compact?: boolean }) {
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
      className={`inline-flex items-center gap-1 rounded-xs border font-mono font-bold uppercase tracking-wider ${toneClass} ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
      }`}
    >
      {chip.imageSrc ? (
        <img
          src={chip.imageSrc}
          alt=""
          className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 object-contain`}
        />
      ) : chip.iconId ? (
        <UiAssetIcon id={chip.iconId} label="" className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
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
    <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
      <div className="scene-frame relative min-h-[360px] overflow-hidden rounded-xs border border-gold/50 bg-stone-950">
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
        </div>
      </div>

      <Card title="Camino elegido" iconId="order">
        <ol className="space-y-2">
          {prologueStoryArc.chapters.map((chapter, index) => {
            const choice = chapter.choices.find((entry) => entry.id === progress.choices[chapter.id]);
            return (
              <li key={chapter.id} className="rounded-xs border border-iron/60 bg-stone-950/70 p-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Cap. {index + 1}</p>
                <p className="mt-0.5 font-cinzel text-sm font-bold uppercase text-gold-soft">{chapter.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{choice?.label ?? "Sin decisión registrada"}</p>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

export function StoryActRail() {
  return (
    <div className="mt-2">
      <h3 className="mb-2 border-b border-iron/10 pb-1 font-cinzel text-xs font-bold uppercase tracking-wider text-gold-soft">
        Campaña de Diego
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STORY_ACTS.map((act) => (
          <div
            key={act.id}
            className={`relative min-h-28 overflow-hidden rounded-xs border p-3 ${
              act.active ? "border-gold/40 bg-gold/10" : "border-iron/30 bg-stone-950/80 opacity-70"
            }`}
          >
            <div className="flex items-start gap-2">
              <UiAssetIcon id={act.active ? storyActIcon(act.id) : "risk"} label="" className="h-8 w-8 opacity-90" />
              <div className="min-w-0">
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted">
                  {act.active ? "Activo" : "Bloqueado"}
                </p>
                <h4 className="mt-1 font-cinzel text-xs font-bold uppercase text-gold-soft">{act.title}</h4>
                <p className="font-mono text-[9px] text-gold/60">{act.subtitle}</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-normal text-text-muted">{act.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function storyChapterIcon(index: number): UiIconId {
  const icons: UiIconId[] = ["barracks", "risk", "coins", "wound", "training", "equipment", "missions", "battleReports"];
  return icons[index] ?? "order";
}

function storyActIcon(actId: number): UiIconId {
  const icons: Record<number, UiIconId> = {
    1: "city",
    2: "longMissions",
    3: "missions",
    4: "shield",
    5: "battleReports",
  };
  return icons[actId] ?? "order";
}

function storyChoiceBlockReason(
  state: StoryState,
  choice: StoryChoice,
  chapter: StoryChapter,
  puzzleSolved: boolean,
) {
  if (chapter.puzzle && !puzzleSolved) return "Resuelve el puzle";
  if (choice.requirements?.coins && state.soldier.coins < choice.requirements.coins) {
    return `Faltan ${choice.requirements.coins - state.soldier.coins} doblones`;
  }
  for (const item of choice.requirements?.items ?? []) {
    const owned = state.soldier.inventory.find((entry) => entry.itemId === item.itemId)?.quantity ?? 0;
    if (owned < item.quantity) return `Falta ${item.quantity - owned} ${getItem(item.itemId)?.name ?? item.itemId}`;
  }
  return null;
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

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

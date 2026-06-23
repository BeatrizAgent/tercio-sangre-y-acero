"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Clipboard, Dices, KeyRound, LifeBuoy, LogIn, UserPlus } from "lucide-react";
import { featuredAssetPaths } from "@/lib/data/ui-paths";
import {
  getDefaultPlayerPortraitId,
  getPlayerPortraitById,
  getPlayerPortraitOptions,
  type PlayerPortraitOption,
} from "@/lib/data/player-portraits";
import { generateCharacterName } from "@/lib/domain/names";

type CreatedSession = {
  token: string;
  name: string;
  portrait: PlayerPortraitOption;
};

const DEFAULT_NAME = "Diego de Arce";

export default function LoginPage() {
  const router = useRouter();
  const portraitOptions = useMemo(() => getPlayerPortraitOptions(), []);
  const defaultPortraitId = useMemo(
    () => getDefaultPlayerPortraitId(),
    [],
  );

  const [name, setName] = useState(DEFAULT_NAME);
  const [portraitId, setPortraitId] = useState<string>(defaultPortraitId);
  const [token, setToken] = useState("");
  const [recoveryName, setRecoveryName] = useState("");
  const [recoveredToken, setRecoveredToken] = useState<string | null>(null);
  const [missingSession, setMissingSession] = useState(false);
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const [busy, setBusy] = useState<"create" | "resume" | "recover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPortrait =
    getPlayerPortraitById(portraitId) ?? portraitOptions[0] ?? null;
  const canCreate =
    busy === null && name.trim().length >= 2 && name.trim().length <= 40 && portraitId.length > 0;

  useEffect(() => {
    setMissingSession(new URLSearchParams(window.location.search).get("reason") === "missing-session");
  }, []);

  async function createCharacter() {
    if (!selectedPortrait) {
      setError("Elige un retrato antes de reclutar al bisono.");
      return;
    }
    setBusy("create");
    setError(null);
    setCopied(false);
    try {
      const response = await fetch("/api/auth/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, portraitAssetId: selectedPortrait.id }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error ?? "No se pudo crear el personaje.");
      }
      setCreated({
        token: payload.token,
        name: name.trim(),
        portrait: selectedPortrait,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el personaje.");
    } finally {
      setBusy(null);
    }
  }

  async function resumeCharacter() {
    setBusy("resume");
    setError(null);
    try {
      const response = await fetch("/api/auth/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Token invalido.");
      }
      router.replace("/city");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recuperar la partida.");
    } finally {
      setBusy(null);
    }
  }

  async function recoverByIp() {
    setBusy("recover");
    setError(null);
    setRecoveredToken(null);
    try {
      const trimmedName = recoveryName.trim().replace(/\s+/g, " ");
      const response = await fetch("/api/auth/recover-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const payload = (await response.json()) as { ok?: boolean; token?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error ?? "No se pudo recuperar la cuenta por IP.");
      }
      setRecoveredToken(payload.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recuperar la cuenta por IP.");
    } finally {
      setBusy(null);
    }
  }

  async function copyToken() {
    if (!created) return;
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function rollName() {
    const next = generateCharacterName();
    setName(next.fullName);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-text">
      <img
        src={featuredAssetPaths.barracks}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35 saturate-75"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-stone-950/80" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-5 px-4 py-10">
        <header className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/assets/brand/tercio-logo.png"
            alt="Tercio: Sangre y Acero"
            width={2048}
            height={875}
            fetchPriority="high"
            loading="eager"
            className="h-auto w-56 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] md:w-64"
          />
          <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-[0.14em] text-gold md:text-4xl">
            Entra al tercio
          </h1>
          <p className="max-w-md text-xs text-text-muted md:text-sm">
            Recluta a tu bisono o reanuda una campaña anterior. Tu token es la unica llave de acceso: guardalo bien.
          </p>
        </header>

        {missingSession && (
          <div role="status" className="notice notice--info">
            Sesion cerrada: no habia cookie valida. Pega tu token para volver al campamento.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <form
            className="game-panel flex flex-col gap-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void createCharacter();
            }}
          >
            <div className="panel-header">
              <span className="panel-header__title">
                <UserPlus className="h-4 w-4 text-gold" />
                Nuevo soldado
              </span>
              <span className="panel-header__meta">Biso&ntilde;o</span>
            </div>

            <div className="flex items-start gap-3">
              <PreviewPortrait portrait={selectedPortrait} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="form-field">
                  <label htmlFor="character-name" className="form-label">
                    Nombre
                  </label>
                  <input
                    id="character-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={40}
                    className="form-input"
                    placeholder={DEFAULT_NAME}
                    aria-describedby="character-name-hint"
                  />
                </div>
                <p
                  id="character-name-hint"
                  className="font-mono text-[9px] uppercase tracking-wider text-text-muted"
                >
                  2-40 caracteres.
                </p>
                <button
                  type="button"
                  onClick={rollName}
                  disabled={busy !== null}
                  aria-label="Generar nombre al azar"
                  className="iron-button mt-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px]"
                >
                  <Dices className="h-3.5 w-3.5" />
                  Generar nombre
                </button>
              </div>
            </div>

            <div className="border-t border-iron/60 pt-3">
              <p
                id="portrait-picker-label"
                className="form-label mb-2"
              >
                Retrato
              </p>
              <div
                role="radiogroup"
                aria-labelledby="portrait-picker-label"
                className="grid grid-cols-4 gap-2"
              >
                {portraitOptions.map((option) => {
                  const checked = option.id === portraitId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-label={`${option.displayName} (${option.roleLabel})`}
                      title={`${option.displayName} - ${option.roleLabel}`}
                      onClick={() => setPortraitId(option.id)}
                      disabled={busy !== null}
                      className={`relative aspect-square overflow-hidden border bg-stone-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-60 ${
                        checked
                          ? "border-gold shadow-[0_0_0_2px_rgba(201,162,79,0.35)]"
                          : "border-iron hover:border-gold/45"
                      }`}
                    >
                      <Image
                        src={option.publicPath}
                        alt={option.displayName}
                        width={option.width}
                        height={option.height}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        draggable={false}
                      />
                      {checked && (
                        <span
                          aria-hidden
                          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center border border-gold bg-gold text-stone-950"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-stone-950/85 px-1 py-0.5 text-center font-mono text-[8px] font-bold uppercase tracking-wider text-text-muted">
                        {option.roleLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                {selectedPortrait
                  ? `Seleccionado: ${selectedPortrait.displayName} - ${selectedPortrait.roleLabel}`
                  : "Selecciona un retrato"}
              </p>
            </div>

            <button
              type="submit"
              disabled={!canCreate}
              className="blood-button mt-1 inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-[11px]"
            >
              <UserPlus className="h-4 w-4" />
              Crear personaje
            </button>
          </form>

          <form
            className="game-panel flex flex-col gap-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void resumeCharacter();
            }}
          >
            <div className="panel-header">
              <span className="panel-header__title">
                <KeyRound className="h-4 w-4 text-gold" />
                Recuperar partida
              </span>
              <span className="panel-header__meta">Token</span>
            </div>
            <div className="form-field">
              <label htmlFor="recovery-token" className="form-label">
                Token de sesion
              </label>
              <input
                id="recovery-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="form-input font-mono text-xs"
                placeholder="tercio_..."
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="iron-button mt-1 inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-[11px]"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
          </form>

          <form
            className="game-panel flex flex-col gap-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void recoverByIp();
            }}
          >
            <div className="panel-header">
              <span className="panel-header__title">
                <LifeBuoy className="h-4 w-4 text-gold" />
                Recuperar cuenta
              </span>
              <span className="panel-header__meta">Sin token</span>
            </div>
            <div className="form-field">
              <label htmlFor="recovery-name" className="form-label">
                Nombre del soldado
              </label>
              <input
                id="recovery-name"
                value={recoveryName}
                onChange={(event) => setRecoveryName(event.target.value)}
                minLength={2}
                maxLength={40}
                className="form-input"
                placeholder={DEFAULT_NAME}
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null || recoveryName.trim().length < 2}
              className="iron-button mt-1 inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-[11px]"
            >
              <LifeBuoy className="h-4 w-4" />
              Recuperar por IP
            </button>
            {recoveredToken && (
              <p className="font-mono text-[10px] uppercase leading-5 tracking-wider text-text-muted">
                Token nuevo de <strong className="text-gold-soft">{recoveryName.trim()}</strong>:{" "}
                <span className="break-all text-text">{recoveredToken}</span>
              </p>
            )}
          </form>
        </div>

        {created && (
          <section className="game-panel border-success/45 p-4 text-success">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src={created.portrait.publicPath}
                  alt={created.portrait.displayName}
                  width={created.portrait.width}
                  height={created.portrait.height}
                  className="h-14 w-14 shrink-0 border border-success/50 object-cover object-top"
                  draggable={false}
                />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                    Token de {created.name}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                    Retrato: {created.portrait.displayName}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="break-all border border-success/30 bg-background/80 px-3 py-2 font-mono text-xs text-text">
                  {created.token}
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void copyToken()}
                    className="iron-button inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    Copiar
                  </button>
                  <button
                    type="button"
                    onClick={() => router.replace("/city")}
                    className="blood-button inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px]"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar al campamento
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div role="alert" className="notice notice--err">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}

function PreviewPortrait({ portrait }: { portrait: PlayerPortraitOption | null }) {
  if (!portrait) {
    return (
      <div
        aria-hidden
        className="flex h-24 w-24 shrink-0 items-center justify-center border border-iron bg-stone-900 font-mono text-[10px] text-stone-500"
      >
        Sin retrato
      </div>
    );
  }
  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-gold/40 bg-stone-900">
      <Image
        src={portrait.publicPath}
        alt={portrait.displayName}
        width={portrait.width}
        height={portrait.height}
        fetchPriority="high"
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover object-top"
        draggable={false}
      />
    </div>
  );
}

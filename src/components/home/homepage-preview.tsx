"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  FileText,
  Globe,
  LibraryBig,
  LineChart,
  ShieldCheck,
  Volume2
} from "lucide-react";

import type { HomeContentBundle, HomeSectionId } from "@/lib/home-content";
import { cn } from "@/lib/utils";
import { HomeGlobeExplorer } from "@/components/home/home-globe-explorer";
import { KpiCard } from "@/components/ui/kpi-card";

interface HomepagePreviewProps {
  content: HomeContentBundle;
}

const ICON_MAP = {
  globe: Globe,
  chart: LineChart,
  policy: ShieldCheck,
  calculator: Calculator,
  library: LibraryBig,
  document: FileText
} as const;

type IntroState = "hidden" | "gate" | "playing";

type GlobeFilter = "all" | "sovereign" | "non_sovereign";

export function HomepagePreview({ content }: HomepagePreviewProps) {
  const [introState, setIntroState] = useState<IntroState>(content.introVideo.enabled ? "gate" : "hidden");
  const [introError, setIntroError] = useState<string | null>(null);
  const [activeGlobeView, setActiveGlobeView] = useState<GlobeFilter>(
    normalizeGlobeFilter(content.globeSection.default_view)
  );
  const introVideoRef = useRef<HTMLVideoElement | null>(null);

  const enabledMap = useMemo(() => {
    const map = new Map<HomeSectionId, boolean>();
    for (const section of content.sectionOrder.sections) {
      map.set(section.id, section.enabled);
    }
    return map;
  }, [content.sectionOrder.sections]);

  const showHero = (enabledMap.get("hero") ?? false) && content.hero.enabled;
  const showGlobe = (enabledMap.get("globe") ?? false) && content.globeSection.enabled;
  const showKpis = (enabledMap.get("kpis") ?? false) && content.kpis.enabled;
  const showQuickAccess = (enabledMap.get("quick_access") ?? false) && content.quickAccess.enabled;

  async function handlePlayIntroWithSound() {
    const video = introVideoRef.current;
    if (!video) {
      setIntroState("hidden");
      return;
    }

    setIntroState("playing");
    setIntroError(null);

    try {
      video.loop = false;
      video.currentTime = 0;
      video.muted = false;
      video.volume = 1;
      await video.play();
    } catch {
      try {
        video.muted = true;
        await video.play();
        setIntroError("Audio was restricted by the browser. Click Enable Sound to unmute.");
      } catch {
        setIntroError("Unable to play introduction video in this browser session.");
      }
    }
  }

  function handleEnableSound() {
    const video = introVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => undefined);
    setIntroError(null);
  }

  function handleSkipIntro() {
    introVideoRef.current?.pause();
    setIntroState("hidden");
  }

  return (
    <div className="space-y-0">
      <AnimatePresence>
        {content.introVideo.enabled && introState !== "hidden" ? (
          <IntroVideoOverlay
            state={introState}
            title={content.introVideo.title}
            subtitle={content.introVideo.subtitle}
            source={content.introVideo.video_source}
            skipLabel={content.introVideo.skip_label ?? "Enter Platform"}
            showSkipButton={content.introVideo.show_skip_button !== false}
            error={introError}
            videoRef={introVideoRef}
            onPlayWithSound={handlePlayIntroWithSound}
            onEnableSound={handleEnableSound}
            onSkip={handleSkipIntro}
          />
        ) : null}
      </AnimatePresence>

      {showHero ? <HeroFullscreen content={content.hero} /> : null}
      {showGlobe ? (
        <ImmersiveGlobeStage
          content={content}
          activeGlobeView={activeGlobeView}
          onChangeGlobeView={setActiveGlobeView}
          showKpis={showKpis}
        />
      ) : null}
      {showQuickAccess ? <QuickAccessSection content={content.quickAccess} /> : null}
    </div>
  );
}

interface IntroVideoOverlayProps {
  state: IntroState;
  title: string;
  subtitle: string;
  source?: string;
  skipLabel: string;
  showSkipButton: boolean;
  error: string | null;
  videoRef: { current: HTMLVideoElement | null };
  onPlayWithSound: () => Promise<void>;
  onEnableSound: () => void;
  onSkip: () => void;
}

function IntroVideoOverlay({
  state,
  title,
  subtitle,
  source,
  skipLabel,
  showSkipButton,
  error,
  videoRef,
  onPlayWithSound,
  onEnableSound,
  onSkip
}: IntroVideoOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      className="fixed inset-0 z-[80] bg-black"
    >
      {source ? (
        <video
          ref={videoRef}
          autoPlay={state === "gate"}
          muted
          loop={state === "gate"}
          playsInline
          onEnded={onSkip}
          className="h-full w-full object-cover opacity-90"
        >
          <source src={source} />
        </video>
      ) : (
        <div className="h-full w-full bg-slate-950" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/65 to-slate-950/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(56,189,248,0.22),transparent_48%)]" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1600px] px-5 pb-10 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="lux-panel max-w-3xl p-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90">Introduction</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {state === "gate" ? (
              <button type="button" onClick={onPlayWithSound} className="btn-hero-primary">
                Play Introduction
              </button>
            ) : null}
            {showSkipButton ? (
              <button type="button" onClick={onSkip} className="btn-hero-secondary">
                {skipLabel}
              </button>
            ) : null}
            {state === "playing" && error ? (
              <button type="button" onClick={onEnableSound} className="btn-hero-secondary">
                <Volume2 className="mr-2 h-4 w-4" />
                Enable Sound
              </button>
            ) : null}
            {showSkipButton ? (
              <button type="button" onClick={onSkip} className="btn-hero-secondary">
                Skip Intro
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-3 text-xs text-amber-200">{error}</p> : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

function HeroFullscreen({ content }: { content: HomeContentBundle["hero"] }) {
  return (
    <section className="relative left-1/2 -mt-7 min-h-screen w-screen -translate-x-1/2 overflow-hidden border-b border-white/10">
      {content.background_type === "video" && content.background_video ? (
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-45">
          <source src={content.background_video} />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(56,189,248,0.22),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_65%,rgba(20,184,166,0.15),transparent_46%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020712]/95 via-[#030917]/82 to-[#020712]/92" />
      <div className="absolute inset-0 hero-grid opacity-35" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1700px] items-center px-5 py-20 lg:px-10">
        <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/90">{content.tagline}</p>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.06] text-white lg:text-7xl">{content.title}</h1>
            <p className="max-w-3xl text-xl text-slate-200">{content.subtitle}</p>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{content.description}</p>

            <div className="flex flex-wrap gap-2 pt-1">
              {content.primary_call_to_action ? (
                <Link href={content.primary_call_to_action.url} className="btn-hero-primary">
                  {content.primary_call_to_action.label}
                </Link>
              ) : null}
              {content.secondary_call_to_action ? (
                <Link href={content.secondary_call_to_action.url} className="btn-hero-secondary">
                  {content.secondary_call_to_action.label}
                </Link>
              ) : null}
              {content.tertiary_call_to_action ? (
                <Link href={content.tertiary_call_to_action.url} className="btn-hero-secondary">
                  {content.tertiary_call_to_action.label}
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="lux-panel self-end p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Platform Value</p>
            <div className="mt-4 space-y-3">
              {content.value_proposition.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-slate-900/55 p-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ImmersiveGlobeStage({
  content,
  activeGlobeView,
  onChangeGlobeView,
  showKpis
}: {
  content: HomeContentBundle;
  activeGlobeView: GlobeFilter;
  onChangeGlobeView: (view: GlobeFilter) => void;
  showKpis: boolean;
}) {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-white/10">
      <div className="relative h-[100svh] min-h-[760px] w-full">
        <HomeGlobeExplorer points={content.globePoints} activeView={activeGlobeView} className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020711]/78 via-transparent to-[#020711]/92" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.08),transparent_62%)]" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-[1700px] px-5 pt-8 lg:px-10">
          <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-4">
            <div className="stage-overlay max-w-3xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">{content.globeSection.section_title}</p>
              <p className="mt-2 text-sm text-slate-200">{content.globeSection.section_subtitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{content.globeSection.description}</p>
            </div>

            <div className="stage-overlay flex flex-wrap gap-2 p-3">
              {content.globeSection.available_views.map((viewRaw) => {
                const view = normalizeGlobeFilter(viewRaw);
                const active = activeGlobeView === view;
                return (
                  <button
                    key={viewRaw}
                    type="button"
                    onClick={() => onChangeGlobeView(view)}
                    className={filterButtonClass(view, active)}
                  >
                    {formatViewLabel(view)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[1700px] px-5 pb-7 lg:px-10">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            {showKpis ? (
              <div className="pointer-events-auto stage-overlay p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {content.kpis.items.map((item) => (
                    <motion.article
                      key={item.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="overlay-kpi-card"
                    >
                      <KpiCard
                        label={item.label}
                        value={item.value}
                        note={item.note}
                        definition={item.definition}
                        interpretation={item.interpretation}
                        dataType={item.data_type}
                        className="border-none bg-transparent p-3 shadow-none"
                      />
                    </motion.article>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="pointer-events-auto stage-overlay p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Legend</p>
              <div className="mt-3 space-y-2">
                {content.globeSection.legend.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-slate-200">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        item.color === "blue"
                          ? "bg-blue-300"
                          : item.color === "green"
                            ? "bg-emerald-300"
                            : "bg-cyan-300"
                      )}
                    />
                    {item.label}
                  </div>
                ))}
              </div>

              {content.globeSection.primary_call_to_action ? (
                <Link href={content.globeSection.primary_call_to_action.url} className="btn-hero-primary mt-4 inline-flex">
                  {content.globeSection.primary_call_to_action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickAccessSection({ content }: { content: HomeContentBundle["quickAccess"] }) {
  return (
    <section className="mx-auto w-full max-w-[1700px] px-0 py-8">
      <div className="lux-panel p-5 lg:p-6">
        <h2 className="text-2xl font-semibold text-white">{content.section_title}</h2>
        <p className="mt-1 text-sm text-slate-300">{content.section_subtitle}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {content.items.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? FileText;
            return (
              <Link key={item.id} href={item.url} className="quick-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-cyan-200" />
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 text-base font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function normalizeGlobeFilter(view: string | undefined): GlobeFilter {
  if (view === "sovereign" || view === "non_sovereign") return view;
  return "all";
}

function formatViewLabel(view: GlobeFilter): string {
  if (view === "all") return "All";
  if (view === "sovereign") return "Sovereign";
  return "Non-Sovereign";
}

function filterButtonClass(view: GlobeFilter, active: boolean): string {
  if (!active) {
    return "btn-hero-secondary";
  }

  if (view === "sovereign") {
    return "btn-hero-secondary border-blue-300/80 bg-blue-500/20 text-blue-100";
  }
  if (view === "non_sovereign") {
    return "btn-hero-secondary border-emerald-300/80 bg-emerald-500/20 text-emerald-100";
  }
  return "btn-hero-secondary border-cyan-300/80 bg-cyan-500/20 text-cyan-100";
}

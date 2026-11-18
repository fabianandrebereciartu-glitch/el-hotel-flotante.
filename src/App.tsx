import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { Volume2, VolumeX } from 'lucide-react';
import { AureliaViewport } from './components/AureliaViewport';
import { InquiryModal } from './components/InquiryModal';
import {
  clampProgress,
  findActiveChapter,
  formatAltitudeReadout,
} from './architecture/elevatorRig';
import {
  getInteriorForLevel,
  isWalkthroughLevel,
  type WalkthroughLevelId,
} from './architecture/interiors';
import { TOWER_LEVELS, type TowerLevel } from './architecture/levels';
import { createLondonSoundscape, type LondonSoundscape } from './audio/londonSoundscape';

const SHAFT_LEVELS_DESCENDING: readonly TowerLevel[] = [...TOWER_LEVELS].reverse();

const MOBILE_CHAPTER_TITLES: Readonly<Record<string, string>> = {
  'lvl-00': 'LVL 00 · PORTICO',
  'lvl-14': 'LVL 14 · THE VAULT',
  'lvl-34': 'LVL 34 · SKYBRIDGE',
  'lvl-52': 'LVL 52 · SUITES',
  'lvl-68': 'LVL 68 · CROWN',
};

const MOBILE_WALKTHROUGH_TITLES: Readonly<Record<WalkthroughLevelId, string>> = {
  'lvl-14': 'LVL 14 · RIVER SALON',
  'lvl-34': 'LVL 34 · SKYBRIDGE SPA',
  'lvl-68': 'LVL 68 · PENTHOUSE',
};

export default function App() {
  const targetProgressRef = useRef<number>(0);
  const isPoolInspectingRef = useRef<boolean>(false);
  const walkthroughLevelIdRef = useRef<WalkthroughLevelId | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const soundscapeRef = useRef<LondonSoundscape | null>(null);

  const altitudeTextRef = useRef<HTMLSpanElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const elevatorCarRef = useRef<HTMLDivElement | null>(null);
  const beaconCalloutRef = useRef<HTMLDivElement | null>(null);
  const beaconLabelRef = useRef<HTMLSpanElement | null>(null);
  const beaconLineRef = useRef<SVGLineElement | null>(null);
  const beaconDotRef = useRef<SVGCircleElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);

  const [activeChapterId, setActiveChapterId] = useState<string>(TOWER_LEVELS[0].id);
  const [isPoolInspecting, setIsPoolInspecting] = useState<boolean>(false);
  const [walkthroughLevelId, setWalkthroughLevelId] = useState<WalkthroughLevelId | null>(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState<boolean>(false);
  const [inquiryDefaultLevelId, setInquiryDefaultLevelId] = useState<string | undefined>(undefined);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [sceneReady, setSceneReady] = useState<boolean>(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);

  const activeChapter =
    TOWER_LEVELS.find((lvl) => lvl.id === activeChapterId) ?? TOWER_LEVELS[0];
  const activeWalkthroughSpace = walkthroughLevelId
    ? getInteriorForLevel(walkthroughLevelId)
    : null;

  // Lenis Native Scroll Rig over 500vh vertical track
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.25,
    });
    lenisRef.current = lenis;

    const syncFromScroll = () => {
      if (isPoolInspectingRef.current || walkthroughLevelIdRef.current !== null) return;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const next = clampProgress(window.scrollY / maxScroll);
      targetProgressRef.current = next;
    };

    lenis.on('scroll', ({ progress }: { progress: number }) => {
      if (isPoolInspectingRef.current || walkthroughLevelIdRef.current !== null) return;
      if (Number.isFinite(progress)) {
        targetProgressRef.current = clampProgress(progress);
      } else {
        syncFromScroll();
      }
    });

    window.addEventListener('scroll', syncFromScroll, { passive: true });
    syncFromScroll();

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', syncFromScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Pause / resume Lenis vertical scroll rig during Skybridge 360° orbit or Interior Walkthrough
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (isPoolInspecting || walkthroughLevelId !== null) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [isPoolInspecting, walkthroughLevelId]);

  // Collapse mobile details sheet whenever active chapter or inspection/walkthrough mode changes
  useEffect(() => {
    setIsMobileDetailsOpen(false);
  }, [activeChapterId, isPoolInspecting, walkthroughLevelId]);

  // Escape exits active interior walkthrough or Skybridge inspection when Inquiry Drawer is closed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isInquiryOpen) return;
      if (walkthroughLevelIdRef.current !== null) {
        walkthroughLevelIdRef.current = null;
        setWalkthroughLevelId(null);
        lenisRef.current?.start();
      } else if (isPoolInspectingRef.current) {
        isPoolInspectingRef.current = false;
        setIsPoolInspecting(false);
        lenisRef.current?.start();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isInquiryOpen]);

  // Clean up procedural Web Audio graph if initialized
  useEffect(() => {
    return () => {
      soundscapeRef.current?.dispose();
      soundscapeRef.current = null;
    };
  }, []);

  const scrollToProgress = useCallback((progress: number) => {
    const clamped = clampProgress(progress);
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    const targetY = clamped * maxScroll;
    targetProgressRef.current = clamped;

    if (walkthroughLevelIdRef.current !== null) {
      walkthroughLevelIdRef.current = null;
      setWalkthroughLevelId(null);
      lenisRef.current?.start();
    }

    if (isPoolInspectingRef.current) {
      isPoolInspectingRef.current = false;
      setIsPoolInspecting(false);
      lenisRef.current?.start();
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.3 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    setActiveChapterId(findActiveChapter(clamped).id);
  }, []);

  const handleEnterPoolInspect = useCallback(() => {
    if (walkthroughLevelIdRef.current !== null) {
      walkthroughLevelIdRef.current = null;
      setWalkthroughLevelId(null);
    }
    if (Math.abs(targetProgressRef.current - 0.502) > 0.08) {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const targetY = 0.502 * maxScroll;
      targetProgressRef.current = 0.502;
      lenisRef.current?.scrollTo(targetY, { immediate: true });
    }
    isPoolInspectingRef.current = true;
    setIsPoolInspecting(true);
    lenisRef.current?.stop();
  }, []);

  const handleExitPoolInspect = useCallback(() => {
    isPoolInspectingRef.current = false;
    setIsPoolInspecting(false);
    lenisRef.current?.start();
  }, []);

  const handlePoolInspectAutoExit = useCallback(() => {
    setIsPoolInspecting(false);
    lenisRef.current?.start();
  }, []);

  const handleEnterWalkthrough = useCallback((levelId: WalkthroughLevelId) => {
    const lvl = TOWER_LEVELS.find((l) => l.id === levelId);
    if (lvl && Math.abs(targetProgressRef.current - lvl.progress) > 0.08) {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      targetProgressRef.current = lvl.progress;
      lenisRef.current?.scrollTo(lvl.progress * maxScroll, { immediate: true });
    }
    if (isPoolInspectingRef.current) {
      isPoolInspectingRef.current = false;
      setIsPoolInspecting(false);
    }
    walkthroughLevelIdRef.current = levelId;
    setWalkthroughLevelId(levelId);
    lenisRef.current?.stop();
  }, []);

  const handleExitWalkthrough = useCallback(() => {
    walkthroughLevelIdRef.current = null;
    setWalkthroughLevelId(null);
    lenisRef.current?.start();
  }, []);

  const handleToggleSound = useCallback(async () => {
    if (!soundscapeRef.current) {
      soundscapeRef.current = createLondonSoundscape();
    }
    const nextEnabled = !soundscapeRef.current.isEnabled();
    soundscapeRef.current.setAltitudeProgress(targetProgressRef.current);
    const actualState = await soundscapeRef.current.setEnabled(nextEnabled);
    setIsSoundOn(actualState);
  }, []);

  const handleAltitudeFrame = useCallback((progress: number) => {
    soundscapeRef.current?.setAltitudeProgress(progress);
  }, []);

  const openInquiryForLevel = useCallback((levelId?: string) => {
    setInquiryDefaultLevelId(levelId);
    setIsInquiryOpen(true);
  }, []);

  const initialMetersLabel = formatAltitudeReadout(0);
  const canStepInside = isWalkthroughLevel(activeChapter.id);

  return (
    <div
      className="relative w-full bg-[#09090B] text-[#F4EFE6]"
      data-active-level={activeChapter.id}
      data-pool-inspect={isPoolInspecting ? 'true' : 'false'}
      data-walkthrough-level={walkthroughLevelId ?? 'none'}
      data-scene-ready={sceneReady ? 'true' : 'false'}
    >
      {/* Fixed 3D Architectural Canvas (touch-action: pan-y, or none when inspecting/walking) */}
      <AureliaViewport
        targetProgressRef={targetProgressRef}
        isPoolInspecting={isPoolInspecting}
        isPoolInspectingRef={isPoolInspectingRef}
        walkthroughLevelId={walkthroughLevelId}
        walkthroughLevelIdRef={walkthroughLevelIdRef}
        onActiveChapterChange={setActiveChapterId}
        onPoolInspectAutoExit={handlePoolInspectAutoExit}
        onAltitudeFrame={handleAltitudeFrame}
        altitudeTextRef={altitudeTextRef}
        progressFillRef={progressFillRef}
        elevatorCarRef={elevatorCarRef}
        beaconCalloutRef={beaconCalloutRef}
        beaconLabelRef={beaconLabelRef}
        beaconLineRef={beaconLineRef}
        beaconDotRef={beaconDotRef}
        fpsTextRef={fpsTextRef}
        onSceneReady={() => setSceneReady(true)}
      />

      {/* 3D Active Floor Highlight Beacon Leader-Line Callout (Updated at 60fps via DOM refs) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-15 overflow-hidden"
      >
        <svg className="h-full w-full">
          <line
            ref={beaconLineRef}
            stroke="#C29B38"
            strokeWidth="1"
            strokeOpacity="0.85"
            style={{ display: 'none' }}
          />
          <circle
            ref={beaconDotRef}
            r="3"
            fill="#FFB86C"
            stroke="#09090B"
            strokeWidth="1"
            style={{ display: 'none' }}
          />
        </svg>
        <div
          ref={beaconCalloutRef}
          data-testid="floor-beacon-callout"
          className="fixed left-0 top-0 items-center gap-2 rounded-[2px] border border-[#C29B38]/75 bg-[#09090B]/92 px-2.5 py-1 will-change-transform"
          style={{ display: 'none' }}
        >
          <span className="h-1.5 w-1.5 rounded-[1px] bg-[#FFB86C]" />
          <span
            ref={beaconLabelRef}
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4EFE6] whitespace-nowrap"
          >
            [ LVL 00 · PORTICO ]
          </span>
        </div>
      </div>

      {/* Top, Bottom & Right Edge Contrast Scrims (Zero Boxes) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-[#09090B]/80 via-[#09090B]/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-[#09090B]/90 via-[#09090B]/45 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-0 z-10 w-44 bg-gradient-to-l from-[#09090B]/70 via-[#09090B]/25 to-transparent"
      />

      {/* Minimalist Single-Line Top Navigation */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-10 sm:py-6">
        <div className="pointer-events-auto flex min-w-0 items-baseline gap-2.5 sm:gap-4">
          <h1 className="font-display text-[12px] font-medium tracking-[0.11em] uppercase text-[#F4EFE6] sm:text-lg sm:tracking-[0.15em] whitespace-nowrap shrink-0 editorial-shadow">
            THE AURELIA TOWERS
          </h1>
          <span className="hidden font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.68)] min-[440px]:inline sm:text-[11px] whitespace-nowrap shrink-0 editorial-shadow">
            LONDON SW1A
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => void handleToggleSound()}
            aria-pressed={isSoundOn}
            className={`flex items-center gap-1.5 rounded-[2px] border px-2.5 py-2 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#C29B38] sm:px-3.5 sm:py-2.5 sm:tracking-[0.12em] whitespace-nowrap shrink-0 ${
              isSoundOn
                ? 'border-[#C29B38] bg-[#161513] text-[#F4EFE6]'
                : 'border-[rgba(244,239,230,0.22)] bg-[#09090B]/85 text-[rgba(244,239,230,0.75)] hover:border-[#C29B38] hover:text-[#F4EFE6]'
            }`}
          >
            {isSoundOn ? (
              <Volume2 className="h-3.5 w-3.5 text-[#C29B38]" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isSoundOn ? 'Sound on' : 'Sound off'}</span>
          </button>

          <button
            type="button"
            onClick={() => openInquiryForLevel(walkthroughLevelId ?? activeChapter.id)}
            className="rounded-[2px] bg-[#F4EFE6] px-3.5 py-2 text-[10px] font-medium tracking-[0.12em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38] sm:px-5 sm:py-2.5 sm:text-[11px] sm:tracking-[0.14em] whitespace-nowrap shrink-0"
          >
            Inquire
          </button>
        </div>
      </header>

      {/* Ultra-Minimalist Right-Edge Elevator Telemetry (No Opaque Box) */}
      <aside
        aria-label="Elevator Altitude Telemetry"
        className="pointer-events-none fixed right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-3.5 sm:right-8"
      >
        <span
          ref={altitudeTextRef}
          data-testid="altitude-readout"
          className="font-mono text-[11px] font-medium tracking-[0.14em] tabular-nums text-[#C29B38] sm:text-xs editorial-shadow"
        >
          {initialMetersLabel}
        </span>

        <div className="relative flex items-stretch gap-2.5 sm:gap-3.5">
          <nav
            aria-label="Tower Floor Levels"
            className="pointer-events-auto flex flex-col justify-between gap-5 py-1"
          >
            {SHAFT_LEVELS_DESCENDING.map((level) => {
              const isActive = level.id === activeChapter.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => scrollToProgress(level.progress)}
                  aria-current={isActive ? 'location' : undefined}
                  aria-label={level.tickLabel}
                  className={`group flex min-h-[28px] items-center justify-end gap-2 text-right transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#C29B38] editorial-shadow ${
                    isActive
                      ? 'text-[#F4EFE6]'
                      : 'text-[rgba(244,239,230,0.58)] hover:text-[#F4EFE6]'
                  }`}
                >
                  <span className="hidden font-mono text-[10px] tracking-[0.14em] uppercase md:inline whitespace-nowrap">
                    {level.tickLabel}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase md:hidden whitespace-nowrap">
                    {level.shortCode}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-[1px] transition-all duration-150 ${
                      isActive
                        ? 'w-4 bg-[#C29B38]'
                        : 'w-2 bg-[rgba(244,239,230,0.35)] group-hover:w-3.5 group-hover:bg-[#F4EFE6]'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Delicate Vertical Bronze Hairline Shaft */}
          <div
            aria-hidden="true"
            className="relative my-2 w-[1px] bg-[rgba(244,239,230,0.22)]"
          >
            <div
              ref={progressFillRef}
              className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-[#C29B38]"
              style={{ transform: 'scaleY(0)' }}
            />
            <div
              ref={elevatorCarRef}
              className="absolute left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-[1px] border border-[#F4EFE6] bg-[#C29B38]"
              style={{ bottom: '0%' }}
            />
          </div>
        </div>
      </aside>

      {/* Mobile (<=768px): Ultra-Compact Bottom Floating Pill Dock & Expandable Details Sheet */}
      <section
        aria-live="polite"
        aria-label="Mobile Architectural Dock"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-25 min-[769px]:hidden"
      >
        {isMobileDetailsOpen ? (
          <div
            data-testid="mobile-details-sheet"
            className="pointer-events-auto mx-4 mb-7 rounded-2xl border border-[rgba(194,155,56,0.3)] bg-[#0C0C0F]/94 p-4 backdrop-blur-[16px]"
          >
            {activeWalkthroughSpace ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#C29B38]">
                      {activeWalkthroughSpace.subtitle} · {activeWalkthroughSpace.areaSqm} M²
                    </p>
                    <h2 className="mt-1 font-serif text-lg font-normal tracking-[0.04em] text-[#F4EFE6]">
                      {activeWalkthroughSpace.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDetailsOpen(false)}
                    className="shrink-0 rounded-full border border-[rgba(244,239,230,0.22)] bg-[#141311] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Close (×)
                  </button>
                </div>

                <ul className="mt-2.5 grid grid-cols-1 gap-1 border-t border-[rgba(244,239,230,0.12)] pt-2.5 font-mono text-[10px] tracking-[0.06em] text-[rgba(244,239,230,0.82)]">
                  {activeWalkthroughSpace.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 shrink-0 bg-[#C29B38]" aria-hidden="true" />
                      <span>{amenity}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-2.5 font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(244,239,230,0.62)]">
                  Drag to look · Tap floor to walk
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExitWalkthrough}
                    className="rounded-full bg-[#F4EFE6] px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-[#09090B]"
                  >
                    Exit ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => openInquiryForLevel(activeWalkthroughSpace.id)}
                    className="rounded-full border border-[#C29B38] bg-[#141311] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Inquire Suite
                  </button>
                </div>
              </>
            ) : isPoolInspecting ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#C29B38]">
                      LEVEL 34 · SKYBRIDGE SPA
                    </p>
                    <h2 className="mt-1 font-serif text-lg font-normal tracking-[0.04em] text-[#F4EFE6]">
                      38°C Geothermal Cantilever Pool
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDetailsOpen(false)}
                    className="shrink-0 rounded-full border border-[rgba(244,239,230,0.22)] bg-[#141311] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Close (×)
                  </button>
                </div>
                <p className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[rgba(244,239,230,0.78)]">
                  Drag 360° anywhere on screen to orbit the cantilevered thermal skybridge.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExitPoolInspect}
                    className="rounded-full bg-[#F4EFE6] px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-[#09090B]"
                  >
                    Return ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnterWalkthrough('lvl-34')}
                    className="rounded-full border border-[#C29B38] bg-[#141311] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Step Inside
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#C29B38]">
                      {activeChapter.eyebrow}
                    </p>
                    <h2 className="mt-1 font-serif text-lg font-normal tracking-[0.04em] text-[#F4EFE6]">
                      {activeChapter.headline}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDetailsOpen(false)}
                    className="shrink-0 rounded-full border border-[rgba(244,239,230,0.22)] bg-[#141311] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Close (×)
                  </button>
                </div>
                <p className="mt-2 text-xs font-light leading-relaxed text-[rgba(244,239,230,0.82)]">
                  {activeChapter.copy}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {canStepInside && (
                    <button
                      type="button"
                      onClick={() =>
                        handleEnterWalkthrough(activeChapter.id as WalkthroughLevelId)
                      }
                      className="rounded-full bg-[#F4EFE6] px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-[#09090B]"
                    >
                      Step Inside
                    </button>
                  )}
                  {activeChapter.id === 'lvl-34' && (
                    <button
                      type="button"
                      onClick={handleEnterPoolInspect}
                      className="rounded-full border border-[#C29B38] bg-[#141311] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                    >
                      Inspect Pool
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openInquiryForLevel(activeChapter.id)}
                    className="rounded-full border border-[rgba(244,239,230,0.24)] bg-[#141311] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase text-[#F4EFE6]"
                  >
                    Inquire
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            data-testid="mobile-bottom-dock"
            className="pointer-events-auto mx-4 mb-7 flex h-[54px] max-h-[58px] items-center justify-between gap-1 rounded-full border border-[rgba(194,155,56,0.25)] bg-[#0C0C0F]/88 px-3 py-2 backdrop-blur-[16px]"
          >
            <span className="min-w-0 truncate font-serif text-[14px] font-medium tracking-normal text-[#F4EFE6]">
              {activeWalkthroughSpace
                ? MOBILE_WALKTHROUGH_TITLES[activeWalkthroughSpace.id]
                : isPoolInspecting
                  ? 'LVL 34 · SKYBRIDGE POOL'
                  : (MOBILE_CHAPTER_TITLES[activeChapter.id] ?? activeChapter.headline)}
            </span>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-expanded={isMobileDetailsOpen}
                onClick={() => setIsMobileDetailsOpen(true)}
                className="rounded-full border border-[rgba(244,239,230,0.22)] bg-[#161513]/90 px-1.5 py-1 font-mono text-[9px] tracking-[0.01em] text-[#F4EFE6] whitespace-nowrap"
              >
                Details ⓘ
              </button>

              {activeWalkthroughSpace ? (
                <>
                  <button
                    type="button"
                    onClick={handleExitWalkthrough}
                    className="rounded-full bg-[#F4EFE6] px-1.5 py-1 font-mono text-[9px] font-medium tracking-[0.01em] uppercase text-[#09090B] whitespace-nowrap"
                  >
                    Exit ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => openInquiryForLevel(activeWalkthroughSpace.id)}
                    className="rounded-full border border-[#C29B38] bg-[#141311] px-1.5 py-1 font-mono text-[9px] tracking-[0.01em] uppercase text-[#F4EFE6] whitespace-nowrap"
                  >
                    Inquire
                  </button>
                </>
              ) : isPoolInspecting ? (
                <>
                  <button
                    type="button"
                    onClick={handleExitPoolInspect}
                    className="rounded-full bg-[#F4EFE6] px-1.5 py-1 font-mono text-[9px] font-medium tracking-[0.01em] uppercase text-[#09090B] whitespace-nowrap"
                  >
                    Exit ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => openInquiryForLevel('lvl-34')}
                    className="rounded-full border border-[#C29B38] bg-[#141311] px-1.5 py-1 font-mono text-[9px] tracking-[0.01em] uppercase text-[#F4EFE6] whitespace-nowrap"
                  >
                    Inquire
                  </button>
                </>
              ) : (
                <>
                  {canStepInside && (
                    <button
                      type="button"
                      onClick={() =>
                        handleEnterWalkthrough(activeChapter.id as WalkthroughLevelId)
                      }
                      className="rounded-full bg-[#F4EFE6] px-1.5 py-1 font-mono text-[9px] font-medium tracking-[0.01em] uppercase text-[#09090B] whitespace-nowrap"
                    >
                      Step Inside
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openInquiryForLevel(activeChapter.id)}
                    className="rounded-full border border-[#C29B38] bg-[#141311] px-1.5 py-1 font-mono text-[9px] tracking-[0.01em] uppercase text-[#F4EFE6] whitespace-nowrap"
                  >
                    Inquire
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Desktop (>=769px): Spacious Bottom-Left Editorial Copy / Inspection / Walkthrough Card */}
      <section
        aria-live="polite"
        aria-label="Architectural Chapter"
        className="pointer-events-none fixed bottom-10 left-10 z-20 hidden max-w-lg min-[769px]:block"
      >
        {activeWalkthroughSpace ? (
          <div
            data-testid="walkthrough-room-hud"
            className="pointer-events-auto border border-[rgba(244,239,230,0.18)] bg-[#09090B]/95 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#C29B38]">
                {activeWalkthroughSpace.subtitle}
              </p>
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4EFE6]">
                {activeWalkthroughSpace.areaSqm} M²
              </span>
            </div>

            <h2 className="mt-1.5 font-serif text-2xl font-normal tracking-[0.04em] text-[#F4EFE6]">
              {activeWalkthroughSpace.name}
            </h2>

            <ul className="mt-2.5 grid grid-cols-2 gap-1 border-t border-[rgba(244,239,230,0.12)] pt-2.5 font-mono text-[10px] tracking-[0.08em] text-[rgba(244,239,230,0.78)]">
              {activeWalkthroughSpace.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 shrink-0 bg-[#C29B38]" aria-hidden="true" />
                  <span>{amenity}</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 font-mono text-[9px] tracking-[0.12em] uppercase text-[rgba(244,239,230,0.6)]">
              Drag to look · WASD / Arrows or Click floor to walk
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExitWalkthrough}
                className="rounded-[2px] bg-[#F4EFE6] px-4 py-2 font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
              >
                Exit to Tower View ↑
              </button>
              <button
                type="button"
                onClick={() => openInquiryForLevel(activeWalkthroughSpace.id)}
                className="rounded-[2px] border border-[#C29B38] bg-[#141311] px-4 py-2 font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4EFE6] transition-colors duration-150 hover:bg-[#C29B38] hover:text-[#09090B] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
              >
                Inquire Suite
              </button>
            </div>
          </div>
        ) : isPoolInspecting ? (
          <div className="pointer-events-auto">
            <div
              data-testid="skybridge-inspect-badge"
              className="inline-block rounded-[2px] border border-[#C29B38]/40 bg-[#0C0C0F]/95 px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] uppercase text-[#F4EFE6]"
            >
              Level 34 · Cantilevered Skybridge Spa · 38°C Geothermal Spring
            </div>
            <p className="mt-2.5 font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.7)] editorial-shadow">
              Drag 360° to orbit Skybridge
            </p>
            <button
              type="button"
              onClick={handleExitPoolInspect}
              className="mt-3 rounded-[2px] bg-[#F4EFE6] px-4 py-2 font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
            >
              Return to Elevator ↑
            </button>
          </div>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#C29B38] editorial-shadow">
              {activeChapter.eyebrow}
            </p>
            <h2
              className="mt-2 font-serif text-4xl font-normal tracking-[0.04em] text-[#F4EFE6] editorial-shadow"
              style={{ textWrap: 'balance' }}
            >
              {activeChapter.headline}
            </h2>
            <p className="mt-2 text-sm font-light leading-[1.7] text-[rgba(244,239,230,0.82)] editorial-shadow">
              {activeChapter.copy}
            </p>

            {activeChapter.hint && (
              <p className="mt-3 font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)] editorial-shadow">
                {activeChapter.hint}
              </p>
            )}

            <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-2.5">
              {canStepInside && (
                <button
                  type="button"
                  onClick={() =>
                    handleEnterWalkthrough(activeChapter.id as WalkthroughLevelId)
                  }
                  className="rounded-[2px] bg-[#F4EFE6] px-4 py-2 font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
                >
                  Step Inside (3D Walkthrough)
                </button>
              )}

              {activeChapter.id === 'lvl-34' && (
                <button
                  type="button"
                  onClick={handleEnterPoolInspect}
                  className="rounded-[2px] border border-[#C29B38] bg-[#09090B]/85 px-4 py-2 font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4EFE6] transition-colors duration-150 hover:bg-[#C29B38] hover:text-[#09090B] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
                >
                  Inspect Skybridge Pool
                </button>
              )}

              {(activeChapter.id === 'lvl-52' || activeChapter.id === 'lvl-68') && (
                <button
                  type="button"
                  onClick={() => openInquiryForLevel(activeChapter.id)}
                  className="rounded-[2px] border border-[#C29B38] bg-[#09090B]/85 px-4 py-2 font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4EFE6] transition-colors duration-150 hover:bg-[#C29B38] hover:text-[#09090B] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap"
                >
                  {activeChapter.id === 'lvl-68' ? 'Inquire Penthouse' : 'Inquire Residence'}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Tiny Corner Framerate Verification Badge */}
      <div
        data-testid="fps-badge"
        aria-label="Viewport framerate"
        className="pointer-events-none fixed bottom-1 right-4 z-30 flex items-center gap-1.5 rounded-[2px] border border-[rgba(244,239,230,0.14)] bg-[#09090B]/85 px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] uppercase tabular-nums text-[#F4EFE6]/75 min-[769px]:bottom-3 min-[769px]:right-8"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" aria-hidden="true" />
        <span ref={fpsTextRef}>60 FPS</span>
      </div>

      {/* 500vh Native Vertical Scroll Track */}
      <div className="pointer-events-none relative h-[500vh] w-full" aria-hidden="true" />

      {/* Private Residence Inquiry Dossier Drawer */}
      <InquiryModal
        isOpen={isInquiryOpen}
        defaultLevelId={inquiryDefaultLevelId}
        onClose={() => setIsInquiryOpen(false)}
      />
    </div>
  );
}

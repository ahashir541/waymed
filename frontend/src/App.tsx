import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  supportedLanguages,
  type Language,
} from "./i18n";
import PatientFlow from "./patient/PatientFlow";

const StoryMode = lazy(() => import("./story/StoryMode"));

type ViewMode = "patient" | "story" | "future_scope";

const languageOptions: Array<{ code: Language; key: string }> = [
  { code: "en", key: "language.english" },
  { code: "ur", key: "language.urdu" },
  { code: "sd", key: "language.sindhi" },
];

function App() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [view, setView] = useState<ViewMode>("patient");
  const [activeStage, setActiveStage] = useState(0);
  const [featureRequest, setFeatureRequest] = useState<{
    target: string;
    id: number;
  } | null>(null);
  const [presenterMode, setPresenterMode] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [presenterNotice, setPresenterNotice] = useState("");
  const [showPainLabels, setShowPainLabels] = useState(() => {
    try {
      return window.localStorage.getItem("waymed-pain-labels") !== "false";
    } catch (error) {
      console.warn("Pain-point display preference could not be read.", error);
      return true;
    }
  });
  const currentLanguage = supportedLanguages.includes(i18n.language as Language)
    ? (i18n.language as Language)
    : "en";
  const stages = [
    "stage.empathize",
    "stage.define",
    "stage.ideate",
    "stage.prototype",
    "stage.test",
  ];
  const stageMotion = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: "easeOut" as const };

  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const timer = window.setInterval(
      () => setTimerSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [timerActive, timerSeconds]);

  useEffect(() => {
    if (timerSeconds === 0) setTimerActive(false);
  }, [timerSeconds]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setPresenterMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "f") {
        event.preventDefault();
        void togglePresenterMode();
      } else if (key === "d") {
        openFeature("demo");
      } else if (key === "e") {
        openFeature("emergency");
      } else if (key === "s") {
        setView((current) => (current === "story" ? "patient" : "story"));
      } else if (key === "r") {
        setTimerActive(false);
        setTimerSeconds(300);
        openFeature("reset");
      } else if (key === "p") {
        window.dispatchEvent(
          new CustomEvent("waymed:demo-control", { detail: { action: "pause" } }),
        );
      } else if (key === "l") {
        const index = supportedLanguages.indexOf(currentLanguage);
        void changeLanguage(supportedLanguages[(index + 1) % supportedLanguages.length]);
      } else if (event.key === "ArrowRight") {
        navigateStage(currentLanguage === "en" ? 1 : -1);
      } else if (event.key === "ArrowLeft") {
        navigateStage(currentLanguage === "en" ? -1 : 1);
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [currentLanguage, i18n, view]);

  async function changeLanguage(language: Language) {
    await i18n.changeLanguage(language);
  }

  async function togglePresenterMode() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
      setPresenterNotice("");
    } catch (error) {
      setPresenterNotice(
        `${t("presenter.fullscreenError")} ${
          error instanceof Error ? error.message : ""
        }`.trim(),
      );
    }
  }

  function toggleTimer() {
    if (timerActive) {
      setTimerActive(false);
      return;
    }
    if (timerSeconds === 0) setTimerSeconds(300);
    setTimerActive(true);
  }

  function togglePainLabels() {
    setShowPainLabels((shown) => {
      const next = !shown;
      try {
        window.localStorage.setItem("waymed-pain-labels", String(next));
      } catch (error) {
        console.warn("Pain-point display preference could not be saved.", error);
      }
      return next;
    });
  }

  function navigateStage(direction: number) {
    setActiveStage((current) =>
      Math.min(stages.length - 1, Math.max(0, current + direction)),
    );
    if (view === "future_scope") setView("story");
  }

  function openFeature(target: string) {
    if (target === "future_scope") {
      setActiveStage(4);
      setView("future_scope");
      return;
    }
    setFeatureRequest({ target, id: Date.now() });
    setView("patient");
  }

  function clearFeatureRequest() {
    setFeatureRequest(null);
  }

  return (
    <main className={presenterMode ? "app-shell presenter-mode" : "app-shell"}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label={t("app.brand")}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-wordmark">
            <strong>WayMed</strong>
            <small>{t("app.prototypeLabel")}</small>
          </span>
        </a>

        <nav className="mode-switch" aria-label={t("navigation.label")}>
          <button
            className={view === "patient" ? "mode-button active" : "mode-button"}
            type="button"
            onClick={() => setView("patient")}
            aria-pressed={view === "patient"}
          >
            {t("navigation.patient")}
          </button>
          <button
            className={view === "story" ? "mode-button active" : "mode-button"}
            type="button"
            onClick={() => setView("story")}
            aria-pressed={view === "story"}
          >
            {t("navigation.story")}
          </button>
          <button
            className={view === "future_scope" ? "mode-button active" : "mode-button"}
            type="button"
            onClick={() => openFeature("future_scope")}
            aria-pressed={view === "future_scope"}
          >
            {t("navigation.futureScope")}
          </button>
        </nav>

        <div className="presenter-controls">
          <button
            type="button"
            className="presenter-control-button"
            aria-pressed={showPainLabels}
            onClick={togglePainLabels}
          >
            {showPainLabels
              ? t("settings.hidePainLabels")
              : t("settings.showPainLabels")}
          </button>
          <button
            type="button"
            className="presenter-control-button"
            onClick={() => void togglePresenterMode()}
          >
            {presenterMode ? t("presenter.exit") : t("presenter.enter")}
          </button>
          <button
            type="button"
            className="presenter-control-button timer-control"
            onClick={toggleTimer}
            aria-pressed={timerActive}
          >
            {timerActive ? t("presenter.timerStop") : t("presenter.timerStart")}
          </button>
          {(timerActive || timerSeconds < 300) && (
            <span className="presenter-timer" role="timer">
              {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
              {String(timerSeconds % 60).padStart(2, "0")}
            </span>
          )}
        </div>

        <label className="language-control">
          <span className="sr-only">{t("language.label")}</span>
          <span aria-hidden="true" className="language-globe">
            ◎
          </span>
          <select
            value={currentLanguage}
            onChange={(event) => void changeLanguage(event.target.value as Language)}
            aria-label={t("language.label")}
          >
            {languageOptions.map(({ code, key }) => (
              <option key={code} value={code}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>
      </header>
      {presenterNotice && <p className="presenter-notice" role="status">{presenterNotice}</p>}
      {presenterMode && <p className="keyboard-help">{t("presenter.keyboardHelp")}</p>}

      <section className="stage-section" aria-label={t("stage.sectionLabel")}>
        <div className="stage-heading">
          <span className="eyebrow">{t("stage.sectionLabel")}</span>
          <span className="stage-count">
            {t("stage.progress", {
              current: activeStage + 1,
              total: stages.length,
            })}
          </span>
        </div>
        <div className="stage-track">
          <div className="stage-progress-rail" aria-hidden="true">
            <motion.div
              className="stage-progress-fill"
              animate={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
              transition={stageMotion}
            />
          </div>
          <ol className="stage-list">
            {stages.map((stage, index) => {
              const isComplete = index < activeStage;
              const isActive = index === activeStage;
              return (
                <li
                  className={[
                    "stage-item",
                    isComplete ? "complete" : "",
                    isActive ? "current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={stage}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStage(index);
                      if (view === "future_scope") setView("story");
                    }}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={t(stage)}
                  >
                    <span className="stage-dot" aria-hidden="true">
                      {isComplete ? "✓" : String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{t(stage)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="stage-arrows">
          <button
            type="button"
            className="icon-button"
            onClick={() => navigateStage(-1)}
            disabled={activeStage === 0}
            aria-label={t("stage.previous")}
          >
            <span aria-hidden="true">{currentLanguage === "en" ? "←" : "→"}</span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => navigateStage(1)}
            disabled={activeStage === stages.length - 1}
            aria-label={t("stage.next")}
          >
            <span aria-hidden="true">{currentLanguage === "en" ? "→" : "←"}</span>
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          className={view === "patient" ? "patient-view-transition" : "story-view-transition"}
          key={view}
          initial={{
            opacity: 0,
            x: shouldReduceMotion
              ? 0
              : currentLanguage === "en"
                ? 18
                : -18,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: shouldReduceMotion
              ? 0
              : currentLanguage === "en"
                ? -14
                : 14,
          }}
          transition={stageMotion}
        >
          {view === "patient" ? (
            <PatientFlow
              language={currentLanguage}
              featureRequest={featureRequest}
              onFeatureHandled={clearFeatureRequest}
              showPainLabels={showPainLabels}
            />
          ) : (
            <Suspense fallback={<div className="story-loading-fallback" role="status">{t("storyMode.loading")}</div>}>
              <StoryMode
                activeStage={activeStage}
                onStageChange={setActiveStage}
                onOpenFeature={openFeature}
                onReturnToStory={() => setView("story")}
                futureScopeOnly={view === "future_scope"}
              />
            </Suspense>
          )}
        </motion.section>
      </AnimatePresence>

      <footer className="page-footer">
        <span>{t("footer.assignment")}</span>
        <span>{t("footer.team")}</span>
        <span>{t("footer.disclaimer")}</span>
      </footer>
    </main>
  );
}

export default App;

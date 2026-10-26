import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

type Persona = {
  code: string;
  name: string;
  role: string;
  color: "yellow" | "pink" | "green";
  description: string;
};

type StoryGroup = {
  code: string;
  title: string;
  insight: string;
  pov: string;
  hmws: string[];
  display_translations?: Record<
    "ur" | "sd",
    {
      title: string;
      insight: string;
      pov: string;
      hmws: string[];
      evidence?: string;
    }
  >;
};

type Sticky = {
  number: number;
  code: string;
  group: string;
  type: string;
  text: string;
  needs_teacher_review?: boolean;
  display_translations?: Partial<Record<"ur" | "sd", string>>;
  quote_display_translations?: Partial<Record<"ur" | "sd", string>>;
};

type StoryData = {
  prototype_question: string;
  scope_note: string;
  research_site: string;
  team: string[];
  research_note: string;
  personas: Persona[];
  groups: StoryGroup[];
  selected_hmw: { group: string; number: number; text: string };
  stickies: Sticky[];
  ideate: {
    status: string;
    selected_idea: string;
    selection_reason: string;
    scoring_table: {
      columns: string[];
      rows: Array<Record<string, string | boolean>>;
    };
  };
  test: {
    status: string;
    what_we_changed_after_testing: string[];
  };
  traceability: Array<{ evidence: string; feature: string; target: string }>;
  future_scope: Array<{
    item: string;
    evidence: string;
    display_translations?: Record<"ur" | "sd", { item: string; evidence: string }>;
  }>;
};

type FeedbackSummary = {
  response_count: number;
  average_rating: number | null;
  task_completion_rate: number | null;
  results_notice: string;
};

type StoryModeProps = {
  activeStage: number;
  onStageChange: (stage: number) => void;
  onOpenFeature: (target: string) => void;
  onReturnToStory: () => void;
  futureScopeOnly?: boolean;
};

const API_PREFIX = "/api";

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

function StoryMode({
  activeStage,
  onStageChange,
  onOpenFeature,
  onReturnToStory,
  futureScopeOnly = false,
}: StoryModeProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const language =
    currentLanguage === "ur" || currentLanguage === "sd"
      ? currentLanguage
      : "en";
  const reduceMotion = useReducedMotion();
  const [story, setStory] = useState<StoryData | null>(null);
  const [storyError, setStoryError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedPersona, setSelectedPersona] = useState("all");
  const [showUnreviewed, setShowUnreviewed] = useState(false);
  const [whyOpen, setWhyOpen] = useState(true);
  const [feedback, setFeedback] = useState({
    taskCompleted: "",
    timeMinutes: "",
    confusion: "",
    rating: 0,
  });
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    let active = true;
    requestJson<StoryData>("/story")
      .then((data) => {
        if (active) setStory(data);
      })
      .catch((error: unknown) => {
        if (active) {
          setStoryError(
            error instanceof Error ? error.message : t("errors.unexpected"),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function refreshSummary() {
    setSummaryError("");
    try {
      const result = await requestJson<FeedbackSummary>("/feedback/summary");
      setSummary(result);
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : t("errors.unexpected"),
      );
    }
  }

  useEffect(() => {
    if (activeStage === 4) void refreshSummary();
  }, [activeStage]);

  const visibleStickies = useMemo(() => {
    if (!story) return [];
    return story.stickies.filter((sticky) => {
      const matchesGroup = selectedGroup === "all" || sticky.group === selectedGroup;
      const matchesPersona =
        selectedPersona === "all" || sticky.code === selectedPersona;
      const reviewed = showUnreviewed || !sticky.needs_teacher_review;
      return matchesGroup && matchesPersona && reviewed;
    });
  }, [selectedGroup, selectedPersona, showUnreviewed, story]);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!feedback.taskCompleted || feedback.rating === 0) return;
    setFeedbackBusy(true);
    setFeedbackError("");
    setFeedbackNotice("");
    try {
      await requestJson<{ saved: boolean }>("/feedback", {
        method: "POST",
        body: JSON.stringify({
          task_completed: feedback.taskCompleted === "yes",
          time_taken_seconds: feedback.timeMinutes
            ? Math.round(Number(feedback.timeMinutes) * 60)
            : null,
          confusion_text: feedback.confusion.trim() || null,
          rating: feedback.rating,
        }),
      });
      setFeedbackNotice(t("storyMode.feedbackSaved"));
      setFeedback({
        taskCompleted: "",
        timeMinutes: "",
        confusion: "",
        rating: 0,
      });
      await refreshSummary();
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : t("errors.unexpected"),
      );
    } finally {
      setFeedbackBusy(false);
    }
  }

  if (storyError) {
    return (
      <section className="story-mode" aria-live="polite">
        <div className="story-error" role="alert">
          {t("storyMode.loadError")}: {storyError}
        </div>
      </section>
    );
  }
  if (!story) {
    return (
      <section className="story-mode" aria-live="polite">
        <div className="story-loading" />
        <p>{t("storyMode.loading")}</p>
      </section>
    );
  }

  if (futureScopeOnly) {
    return (
      <section className="story-mode future-scope-screen">
        <header className="story-mode-header">
          <div>
            <span className="eyebrow">{t("storyMode.futureRoadmapKicker")}</span>
            <h1>{t("storyMode.futureScope")}</h1>
            <p>{t("storyMode.futureScopeHelp")}</p>
          </div>
          <span className="story-research-site">
            {t("stage.test")}: {story.test.status}
          </span>
        </header>
        <p className="story-integrity-note">{t("storyMode.scopeNote")}</p>
        {language !== "en" && (
          <p className="story-integrity-note" role="note">
            {t("storyMode.translationDraftNotice")}
          </p>
        )}
        <div className="future-roadmap" aria-label={t("storyMode.futureRoadmapKicker")}>
          {story.future_scope.map((item, index) => {
            const translation =
              language === "en" ? undefined : item.display_translations?.[language];
            return (
              <motion.article
                className="future-roadmap-item"
                key={item.item}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.08 }}
              >
                <span className="future-roadmap-marker" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{translation?.item ?? item.item}</h2>
                  <p>{translation?.evidence ?? item.evidence}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
        <p className="future-scope-next">
          {t("storyMode.whatNext")}: {t("stage.test")} — {story.test.status}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={onReturnToStory}
        >
          {t("storyMode.backToTest")}
        </button>
      </section>
    );
  }

  const stageKeys = ["empathize", "define", "ideate", "prototype", "test"];
  const activeKey = stageKeys[activeStage] ?? "empathize";
  const evidenceByGroup: Record<string, number[]> = {
    empathize: [6, 7, 8, 9, 11],
    define: [6, 7, 8, 9, 11],
    ideate: [6, 7, 9],
    prototype: [6, 7, 9, 13, 14, 16],
    test: [6, 7, 9],
  };
  const evidenceText = story.stickies
    .filter((sticky) => evidenceByGroup[activeKey]?.includes(sticky.number))
    .map((sticky) => `${t("storyMode.sticky")} ${sticky.number} (${sticky.code}): ${sticky.text}`)
    .join(" ");
  const stageReason: Record<string, string> = {
    empathize: t("storyMode.whyEmpathize"),
    define: t("storyMode.whyDefine"),
    ideate: t("storyMode.whyIdeate"),
    prototype: t("storyMode.whyPrototype"),
    test: t("storyMode.whyTest"),
  };
  const storyText = (
    original: string,
    translations?: Partial<Record<"ur" | "sd", string>>,
  ) => (language === "en" ? original : translations?.[language] ?? original);

  return (
    <section className="story-mode">
      <header className="story-mode-header">
        <div>
          <span className="eyebrow">{t(`stage.${activeKey}`)}</span>
          <h1>{t(`storyMode.title.${activeKey}`)}</h1>
          <p>{t(`storyMode.subtitle.${activeKey}`)}</p>
        </div>
        <span className="story-research-site">
          {t("storyMode.researchContext")}: {story.research_site}
        </span>
      </header>
      <p className="story-integrity-note">{t("storyMode.dataBoundary")}</p>
      {language !== "en" && (
        <p className="story-integrity-note" role="note">
          {t("storyMode.translationDraftNotice")}
        </p>
      )}

      <motion.section
        className="stage-rationale"
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      >
        <button
          className="rationale-toggle"
          type="button"
          aria-expanded={whyOpen}
          onClick={() => setWhyOpen((open) => !open)}
        >
          <span>{t("storyMode.whyStage", { stage: t(`stage.${activeKey}`) })}</span>
          <span aria-hidden="true">{whyOpen ? "−" : "+"}</span>
        </button>
        <AnimatePresence initial={false}>
          {whyOpen && (
            <motion.div
              className="rationale-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
            >
              <div>
                <strong>{t("storyMode.stageLabel")}</strong>
                <p>{t(`stage.${activeKey}`)}</p>
              </div>
              <div>
                <strong>{t("storyMode.questionLabel")}</strong>
                <p>{stageReason[activeKey]}</p>
              </div>
              <div>
                <strong>{t("storyMode.evidenceLabel")}</strong>
                <p>
                  {activeKey === "define" && language !== "en"
                    ? story.groups.find((group) => group.code === "B")
                        ?.display_translations?.[language]?.evidence ?? evidenceText
                    : evidenceText}
                </p>
              </div>
              <div>
                <strong>{t("storyMode.nextStage")}</strong>
                <p>
                  {activeStage < 4
                    ? t(`stage.${stageKeys[activeStage + 1]}`)
                    : t("storyMode.nextStagePlaceholder")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {activeStage === 0 && (
        <>
          <section className="story-section">
            <div className="section-heading">
              <h2>{t("storyMode.peopleTitle")}</h2>
              <p>{t("storyMode.personaHelp")}</p>
            </div>
            <div className="persona-grid">
              {story.personas.map((persona, index) => (
                <motion.article
                  className={`persona-card persona-${persona.color}`}
                  key={persona.code}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.055 }}
                >
                  <span className="persona-code">{persona.code}</span>
                  <h3>{persona.name}</h3>
                  <p className="persona-role">{persona.role}</p>
                  <p>{persona.description}</p>
                  <button
                    className="persona-filter"
                    type="button"
                    aria-pressed={selectedPersona === persona.code}
                    onClick={() =>
                      setSelectedPersona((current) =>
                        current === persona.code ? "all" : persona.code,
                      )
                    }
                  >
                    {selectedPersona === persona.code
                      ? t("storyMode.clearFilter")
                      : t("storyMode.filterPersona")}
                  </button>
                </motion.article>
              ))}
            </div>
            <p className="research-note">{story.research_note}</p>
            <p className="research-note">
              <strong>{t("storyMode.team")}:</strong> {story.team.join(" · ")}
            </p>
          </section>
          <section className="story-section">
            <div className="section-heading">
              <div>
                <h2>{t("storyMode.affinityTitle")}</h2>
                <p>{t("storyMode.affinityHelp")}</p>
              </div>
              <label className="review-toggle">
                <input
                  type="checkbox"
                  checked={showUnreviewed}
                  onChange={(event) => setShowUnreviewed(event.target.checked)}
                />
                <span>{t("storyMode.showUnreviewed")}</span>
              </label>
            </div>
            <div className="story-filters" aria-label={t("storyMode.filters")}>
              <button
                type="button"
                className={selectedGroup === "all" ? "filter-chip active" : "filter-chip"}
                onClick={() => setSelectedGroup("all")}
              >
                {t("storyMode.allGroups")}
              </button>
              {story.groups.map((group) => (
                <button
                  type="button"
                  className={selectedGroup === group.code ? "filter-chip active" : "filter-chip"}
                  key={group.code}
                  onClick={() =>
                    setSelectedGroup((current) =>
                      current === group.code ? "all" : group.code,
                    )
                  }
                >
                  {t("storyMode.group")} {group.code}
                </button>
              ))}
            </div>
            <div className="affinity-wall">
              {story.groups
                .filter((group) => selectedGroup === "all" || group.code === selectedGroup)
                .map((group, groupIndex) => {
                  const groupStickies = visibleStickies.filter(
                    (sticky) => sticky.group === group.code,
                  );
                  if (!groupStickies.length) return null;
                  return (
                    <motion.section
                      className="sticky-cluster"
                      key={group.code}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : groupIndex * 0.07 }}
                    >
                      <h3>
                        <span>{t("storyMode.group")} {group.code}</span>
                        {group.title}
                      </h3>
                      <div className="sticky-grid">
                        {groupStickies.map((sticky, index) => (
                          <motion.article
                            className={`research-sticky sticky-${story.personas.find((item) => item.code === sticky.code)?.color ?? "yellow"}`}
                            key={sticky.number}
                            initial={{ opacity: 0, y: reduceMotion ? 0 : -10, rotate: 0 }}
                            animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
                            whileHover={reduceMotion ? undefined : { y: -5, scale: 1.02 }}
                            transition={{ delay: reduceMotion ? 0 : index * 0.018 }}
                          >
                            <div>
                              <span>#{sticky.number} · {sticky.code}</span>
                              <span>
                                {t(`storyMode.stickyTypes.${sticky.type.toLowerCase()}`, {
                                  defaultValue: sticky.type,
                                })}
                              </span>
                            </div>
                            <p>
                              {storyText(
                                sticky.quote_display_translations &&
                                  language !== "en"
                                  ? sticky.quote_display_translations[language] ??
                                      sticky.text
                                  : sticky.text,
                                sticky.display_translations,
                              )}
                              {sticky.quote_display_translations &&
                                language !== "en" && (
                                  <small className="translation-review-note">
                                    {t("storyMode.needsNativeReview")}
                                  </small>
                                )}
                            </p>
                          </motion.article>
                        ))}
                      </div>
                    </motion.section>
                  );
                })}
            </div>
            <p className="story-count">
              {t("storyMode.showingStickies", {
                shown: visibleStickies.length,
                total: story.stickies.filter(
                  (sticky) => showUnreviewed || !sticky.needs_teacher_review,
                ).length,
              })}
            </p>
          </section>
        </>
      )}

      {activeStage === 1 && (
        <section className="story-section define-groups">
          <p className="scope-note">{story.scope_note}</p>
          {story.groups.map((group) => (
            <details className="define-card" key={group.code} open={group.code === "B"}>
              <summary>
                <span className="group-badge">{t("storyMode.group")} {group.code}</span>
                <strong>                {storyText(
                  group.title,
                  group.display_translations
                    ? { ur: group.display_translations.ur.title, sd: group.display_translations.sd.title }
                    : undefined,
                )}</strong>
                {group.code === story.selected_hmw.group && (
                  <span className="selected-label">{t("storyMode.selectedProblem")}</span>
                )}
              </summary>
              <div className="define-card-content">
                <div><strong>{t("storyMode.insight")}</strong><p>{storyText(group.insight, group.display_translations ? { ur: group.display_translations.ur.insight, sd: group.display_translations.sd.insight } : undefined)}</p></div>
                <div><strong>{t("storyMode.pointOfView")}</strong><p>{storyText(group.pov, group.display_translations ? { ur: group.display_translations.ur.pov, sd: group.display_translations.sd.pov } : undefined)}</p></div>
                <div>
                  <strong>{t("storyMode.hmwQuestions")}</strong>
                  <ol>
                    {group.hmws.map((hmw, index) => {
                      const selected =
                        group.code === story.selected_hmw.group &&
                        index + 1 === story.selected_hmw.number;
                      return (
                        <li className={selected ? "selected-hmw" : ""} key={hmw}>
                          {storyText(
                            hmw,
                            group.display_translations
                              ? {
                                  ur: group.display_translations.ur.hmws[index],
                                  sd: group.display_translations.sd.hmws[index],
                                }
                              : undefined,
                          )}
                          {selected && <span>{t("storyMode.selectedProblem")}</span>}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </details>
          ))}
        </section>
      )}

      {activeStage === 2 && (
        <section className="story-section">
          <p className="placeholder-banner">{story.ideate.status}</p>
          <div className="ideate-selection">
            <span className="selected-label">{t("storyMode.selectedIdea")}: {story.ideate.selected_idea}</span>
            <p><strong>{t("storyMode.selectionReason")}:</strong> {story.ideate.selection_reason}</p>
          </div>
          <div className="scoring-table-wrap">
            <table className="scoring-table">
              <thead><tr>{story.ideate.scoring_table.columns.map((column) =>               <th key={column}>
                {t(`storyMode.scoreColumn.${column.toLowerCase()}`, {
                  defaultValue: column,
                })}
              </th>)}</tr></thead>
              <tbody>
                {story.ideate.scoring_table.rows.map((row, index) => (
                  <tr className={row.selected ? "idea-selected" : ""} key={`${row.idea}-${index}`}>
                    <th scope="row">{String(row.idea)}{row.selected && <span className="selected-label">{t("storyMode.selected")}</span>}</th>
                    {["advantages", "disadvantages", "usability", "adaptability"].map((key) => (
                      <td key={key}>{String(row[key] ?? "[PLACEHOLDER]")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeStage === 3 && (
        <section className="story-section">
          <p className="scope-note">{story.scope_note}</p>
          <div className="trace-list">
            {story.traceability.map((item, index) => (
              <motion.button
                className="trace-row"
                type="button"
                key={`${item.target}-${index}`}
                onClick={() => {
                  if (item.target === "future_scope") {
                    onOpenFeature("future_scope");
                  } else {
                    onOpenFeature(item.target);
                  }
                }}
                whileHover={reduceMotion ? undefined : { x: 4 }}
              >
                <span className="trace-evidence">{item.evidence}</span>
                <span className="trace-arrow" aria-hidden="true">→</span>
                <span className="trace-feature">{item.feature}</span>
                <span className="trace-link">{t("storyMode.openFeature")}</span>
              </motion.button>
            ))}
          </div>
          <section className="future-scope-card" id="future-scope">
            <h2>{t("storyMode.futureScope")}</h2>
            <p>{t("storyMode.futureScopeHelp")}</p>
            <ul>
              {story.future_scope.map((item) => {
                const translation =
                  language === "en" ? undefined : item.display_translations?.[language];
                return (
                  <li key={item.item}>
                    <strong>{translation?.item ?? item.item}</strong>
                    <span>{translation?.evidence ?? item.evidence}</span>
                  </li>
                );
              })}
            </ul>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onOpenFeature("future_scope")}
            >
              {t("navigation.futureScope")}
            </button>
            <p className="future-scope-next">
              {t("stage.test")}: {story.test.status}
            </p>
          </section>
        </section>
      )}

      {activeStage === 4 && (
        <section className="story-section test-stage">
          <div className="test-intro">
            <div>
              <h2>{t("storyMode.feedbackTitle")}</h2>
              <p>{t("storyMode.feedbackHelp")}</p>
            </div>
            <span className="privacy-note">{t("storyMode.privacyNote")}</span>
          </div>
          <form className="feedback-form" onSubmit={(event) => void submitFeedback(event)}>
            <fieldset>
              <legend>{t("storyMode.taskCompleted")} *</legend>
              <label><input type="radio" name="task" value="yes" required checked={feedback.taskCompleted === "yes"} onChange={(event) => setFeedback((current) => ({ ...current, taskCompleted: event.target.value }))} /> {t("storyMode.yes")}</label>
              <label><input type="radio" name="task" value="no" required checked={feedback.taskCompleted === "no"} onChange={(event) => setFeedback((current) => ({ ...current, taskCompleted: event.target.value }))} /> {t("storyMode.no")}</label>
            </fieldset>
            <label className="feedback-field">
              <span>{t("storyMode.timeTaken")}</span>
              <input type="number" min="0" max="1440" step="1" value={feedback.timeMinutes} onChange={(event) => setFeedback((current) => ({ ...current, timeMinutes: event.target.value }))} placeholder={t("storyMode.optional")} />
            </label>
            <label className="feedback-field">
              <span>{t("storyMode.confusion")}</span>
              <textarea maxLength={2000} value={feedback.confusion} onChange={(event) => setFeedback((current) => ({ ...current, confusion: event.target.value }))} placeholder={t("storyMode.confusionPlaceholder")} />
            </label>
            <fieldset className="rating-field">
              <legend>{t("storyMode.rating")} *</legend>
              <div className="rating-buttons" role="radiogroup" aria-label={t("storyMode.rating")}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button type="button" key={rating} role="radio" aria-checked={feedback.rating === rating} className={rating <= feedback.rating ? "rating-star selected" : "rating-star"} onClick={() => setFeedback((current) => ({ ...current, rating }))}>
                    {rating}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="primary-button feedback-submit" type="submit" disabled={feedbackBusy || !feedback.taskCompleted || feedback.rating === 0}>
              {feedbackBusy ? t("storyMode.saving") : t("storyMode.submitFeedback")}
            </button>
            {feedbackError && <p className="feedback-error" role="alert">{feedbackError}</p>}
            {feedbackNotice && <p className="feedback-success" role="status">{feedbackNotice}</p>}
          </form>

          <div className="results-panel">
            <div className="section-heading">
              <div>
                <h2>{t("storyMode.resultsTitle")}</h2>
                <p>{summary?.results_notice ?? t("storyMode.resultsLoading")}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => void refreshSummary()}>{t("storyMode.refreshResults")}</button>
            </div>
            {summaryError && <p className="feedback-error" role="alert">{summaryError}</p>}
            {summary && (
              <div className="result-metrics">
                <motion.article className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <span>{t("storyMode.responses")}</span><strong>{summary.response_count}</strong>
                  <div className="metric-bar"><motion.i animate={{ width: `${Math.min(100, summary.response_count * 10)}%` }} /></div>
                </motion.article>
                <motion.article className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}>
                  <span>{t("storyMode.completionRate")}</span><strong>{summary.task_completion_rate === null ? "—" : `${Math.round(summary.task_completion_rate * 100)}%`}</strong>
                  <div className="metric-bar"><motion.i animate={{ width: `${(summary.task_completion_rate ?? 0) * 100}%` }} /></div>
                </motion.article>
                <motion.article className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}>
                  <span>{t("storyMode.averageRating")}</span><strong>{summary.average_rating === null ? "—" : `${summary.average_rating} / 5`}</strong>
                  <div className="metric-bar"><motion.i animate={{ width: `${((summary.average_rating ?? 0) / 5) * 100}%` }} /></div>
                </motion.article>
              </div>
            )}
            <div className="changed-after-test">
              <h3>{t("storyMode.changedAfterTest")}</h3>
              <ul>{story.test.what_we_changed_after_testing.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
            </div>
            <p className="scope-note">{t("storyMode.testHonesty")}</p>
          </div>
        </section>
      )}
      <div className="story-stage-controls">
        <button className="secondary-button" type="button" onClick={() => onStageChange(Math.max(0, activeStage - 1))} disabled={activeStage === 0}>{t("stage.previous")}</button>
        <button className="primary-button" type="button" onClick={() => onStageChange(Math.min(4, activeStage + 1))} disabled={activeStage === 4}>{t("stage.next")}</button>
      </div>
    </section>
  );
}

export default StoryMode;

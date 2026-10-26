import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Language } from "../i18n";

type PatientRole = "myself" | "my_child" | "my_relative";
type Sex = "female" | "male" | "other" | "prefer_not_to_say";
type DoctorGenderPreference = "" | "female" | "male";

type Recommendation = {
  department_code: string;
  department: string;
  confidence: number;
  confidence_source: string;
  reason: string;
  why: string;
};

type RouteResponse = {
  locations: Array<{ code: string; name: string; floor: number; type: string }>;
  steps: Array<{ from: string; to: string; landmark: string; floor: number }>;
  distance_m: number;
  estimated_walking_minutes: number;
  accessible: boolean;
  accessible_route_suggested?: boolean;
  fictional_demo_map: boolean;
};

type Doctor = {
  id: number;
  name: string;
  specialty_code: string;
  specialty_en: string;
  specialty_ur: string;
  specialty_sd: string;
  languages: string[];
  gender: string;
  fit_score: number;
  fit_reasons: Record<string, string>;
  next_slots: Array<{ starts_at: string; ends_at: string }>;
  soonest_slot: { starts_at: string; ends_at: string } | null;
};

type JourneyStage = {
  stage: string;
  label: string;
  status: "done" | "current" | "upcoming";
  time_spent_seconds: number | null;
};

type JourneyResponse = {
  visit_id: string;
  stages: JourneyStage[];
  next_step: string;
  disclaimer: string;
};

type FeatureRequest = { target: string; id: number };

type SpeechRecognitionResultEvent = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const API_PREFIX = "/api";
const RED_FLAG_OPTIONS = [
  ["chest_pain", "intake.redFlagChest"],
  ["breathing_trouble", "intake.redFlagBreathing"],
  ["heavy_bleeding", "intake.redFlagBleeding"],
  ["stroke_signs", "intake.redFlagStroke"],
  ["unconsciousness", "intake.redFlagUnconscious"],
  ["severe_injury", "intake.redFlagInjury"],
] as const;

const SYMPTOMS = [
  { icon: "🌡️", key: "fever", code: "my child has a fever" },
  { icon: "🫁", key: "breathing", code: "trouble breathing" },
  { icon: "💓", key: "heart", code: "heart check-up" },
  { icon: "🦴", key: "joint", code: "joint pain after a fall" },
  { icon: "👂", key: "ear", code: "ear discomfort" },
  { icon: "🩹", key: "skin", code: "itchy skin irritation" },
  { icon: "🤕", key: "pain", code: "ongoing pain" },
  { icon: "🩺", key: "other", code: "general health concern" },
] as const;

const SYMPTOM_TERMS: Record<
  (typeof SYMPTOMS)[number]["key"],
  Record<Language, string>
> = {
  fever: {
    en: "fever",
    ur: "بخار",
    sd: "بخار",
  },
  breathing: {
    en: "trouble breathing",
    ur: "سانس لینے میں مشکل",
    sd: "ساهه کڻڻ ۾ تڪليف",
  },
  heart: {
    en: "heart check-up",
    ur: "دل کے معائنے",
    sd: "دل جي جاچ",
  },
  joint: {
    en: "joint pain after a fall",
    ur: "گرنے کے بعد جوڑوں میں درد",
    sd: "ڪرڻ کان پوءِ جوڙن ۾ سور",
  },
  ear: {
    en: "ear discomfort",
    ur: "کان میں تکلیف",
    sd: "ڪن ۾ تڪليف",
  },
  skin: {
    en: "itchy skin",
    ur: "جلد پر خارش",
    sd: "چمڙي تي خارش",
  },
  pain: {
    en: "ongoing pain",
    ur: "مسلسل درد",
    sd: "مسلسل سور",
  },
  other: {
    en: "general checkup",
    ur: "عمومی صحت کا معائنہ",
    sd: "عام صحت جي جاچ",
  },
};

function getLanguageCode(language: Language): string {
  return { en: "en-US", ur: "ur-PK", sd: "sd-PK" }[language];
}

function formatSlot(value: string, language: Language): string {
  return new Intl.DateTimeFormat(
    { en: "en", ur: "ur-PK", sd: "sd-PK" }[language],
    { weekday: "short", hour: "numeric", minute: "2-digit" },
  ).format(new Date(value));
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const responseText = await response.text();
    let detail = `Request failed (${response.status}).`;
    if (responseText) {
      try {
        const body = JSON.parse(responseText) as { detail?: string };
        detail = body.detail ?? detail;
      } catch {
        detail = responseText;
      }
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

function PatientFlow({
  language,
  featureRequest,
  onFeatureHandled,
  showPainLabels,
}: {
  language: Language;
  featureRequest: FeatureRequest | null;
  onFeatureHandled: () => void;
  showPainLabels: boolean;
}) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [screen, setScreen] = useState<"welcome" | "intake" | "results" | "doctors" | "route" | "journey">("welcome");
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<PatientRole>("myself");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [complaint, setComplaint] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(5);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [mobilitySupport, setMobilitySupport] = useState(false);
  const [pregnancyRelated, setPregnancyRelated] = useState<"yes" | "no" | "unsure" | "">("");
  const [visitId, setVisitId] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendation, setRecommendation] = useState<Record<string, unknown> | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorGenderPreference, setDoctorGenderPreference] =
    useState<DoctorGenderPreference>("");
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [destination, setDestination] = useState("reception");
  const [landmark, setLandmark] = useState("entrance");
  const [locations, setLocations] = useState<RouteResponse["locations"]>([]);
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoScenarioActive, setDemoScenarioActive] = useState(false);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoCaption, setDemoCaption] = useState("");
  const [painLabelDismissed, setPainLabelDismissed] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const demoPausedRef = useRef(false);
  const demoSkipRef = useRef(false);
  const demoCancelledRef = useRef(false);
  const handledFeatureRequestRef = useRef<number | null>(null);
  const lastLanguageRef = useRef(language);
  const languageRequestSequenceRef = useRef(0);

  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  const intakeSteps = useMemo(() => {
    const questions = [
      "role",
      "age",
      "sex",
      "complaint",
      "redFlags",
      "duration",
      "severity",
      "mobility",
    ];
    if (
      sex === "female" &&
      Number(age) >= 12 &&
      Number(age) < 56 &&
      role !== "my_child"
    ) {
      questions.splice(5, 0, "pregnancy");
    }
    return questions;
  }, [age, role, sex]);

  const currentIntakeStep = intakeSteps[step] ?? "role";
  const speechRecognitionConstructor =
    (window as SpeechRecognitionWindow).SpeechRecognition ??
    (window as SpeechRecognitionWindow).webkitSpeechRecognition;
  const speechSupported = Boolean(
    speechRecognitionConstructor &&
      (language === "en" || language === "ur" || language === "sd"),
  );

  useEffect(() => {
    setPainLabelDismissed(false);
  }, [screen]);

  useEffect(() => {
    if (screen !== "route" || !route || route.locations.length < 2) return;
    const timer = window.setTimeout(() => setNotice(t("wayfinding.arrived")), 500);
    return () => window.clearTimeout(timer);
  }, [route, screen, t]);

  useEffect(() => {
    if (
      !featureRequest ||
      handledFeatureRequestRef.current === featureRequest.id
    ) {
      return;
    }
    handledFeatureRequestRef.current = featureRequest.id;
    if (featureRequest.target === "intake") {
      beginIntake();
    } else if (featureRequest.target === "wayfinding") {
      setAge("30");
      setDestination("child_emergency");
      void loadRoute("entrance", "child_emergency");
    } else if (featureRequest.target === "journey") {
      setJourney({
        visit_id: "story-preview",
        stages: [
          "arrival",
          "registration",
          "consultation",
          "lab_radiology",
          "pharmacy",
          "exit",
        ].map((stage, index) => ({
          stage,
          label: t(`journey.stages.${stage}`),
          status: index === 0 ? "done" : index === 1 ? "current" : "upcoming",
          time_spent_seconds: null,
        })),
        next_step: t("common.humanHelp"),
        disclaimer: t("journey.disclaimer"),
      });
      setScreen("journey");
    } else if (featureRequest.target === "demo") {
      void runDemoJourney();
    } else if (featureRequest.target === "emergency") {
      void startEmergencyDemo();
    } else if (featureRequest.target === "reset") {
      demoCancelledRef.current = true;
      demoPausedRef.current = false;
      setDemoRunning(false);
      setDemoScenarioActive(false);
      setDemoPaused(false);
      setScreen("welcome");
      setVisitId("");
      setJourney(null);
      setRecommendation(null);
      setRecommendations([]);
      setError("");
      setNotice("");
    }
    onFeatureHandled();
  }, [featureRequest?.id]);

  useEffect(() => {
    if (lastLanguageRef.current === language) return;
    lastLanguageRef.current = language;
    const sequence = ++languageRequestSequenceRef.current;

    if (screen === "results" && recommendation) {
      void (async () => {
        setBusy(true);
        setError("");
        try {
          const result = await apiRequest<Record<string, unknown>>("/recommend", {
            method: "POST",
            body: JSON.stringify({
              patient_age: Number(age),
              patient_role: role,
              complaint_text: complaint,
              language_code: language,
              red_flags: redFlags,
              starting_location: "entrance",
              mobility_support: mobilitySupport,
            }),
          });
          if (languageRequestSequenceRef.current !== sequence) return;
          const translatedRecommendations =
            (result.recommendations as Recommendation[]) ?? [];
          setRecommendation(result);
          setRecommendations(translatedRecommendations);
          setDestination(
            translatedRecommendations[0]?.department_code ?? destination,
          );
          if (result.emergency) {
            setRoute((result.route as RouteResponse | undefined) ?? null);
          }
        } catch (requestError) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : t("errors.unexpected"),
          );
        } finally {
          if (languageRequestSequenceRef.current === sequence) setBusy(false);
        }
      })();
    } else if (screen === "doctors") {
      void loadDoctors(destination);
    } else if (screen === "route") {
      void loadRoute(landmark, destination);
    } else if (screen === "journey" && journey) {
      const current = journey.stages.find((stage) => stage.status === "current");
      setJourney({
        ...journey,
        next_step: current
          ? t("journey.actionNext", {
              step: t(`journey.stages.${current.stage}`),
            })
          : t("common.humanHelp"),
      });
    }
  }, [language]);

  useEffect(() => {
    function onDemoControl() {
      if (!demoRunning) return;
      const nextPaused = !demoPausedRef.current;
      demoPausedRef.current = nextPaused;
      setDemoPaused(nextPaused);
    }
    window.addEventListener("waymed:demo-control", onDemoControl);
    return () => window.removeEventListener("waymed:demo-control", onDemoControl);
  }, [demoRunning]);

  function beginIntake(selectedRole: PatientRole = "myself") {
    setDemoScenarioActive(false);
    setRole(selectedRole);
    setAge(selectedRole === "my_child" ? "7" : "");
    setSex("");
    setComplaint("");
    setDuration("");
    setSeverity(5);
    setRedFlags([]);
    setMobilitySupport(false);
    setPregnancyRelated("");
    setDoctorGenderPreference("");
    setStep(0);
    setError("");
    setNotice("");
    setScreen("intake");
  }

  function canAdvance(): boolean {
    if (currentIntakeStep === "age") return age !== "" && Number(age) <= 120;
    if (currentIntakeStep === "complaint") return complaint.trim().length > 0;
    if (currentIntakeStep === "sex") return sex !== "";
    if (currentIntakeStep === "pregnancy") return pregnancyRelated !== "";
    return true;
  }

  function toggleFlag(flag: string) {
    setRedFlags((selected) =>
      selected.includes(flag)
        ? selected.filter((item) => item !== flag)
        : [...selected, flag],
    );
  }

  function selectSymptom(key: (typeof SYMPTOMS)[number]["key"]) {
    setSelectedSymptom(key);
    if (key === "fever") {
      const isChild = role === "my_child" || Number(age) < 18;
      const phrase = {
        en: isChild ? "my child has a fever" : "adult fever",
        ur: isChild ? "بچے کو بخار" : "بالغ کو بخار",
        sd: isChild ? "ٻار کي بخار" : "وڏي ماڻهو کي بخار",
      }[language];
      setComplaint(phrase);
      return;
    }
    setComplaint(SYMPTOM_TERMS[key][language]);
  }

  function startVoiceInput() {
    if (!speechRecognitionConstructor) return;
    const recognition = new speechRecognitionConstructor();
    recognition.lang = getLanguageCode(language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setComplaint((previous) => `${previous} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setError(t("intake.voiceError"));
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    setError("");
    setListening(true);
    try {
      recognition.start();
    } catch (recognitionError) {
      setListening(false);
      setError(
        recognitionError instanceof Error
          ? recognitionError.message
          : t("intake.voiceError"),
      );
    }
  }

  async function submitIntake() {
    setBusy(true);
    setAnalyzing(true);
    setError("");
    const numericAge = Number(age);
    const patientRole = role;
    try {
      const intake = await apiRequest<{ visit_id: string }>("/intake", {
        method: "POST",
        body: JSON.stringify({
          patient_age: numericAge,
          patient_sex: sex || null,
          patient_role: patientRole,
          complaint_text: complaint.trim(),
          language_code: language,
          duration: duration || null,
          severity,
          red_flags: redFlags,
          mobility_support: mobilitySupport,
        }),
      });
      setVisitId(intake.visit_id);
      const result = await apiRequest<Record<string, unknown>>("/recommend", {
        method: "POST",
        body: JSON.stringify({
          patient_age: numericAge,
          patient_role: patientRole,
          complaint_text: complaint.trim(),
          language_code: language,
          red_flags: redFlags,
          mobility_support: mobilitySupport,
          starting_location: "entrance",
        }),
      });
      const suggestions = result.recommendations as Recommendation[];
      setRecommendation(result);
      setRecommendations(suggestions ?? []);
      if (result.emergency) {
        setDestination(suggestions?.[0]?.department_code ?? "adult_emergency");
        setRoute((result.route as RouteResponse | undefined) ?? null);
        setNotice("");
      } else {
        setDestination(suggestions?.[0]?.department_code ?? "reception");
      }
      setScreen("results");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("errors.unexpected"),
      );
    } finally {
      setBusy(false);
      setAnalyzing(false);
    }
  }

  async function loadDoctors(
    departmentCode: string,
    genderPreference: DoctorGenderPreference = doctorGenderPreference,
  ) {
    setBusy(true);
    setError("");
    setDestination(departmentCode);
    try {
      const params = new URLSearchParams({
        dept: departmentCode,
        language,
      });
      if (genderPreference) params.set("gender", genderPreference);
      const response = await apiRequest<{ doctors: Doctor[] }>(
        `/doctors?${params.toString()}`,
      );
      setDoctors(response.doctors);
      setDoctorGenderPreference(genderPreference);
      setSelectedSlot(null);
      setScreen("doctors");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function loadRoute(from = "entrance", to = destination) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<RouteResponse>(
        `/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&language=${language}&patient_age=${Number(age)}&mobility_support=${mobilitySupport}`,
      );
      setLandmark(from);
      setRoute(response);
      setScreen("route");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function recalculateRoute() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<RouteResponse & { rerouted: boolean }>(
        "/route/recalculate",
        {
          method: "POST",
          body: JSON.stringify({
            nearest_landmark: landmark,
            destination,
            language,
            patient_age: Number(age),
            mobility_support: mobilitySupport,
          }),
        },
      );
      setRoute(response);
      setNotice(t("wayfinding.routeUpdated"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function showWaitingAreas() {
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest<{
        nearest_waiting_area: RouteResponse | null;
      }>(
        `/waiting-areas?from=${encodeURIComponent(landmark)}&language=${language}&patient_age=${Number(age)}&mobility_support=${mobilitySupport}`,
      );
      if (!response.nearest_waiting_area) {
        throw new Error(t("wayfinding.noWaiting"));
      }
      setRoute(response.nearest_waiting_area);
      setDestination(response.nearest_waiting_area.locations.at(-1)?.code ?? destination);
      setNotice(t("wayfinding.nearestWaiting"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function loadLocations() {
    try {
      const response = await apiRequest<{ locations: RouteResponse["locations"] }>(
        `/locations?language=${language}`,
      );
      setLocations(response.locations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    }
  }

  async function startJourney(visitCode = visitId) {
    if (!visitCode) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/journey/events?visit_id=" + encodeURIComponent(visitCode), {
        method: "POST",
        body: JSON.stringify({
          stage: "arrival",
          status: "done",
          time_spent_seconds: 0,
        }),
      });
      await apiRequest("/journey/events?visit_id=" + encodeURIComponent(visitCode), {
        method: "POST",
        body: JSON.stringify({
          stage: "registration",
          status: "current",
          time_spent_seconds: 0,
        }),
      });
      const response = await apiRequest<JourneyResponse>(
        `/journey/${encodeURIComponent(visitCode)}`,
      );
      const currentStage =
        response.stages.find((stage) => stage.status === "current")?.stage ?? "";
      setJourney({
        ...response,
        next_step: currentStage
          ? t("journey.actionNext", {
              step: t(`journey.stages.${currentStage}`),
            })
          : t("common.humanHelp"),
      });
      setScreen("journey");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("errors.unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function readAloud(text: string) {
    if (!("speechSynthesis" in window)) {
      setError(t("errors.speechUnavailable"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(language);
    window.speechSynthesis.speak(utterance);
  }

  async function startScanDemo() {
    setRole("my_child");
    setAge("7");
    setSex("prefer_not_to_say");
    setComplaint(t("demo.complaint"));
    setDuration("1");
    setSeverity(3);
    setRedFlags([]);
    setMobilitySupport(false);
    setScreen("intake");
    setStep(3);
    await loadLocations();
    setNotice(t("demo.invented"));
  }

  async function waitForDemo(duration: number): Promise<boolean> {
    let waited = 0;
    while (waited < duration && !demoCancelledRef.current) {
      if (demoSkipRef.current) {
        demoSkipRef.current = false;
        return true;
      }
      if (demoPausedRef.current) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        continue;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      waited += 100;
    }
    return !demoCancelledRef.current;
  }

  async function runDemoJourney() {
    demoCancelledRef.current = false;
    demoPausedRef.current = false;
    demoSkipRef.current = false;
    setDemoRunning(true);
    setDemoScenarioActive(true);
    setDemoPaused(false);
    setError("");
    setNotice(t("demo.invented"));
    setRole("my_child");
    setAge("7");
    setSex("prefer_not_to_say");
    setComplaint(t("demo.complaint"));
    setDuration("today");
    setSeverity(3);
    setRedFlags([]);
    setMobilitySupport(false);
    setStep(0);
    setScreen("intake");
    setDemoCaption(t("demo.captionRole"));

    try {
      if (!(await waitForDemo(850))) return;
      setStep(1);
      setDemoCaption(t("demo.captionAge"));
      if (!(await waitForDemo(850))) return;
      setStep(2);
      setDemoCaption(t("demo.captionLanguage"));
      if (!(await waitForDemo(850))) return;
      setStep(3);
      setDemoCaption(`${t("demo.captionComplaint")} — ${t("demo.complaint")}`);
      if (!(await waitForDemo(1100))) return;

      const intake = await apiRequest<{ visit_id: string }>("/intake", {
        method: "POST",
        body: JSON.stringify({
          patient_age: 7,
          patient_sex: "prefer_not_to_say",
          patient_role: "my_child",
          complaint_text: t("demo.complaint"),
          language_code: language,
          duration: "today",
          severity: 3,
        }),
      });
      setVisitId(intake.visit_id);
      setDemoCaption(t("demo.captionRecommendation"));
      const result = await apiRequest<Record<string, unknown>>("/recommend", {
        method: "POST",
        body: JSON.stringify({
          patient_age: 7,
          patient_role: "my_child",
          complaint_text: t("demo.complaint"),
          language_code: language,
          starting_location: "entrance",
        }),
      });
      if (demoCancelledRef.current) return;
      const suggestions = (result.recommendations as Recommendation[]) ?? [];
      const nextDepartment = suggestions[0]?.department_code ?? "paediatrics";
      setRecommendation(result);
      setRecommendations(suggestions);
      setDestination(nextDepartment);
      setScreen("results");
      if (!(await waitForDemo(1400))) return;

      setDemoCaption(t("demo.captionDoctor"));
      await loadDoctors(nextDepartment);
      if (!(await waitForDemo(1400))) return;

      setDemoCaption(t("demo.captionRoute"));
      const demoRoute = await apiRequest<RouteResponse>(
        `/route?from=entrance&to=${encodeURIComponent(nextDepartment)}&language=${language}`,
      );
      if (demoCancelledRef.current) return;
      setRoute(demoRoute);
      setLandmark("entrance");
      setScreen("route");
      if (!(await waitForDemo(1500))) return;

      setDemoCaption(t("demo.captionJourney"));
      await startJourney(intake.visit_id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("errors.unexpected"),
      );
    } finally {
      setDemoRunning(false);
      setDemoPaused(false);
      demoPausedRef.current = false;
    }
  }

  async function startEmergencyDemo() {
    setDemoScenarioActive(false);
    const complaintText = t("demo.emergencyComplaint");
    const flags = ["breathing_trouble"];
    setRole("my_child");
    setAge("7");
    setSex("prefer_not_to_say");
    setComplaint(complaintText);
    setRedFlags(flags);
    setBusy(true);
    setError("");
    setNotice(t("demo.emergencyCaption"));
    try {
      const intake = await apiRequest<{ visit_id: string }>("/intake", {
        method: "POST",
        body: JSON.stringify({
          patient_age: 7,
          patient_sex: "prefer_not_to_say",
          patient_role: "my_child",
          complaint_text: complaintText,
          language_code: language,
          severity: 5,
          red_flags: flags,
        }),
      });
      setVisitId(intake.visit_id);
      const result = await apiRequest<Record<string, unknown>>("/recommend", {
        method: "POST",
        body: JSON.stringify({
          patient_age: 7,
          patient_role: "my_child",
          complaint_text: complaintText,
          language_code: language,
          red_flags: flags,
          starting_location: "entrance",
        }),
      });
      setRecommendation(result);
      setRecommendations((result.recommendations as Recommendation[]) ?? []);
      setDestination("child_emergency");
      setRoute((result.route as RouteResponse | undefined) ?? null);
      setScreen("results");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("errors.unexpected"),
      );
    } finally {
      setBusy(false);
    }
  }

  function renderQuestion() {
    if (currentIntakeStep === "role") {
      return (
        <div className="intake-choice-grid">
          {(["myself", "my_child", "my_relative"] as const).map((option) => (
            <button
              className={role === option ? "intake-choice selected" : "intake-choice"}
              type="button"
              key={option}
              onClick={() => setRole(option)}
              aria-pressed={role === option}
            >
              <span className="intake-choice-icon" aria-hidden="true">
                {option === "myself" ? "👤" : option === "my_child" ? "👨‍👦" : "👪"}
              </span>
              <span>{t(`intake.role.${option}`)}</span>
              <span className="choice-indicator" aria-hidden="true">
                {role === option ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      );
    }
    if (currentIntakeStep === "age") {
      return (
        <label className="field-label" htmlFor="patient-age">
          <span>{t("intake.ageLabel")}</span>
          <input
            id="patient-age"
            type="number"
            min="0"
            max="120"
            inputMode="numeric"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            placeholder={t("intake.agePlaceholder")}
          />
        </label>
      );
    }
    if (currentIntakeStep === "sex") {
      return (
        <div className="intake-choice-grid compact">
          {(["female", "male", "other", "prefer_not_to_say"] as const).map((option) => (
            <button
              className={sex === option ? "pill-choice selected" : "pill-choice"}
              type="button"
              key={option}
              onClick={() => setSex(option)}
              aria-pressed={sex === option}
            >
              {t(`intake.sex.${option}`)}
            </button>
          ))}
        </div>
      );
    }
    if (currentIntakeStep === "complaint") {
      return (
        <div className="complaint-entry">
          <div className="symptom-grid">
            {SYMPTOMS.map((symptom) => (
              <button
                className={
                  selectedSymptom === symptom.key
                    ? "symptom-chip selected"
                    : "symptom-chip"
                }
                type="button"
                key={symptom.key}
                onClick={() => selectSymptom(symptom.key)}
              >
                <span aria-hidden="true">{symptom.icon}</span>
                {t(`symptom.${symptom.key}`)}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="complaint">
            <span>{t("intake.complaintLabel")}</span>
            <div className="complaint-input-wrap">
              <input
                className="complaint-text-input"
                id="complaint"
                type="text"
                value={complaint}
                onChange={(event) => {
                  setComplaint(event.target.value);
                  setSelectedSymptom(null);
                }}
                placeholder={t("intake.complaintPlaceholder")}
                maxLength={1000}
                autoComplete="off"
                list="symptom-suggestions"
              />
              <datalist id="symptom-suggestions">
                {SYMPTOMS.map((symptom) => (
                  <option
                    key={symptom.key}
                    value={
                      symptom.key === "fever"
                        ? {
                            en:
                              role === "my_child" || Number(age) < 18
                                ? "my child has a fever"
                                : "adult fever",
                            ur:
                              role === "my_child" || Number(age) < 18
                                ? "بچے کو بخار"
                                : "بالغ کو بخار",
                            sd:
                              role === "my_child" || Number(age) < 18
                                ? "ٻار کي بخار"
                                : "وڏي ماڻهو کي بخار",
                          }[language]
                        : SYMPTOM_TERMS[symptom.key][language]
                    }
                  />
                ))}
              </datalist>
              {speechSupported && (
                <button
                  type="button"
                  className={listening ? "mic-button listening" : "mic-button"}
                  onClick={startVoiceInput}
                  aria-label={t(listening ? "intake.listening" : "intake.voiceInput")}
                >
                  {listening ? "◉" : "🎙"}
                </button>
              )}
            </div>
          </label>
        </div>
      );
    }
    if (currentIntakeStep === "redFlags") {
      return (
        <div className="red-flag-grid">
          {RED_FLAG_OPTIONS.map(([flag, label]) => {
            const selected = redFlags.includes(flag);
            return (
              <button
                type="button"
                className={selected ? "red-flag-option selected" : "red-flag-option"}
                key={flag}
                aria-pressed={selected}
                onClick={() => toggleFlag(flag)}
              >
                <span className="check-box" aria-hidden="true">{selected ? "✓" : ""}</span>
                {t(label)}
              </button>
            );
          })}
        </div>
      );
    }
    if (currentIntakeStep === "duration") {
      return (
        <div className="intake-choice-grid compact">
          {["today", "few_days", "week", "longer", "unsure"].map((option) => (
            <button
              className={duration === option ? "pill-choice selected" : "pill-choice"}
              type="button"
              key={option}
              onClick={() => setDuration(option)}
              aria-pressed={duration === option}
            >
              {t(`intake.duration.${option}`)}
            </button>
          ))}
        </div>
      );
    }
    if (currentIntakeStep === "pregnancy") {
      return (
        <div className="intake-choice-grid compact">
          {(["yes", "no", "unsure"] as const).map((option) => (
            <button
              className={
                pregnancyRelated === option ? "pill-choice selected" : "pill-choice"
              }
              type="button"
              key={option}
              onClick={() => setPregnancyRelated(option)}
              aria-pressed={pregnancyRelated === option}
            >
              {t(`intake.pregnancy.${option}`)}
            </button>
          ))}
        </div>
      );
    }
    if (currentIntakeStep === "severity") {
      return (
        <div className="severity-control">
          <div className="severity-range-labels">
            <span>{t("intake.severityLow")}</span>
            <strong>{severity} / 10</strong>
            <span>{t("intake.severityHigh")}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(event) => setSeverity(Number(event.target.value))}
            aria-label={t("intake.severityLabel")}
          />
          <p>{t("intake.severityDisclaimer")}</p>
        </div>
      );
    }
    return (
      <div className="mobility-toggle">
        <p>{t("intake.mobilityQuestion")}</p>
        <div className="intake-choice-grid compact">
          {[false, true].map((needsHelp) => (
            <button
              className={
                mobilitySupport === needsHelp ? "pill-choice selected" : "pill-choice"
              }
              type="button"
              key={String(needsHelp)}
              onClick={() => setMobilitySupport(needsHelp)}
              aria-pressed={mobilitySupport === needsHelp}
            >
              {t(needsHelp ? "intake.mobilityYes" : "intake.mobilityNo")}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderScreen() {
    if (screen === "welcome") {
      return (
        <div className="patient-welcome">
          <div className="patient-welcome-copy">
            <span className="patient-kicker">{t("patient.kicker")}</span>
            <h1>{t("patient.title")}</h1>
            <p>{t("patient.description")}</p>
            <div className="patient-welcome-actions">
              <button className="primary-button" type="button" onClick={() => beginIntake()}>
                {t("patient.start")}
                <span aria-hidden="true">{language === "en" ? "→" : "←"}</span>
              </button>
              <button className="secondary-button" type="button" onClick={startScanDemo}>
                {t("patient.scanDemo")}
              </button>
              <button className="secondary-button" type="button" onClick={() => void runDemoJourney()}>
                {t("demo.start")}
              </button>
              <button className="emergency-demo-button" type="button" onClick={() => void startEmergencyDemo()}>
                {t("demo.emergencyDemo")}
              </button>
            </div>
            <p className="demo-warning">{t("patient.demoDisclaimer")}</p>
          </div>
          <div className="welcome-symbol" aria-hidden="true">
            <span className="welcome-orbit orbit-one" />
            <span className="welcome-orbit orbit-two" />
            <span className="welcome-compass">✳</span>
            <span className="welcome-pin">●</span>
          </div>
        </div>
      );
    }

    if (screen === "intake") {
      const progress = ((step + 1) / intakeSteps.length) * 100;
      const title = t(`intake.question.${currentIntakeStep}`);
      const helper = t(`intake.helper.${currentIntakeStep}`);
      return (
        <div className="patient-panel intake-panel">
          <div className="panel-topline">
            <button
              type="button"
              className="back-button"
              onClick={() => {
                if (step === 0) setScreen("welcome");
                else setStep((current) => Math.max(0, current - 1));
              }}
            >
              <span aria-hidden="true">{language === "en" ? "←" : "→"}</span>
              {t("common.back")}
            </button>
            <span className="step-count">
              {t("intake.stepCount", { current: step + 1, total: intakeSteps.length })}
            </span>
          </div>
          <div
            className="intake-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={t("intake.progress")}
          >
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={motionTransition}
            />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="intake-question"
              key={currentIntakeStep}
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -15 }}
              transition={motionTransition}
            >
              <span className="patient-kicker">{t("intake.formKicker")}</span>
              <h1>{title}</h1>
              <p className="question-helper">{helper}</p>
              {renderQuestion()}
            </motion.div>
          </AnimatePresence>
          {currentIntakeStep === "redFlags" && (
            <div className="urgent-note">
              <span aria-hidden="true">!</span>
              <p>{t("intake.emergencyNote")}</p>
            </div>
          )}
          {error && <div className="error-message" role="alert">{error}</div>}
          {notice && <div className="info-message" role="status">{notice}</div>}
          <div className="form-actions">
            <button
              className="primary-button"
              type="button"
              disabled={!canAdvance() || busy}
              onClick={() => {
                if (step < intakeSteps.length - 1) {
                  setStep((current) => current + 1);
                  if ("vibrate" in navigator) navigator.vibrate?.(12);
                } else {
                  void submitIntake();
                }
              }}
            >
              {busy
                ? t("intake.analyzing")
                : step === intakeSteps.length - 1
                  ? t("intake.findDepartment")
                  : t("common.continue")}
              {!busy && <span aria-hidden="true">{language === "en" ? "→" : "←"}</span>}
            </button>
            <span className="human-link">{t("common.humanHelp")}</span>
          </div>
        </div>
      );
    }

    if (screen === "results") {
      const isEmergency = recommendation?.emergency === true;
      const humanFallback = recommendation?.ask_human === true;
      if (isEmergency) {
        return (
          <motion.div
            className="emergency-screen"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTransition}
            role="alert"
          >
            <div className="emergency-pulse" aria-hidden="true" />
            <span className="emergency-symbol" aria-hidden="true">!</span>
            <span className="patient-kicker">{t("results.emergencyLabel")}</span>
            <h1>{t("results.emergencyTitle")}</h1>
            <p>{t("results.emergencyHelp")}</p>
            {notice && <p className="emergency-demo-caption" role="status">{notice}</p>}
            <strong className="emergency-department">
              {t(`departments.${recommendations[0]?.department_code ?? "adult_emergency"}`)}
            </strong>
            <p className="medical-disclaimer">
              {t("results.emergencyDisclaimer")}
            </p>
            <p className="medical-disclaimer">
              {t("results.confidenceNotice")}
            </p>
            <div className="emergency-actions">
              <button
                className="emergency-button"
                type="button"
                disabled={busy}
                onClick={() => void loadRoute("entrance", destination)}
              >
                {t("results.emergencyDirections")} <span aria-hidden="true">➜</span>
              </button>
              <button
                className="emergency-read"
                type="button"
                onClick={() =>
                  void readAloud(
                    `${t("results.emergencyHelp")} ${t(`departments.${recommendations[0]?.department_code ?? "adult_emergency"}`)}`,
                  )
                }
              >
                {t("common.readAloud")}
              </button>
              <span>{t("common.humanHelp")}</span>
            </div>
          </motion.div>
        );
      }
      return (
        <div className="patient-panel results-panel">
          <div className="screen-title">
            <span className="patient-kicker">{t("results.kicker")}</span>
            <h1>{t("results.title")}</h1>
            <p>{t("results.helper")}</p>
          </div>
          {analyzing && (
            <div className="thinking-message" role="status">
              <span className="thinking-dots"><i /><i /><i /></span>
              {t("results.thinking")}
            </div>
          )}
          <div className="recommendation-list">
            {recommendations.map((item, index) => (
              <motion.article
                className={index === 0 ? "recommendation-card featured" : "recommendation-card"}
                key={item.department_code}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...motionTransition, delay: index * 0.08 }}
              >
                <div className="recommendation-heading">
                  <span className="recommendation-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>{item.department}</h2>
                    <p>{item.reason}</p>
                  </div>
                  <strong>{item.confidence}%</strong>
                </div>
                <div
                  className="confidence-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.confidence}
                  aria-label={t("results.confidence")}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ ...motionTransition, delay: 0.12 + index * 0.08 }}
                  />
                </div>
                <div className="recommendation-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      setExpandedWhy((current) =>
                        current === item.department_code ? null : item.department_code,
                      )
                    }
                    aria-expanded={expandedWhy === item.department_code}
                  >
                    {t(expandedWhy === item.department_code ? "results.hideWhy" : "results.why")}
                  </button>
                  <button
                    className="small-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => void loadDoctors(item.department_code)}
                  >
                    {t("results.choose")}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {expandedWhy === item.department_code && (
                    <motion.p
                      className="expanded-explanation"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={motionTransition}
                    >
                      {item.why}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
          {humanFallback && <div className="human-fallback" role="status">{t("common.humanHelp")}</div>}
          <div className="disclaimer-card">
            <span aria-hidden="true">ⓘ</span>
            <p>
              {String(recommendation?.disclaimer ?? t("results.disclaimer"))}{" "}
              {String(recommendation?.confidence_notice ?? "")}{" "}
              {String(recommendation?.model_notice ?? "")}
            </p>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
        </div>
      );
    }

    if (screen === "doctors") {
      return (
        <div className="patient-panel">
          <div className="panel-topline">
            <button className="back-button" type="button" onClick={() => setScreen("results")}>
              <span aria-hidden="true">{language === "en" ? "←" : "→"}</span>
              {t("common.back")}
            </button>
            <span className="fictional-label">{t("doctors.fictional")}</span>
          </div>
          <div className="screen-title">
            <span className="patient-kicker">{t("doctors.kicker")}</span>
            <h1>{t("doctors.title")}</h1>
            <p>{t("doctors.helper")}</p>
          </div>
          <label className="doctor-preference" htmlFor="doctor-gender-preference">
            <span>{t("doctors.genderPreference")}</span>
            <select
              id="doctor-gender-preference"
              value={doctorGenderPreference}
              onChange={(event) => {
                const preference = event.target.value;
                if (
                  preference === "" ||
                  preference === "female" ||
                  preference === "male"
                ) {
                  void loadDoctors(destination, preference);
                }
              }}
            >
              <option value="">{t("doctors.anyGender")}</option>
              <option value="female">{t("doctors.gender.female")}</option>
              <option value="male">{t("doctors.gender.male")}</option>
            </select>
          </label>
          <div className="doctor-list">
            {doctors.map((doctor, index) => (
              <motion.article
                className="doctor-card"
                key={doctor.id}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...motionTransition, delay: index * 0.06 }}
              >
                <div className="doctor-avatar" aria-hidden="true">
                  {doctor.name.slice(-2)}
                </div>
                <div className="doctor-main">
                  <div className="doctor-title-row">
                    <h2>{doctor.name}</h2>
                    {index === 0 && <span className="soonest-badge">{t("doctors.bestFit")}</span>}
                    <span className="fit-score">{doctor.fit_score}%</span>
                  </div>
                  <p>{doctor[`specialty_${language}`]}</p>
                  <span className="doctor-meta">
                    {t(`doctors.gender.${doctor.gender}`)} ·{" "}
                    {doctor.languages
                      .map((spokenLanguage) =>
                        t(
                          `language.${
                            spokenLanguage === "English"
                              ? "english"
                              : spokenLanguage === "Urdu"
                                ? "urdu"
                                : "sindhi"
                          }`,
                        ),
                      )
                      .join(" · ")}
                  </span>
                  <div className="doctor-match-reasons">
                    {(["specialty", "language", "gender", "availability"] as const).map(
                      (fitDimension) => (
                        <span key={fitDimension}>
                          <strong>{t(`doctors.fit.${fitDimension}`)}:</strong>{" "}
                          {t(
                            `doctors.fit.${
                              doctor.fit_reasons[fitDimension] ===
                              "matches_requested_department"
                                ? "specialtyMatch"
                                : doctor.fit_reasons[fitDimension] ===
                                    "no_preference_match"
                                  ? "noMatch"
                                  : doctor.fit_reasons[fitDimension] ===
                                      "no_upcoming_demo_slots"
                                    ? "noAvailability"
                                    : "match"
                            }`,
                          )}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="slot-list">
                    {doctor.next_slots.slice(0, 3).map((slot, slotIndex) => (
                      <button
                        className={[
                          "slot-chip",
                          slotIndex === 0 ? "soonest" : "",
                          selectedSlot === `${doctor.id}:${slot.starts_at}` ? "chosen" : "",
                        ].filter(Boolean).join(" ")}
                        type="button"
                        key={slot.starts_at}
                        onClick={() => setSelectedSlot(`${doctor.id}:${slot.starts_at}`)}
                        aria-pressed={selectedSlot === `${doctor.id}:${slot.starts_at}`}
                      >
                        {formatSlot(slot.starts_at, language)}
                      </button>
                    ))}
                    {doctor.next_slots.length === 0 && (
                      <span className="empty-slots">{t("doctors.noSlots")}</span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          {doctors.length === 0 && (
            <div className="human-fallback">{t("doctors.noDoctors")}</div>
          )}
          <p className="data-notice">{t("doctors.scheduleNotice")}</p>
          <div className="form-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void loadRoute()}
              disabled={busy}
            >
              {t("doctors.showRoute")} <span aria-hidden="true">→</span>
            </button>
            <span className="human-link">{t("common.humanHelp")}</span>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
        </div>
      );
    }

    if (screen === "route") {
      return (
        <div className="patient-panel wayfinding-panel">
          <div className="panel-topline">
            <button className="back-button" type="button" onClick={() => setScreen("doctors")}>
              <span aria-hidden="true">{language === "en" ? "←" : "→"}</span>
              {t("common.back")}
            </button>
            <span className="fictional-label">{t("wayfinding.fictionalMap")}</span>
          </div>
          <div className="screen-title">
            <span className="patient-kicker">{t("wayfinding.kicker")}</span>
            <h1>{t("wayfinding.title")}</h1>
            <p>{t("wayfinding.helper", { minutes: route?.estimated_walking_minutes ?? 1 })}</p>
          </div>
          <div className="route-map" aria-label={t("wayfinding.mapLabel")}>
            <svg viewBox="0 0 500 124" role="img" aria-label={t("wayfinding.routeGraphic")}>
              <path className="map-line-bg" d="M28 84 C95 84 105 34 174 34 S260 92 322 68 S405 40 472 40" />
              <motion.path
                className="map-line"
                d="M28 84 C95 84 105 34 174 34 S260 92 322 68 S405 40 472 40"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: "easeInOut" }}
              />
              <motion.circle
                className="you-are-here-dot"
                r="8"
                initial={{ cx: 28, cy: 84 }}
                animate={{ cx: 174, cy: 34 }}
                transition={{ duration: prefersReducedMotion ? 0 : 1.8, ease: "easeInOut" }}
              />
              <circle className="map-destination" cx="472" cy="40" r="8" />
              <text x="22" y="115" className="map-label">{t("wayfinding.start")}</text>
              <text x="417" y="22" className="map-label">{t("wayfinding.destination")}</text>
              {(route?.locations ?? []).slice(1, -1).map((point, index) => {
                const x = 90 + (index * 360) / Math.max(1, route!.locations.length - 2);
                return (
                  <g key={`${point.code}-${index}`} className="map-landmark">
                    <circle cx={x} cy={66 - (index % 2) * 22} r="4" />
                  </g>
                );
              })}
            </svg>
            <span className="floor-indicator">
              {t("wayfinding.floor", { floor: (route?.locations.at(-1)?.floor ?? 0) + 1 })}
            </span>
          </div>
          {route?.accessible && (
            <div className="accessible-notice">{t("wayfinding.accessibleRoute")}</div>
          )}
          {notice && <div className="info-message" role="status">{notice}</div>}
          <ol className="direction-list">
            {route?.steps.map((direction, index) => (
              <motion.li
                key={`${direction.from}-${direction.to}-${index}`}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...motionTransition, delay: index * 0.08 }}
              >
                <span className="direction-number">{index + 1}</span>
                <div>
                  <strong>{direction.landmark}</strong>
                  <small>{t("wayfinding.directionTo", { place: direction.to })}</small>
                </div>
                <span className="direction-floor">{t("wayfinding.floor", { floor: direction.floor + 1 })}</span>
              </motion.li>
            ))}
          </ol>
          <div className="route-buttons">
            <button className="secondary-button" type="button" onClick={() => void readAloud(route?.steps.map((stepItem) => stepItem.landmark).join(". ") ?? "")}>
              {t("common.readAloud")}
            </button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => void loadLocations()}>
              {t("wayfinding.imLost")}
            </button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => void showWaitingAreas()}>
              {t("wayfinding.whereWait")}
            </button>
          </div>
          {locations.length > 0 && (
            <div className="reroute-control">
              <label className="field-label" htmlFor="nearest-landmark">
                <span>{t("wayfinding.nearestLandmark")}</span>
                <select
                  id="nearest-landmark"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                >
                  {locations.map((location) => (
                    <option key={location.code} value={location.code}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="small-primary" type="button" disabled={busy} onClick={() => void recalculateRoute()}>
                {t("wayfinding.recalculate")}
              </button>
            </div>
          )}
          <div className="route-footer-actions">
            <button className="primary-button" type="button" disabled={busy} onClick={() => void startJourney()}>
              {t("wayfinding.startJourney")} <span aria-hidden="true">→</span>
            </button>
            <button className="text-button" type="button" onClick={() => void readAloud(t("wayfinding.directionsHelp"))}>
              {t("common.humanHelp")}
            </button>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
        </div>
      );
    }

    return (
      <div className="patient-panel journey-panel">
        <div className="panel-topline">
          <button className="back-button" type="button" onClick={() => setScreen("route")}>
            <span aria-hidden="true">{language === "en" ? "←" : "→"}</span>
            {t("common.back")}
          </button>
          <span className="fictional-label">{t("journey.fictional")}</span>
        </div>
        <div className="screen-title">
          <span className="patient-kicker">{t("journey.kicker")}</span>
          <h1>{t("journey.title")}</h1>
          <p>{t("journey.helper")}</p>
        </div>
        <div className="next-step-card">
          <span className="next-step-icon" aria-hidden="true">↗</span>
          <div>
            <span className="patient-kicker">{t("journey.nextStep")}</span>
            <p>{journey?.next_step ?? t("common.humanHelp")}</p>
          </div>
        </div>
        <ol className="journey-timeline">
          {journey?.stages.map((stage, index) => (
            <li className={`journey-stage ${stage.status}`} key={stage.stage}>
              <span className="journey-marker" aria-hidden="true">
                {stage.status === "done" ? "✓" : String(index + 1)}
              </span>
              <div>
                <strong>{t(`journey.stages.${stage.stage}`)}</strong>
                <small>{t(`journey.status.${stage.status}`)}</small>
              </div>
              {stage.time_spent_seconds !== null && (
                <span className="journey-time">
                  {t("journey.minutes", {
                    minutes: Math.ceil(stage.time_spent_seconds / 60),
                  })}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="disclaimer-card">{t("journey.disclaimer")}</p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setScreen("welcome");
            setJourney(null);
            setVisitId("");
            setDemoScenarioActive(false);
          }}
        >
          {t("journey.reset")}
        </button>
        {error && <div className="error-message" role="alert">{error}</div>}
      </div>
    );
  }

  const painLabelKey: Record<
    "welcome" | "intake" | "results" | "doctors" | "route" | "journey",
    string
  > = {
    welcome: "painPoints.welcome",
    intake: "painPoints.intake",
    results: "painPoints.results",
    doctors: "painPoints.doctors",
    route: "painPoints.route",
    journey: "painPoints.journey",
  };

  return (
    <div className="patient-flow">
      {busy && (
        <motion.div
          className="patient-loading-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 0.72, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          aria-label={t("common.loading")}
        />
      )}
      <div className="patient-flow-topline">
        <span className="patient-flow-brand">
          <span className="mini-plus" aria-hidden="true">+</span>
          {t("app.brand")}
        </span>
        <span className="patient-flow-disclaimer">{t("patient.nonMedical")}</span>
      </div>
      {demoRunning && (
        <div className="demo-narration" aria-live="polite">
          <div>
            <span>{t("demo.caption")}</span>
            <p>{demoCaption}</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              const nextPaused = !demoPausedRef.current;
              demoPausedRef.current = nextPaused;
              setDemoPaused(nextPaused);
            }}
          >
            {demoPaused ? t("demo.resume") : t("demo.pause")}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              demoSkipRef.current = true;
            }}
          >
            {t("demo.skip")}
          </button>
        </div>
      )}
      {demoScenarioActive && (
        <p className="demo-scenario-tag" role="note">
          {t("demo.invented")}
        </p>
      )}
      {showPainLabels && !painLabelDismissed && (
        <div className="pain-point-tag">
          <span>{t(painLabelKey[screen])}</span>
          <button
            type="button"
            aria-label={t("settings.dismissPainLabel")}
            onClick={() => setPainLabelDismissed(true)}
          >
            ×
          </button>
        </div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          className="patient-screen"
          key={screen}
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : language === "en" ? 22 : -22 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: prefersReducedMotion ? 0 : language === "en" ? -16 : 16 }}
          transition={motionTransition}
        >
          {renderScreen()}
        </motion.section>
      </AnimatePresence>
      <p className="patient-disclaimer" role="note">{t("patient.footerDisclaimer")}</p>
    </div>
  );
}

export default PatientFlow;

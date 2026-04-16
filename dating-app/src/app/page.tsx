"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  age: number;
  city: string;
  school_name: string;
  grade: string;
  gender: string;
  pronouns: string;
  interested_in: string;
  height_cm: number;
  religion: string | null;
  zodiac: string | null;
  dating_intention: string;
  prompt_title: string;
  prompt_answer: string;
  hobbies: string[];
  avatar_url: string | null;
};

type Like = { from_user: string; to_user: string };
type Message = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string };
type PhotoState = { cover: string | null; gallery: Array<string | null> };
type InviteNotice = { id: string; type: "accepted" | "rejected"; profileId: string; createdAt: string };
type EncodedMediaMessage = {
  type: "image" | "audio" | "file";
  name: string;
  dataUrl: string;
  mimeType: string;
  durationSeconds?: number;
};
type AppTab = "home" | "profile" | "messages";
type OnboardingStepKey =
  | "mode"
  | "full_name"
  | "auth"
  | "age"
  | "height_cm"
  | "gender"
  | "pronouns"
  | "interested_in"
  | "photos"
  | "hobbies"
  | "religion"
  | "zodiac"
  | "grade"
  | "school_name"
  | "dating_intention"
  | "prompt";

const supabase = getSupabaseBrowserClient();
const liveReady = hasSupabaseEnv();

const baseProfile: Omit<Profile, "id"> = {
  full_name: "",
  age: 16,
  city: "",
  school_name: "",
  grade: "Grade 10",
  gender: "Male",
  pronouns: "He/Him",
  interested_in: "Female",
  height_cm: 170,
  religion: "Hindu",
  zodiac: "",
  dating_intention: "Long term relationship",
  prompt_title: "My perfect day includes",
  prompt_answer: "",
  hobbies: ["Gaming"],
  avatar_url: null,
};

const demoProfiles: Profile[] = [
  { id: "demo-1", ...baseProfile, full_name: "Shreya", city: "Indore", school_name: "St. Paul School", age: 16, gender: "Female", pronouns: "She/Her", interested_in: "Male", height_cm: 165, hobbies: ["Art & Design", "Avid Reader"], prompt_title: "My goal in life is", prompt_answer: "To become a designer and still make time for fun people." },
  { id: "demo-2", ...baseProfile, full_name: "Pari", city: "Indore", school_name: "Emerald Heights", age: 17, grade: "Grade 11", gender: "Female", pronouns: "She/Her", interested_in: "Male", height_cm: 168, religion: "Christian", zodiac: "Pisces", dating_intention: "Short term, open to long", hobbies: ["Bingewatching", "Football"], prompt_title: "My greatest strength", prompt_answer: "I can turn awkward silence into a fun conversation quickly." },
  { id: "demo-3", ...baseProfile, full_name: "Diya", city: "Indore", school_name: "St. Marys", age: 15, grade: "Grade 9", gender: "Female", pronouns: "She/Her", interested_in: "Male", height_cm: 160, religion: "Muslim", zodiac: "Cancer", dating_intention: "Figuring it out", hobbies: ["Otaku", "Gaming"], prompt_title: "What I order on the table", prompt_answer: "Fries first, then anything sweet." },
];

const gradeChoices = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const genderChoices = ["Male", "Female", "Gay", "Lesbian"];
const pronounChoices = ["He/Him", "She/Her", "They/Them", "Vir/Vis"];
const hobbyChoices = ["Gaming", "Football", "Basketball", "Avid Reader", "Art & Design", "Bingewatching", "Otaku"];
const religionChoices = ["Hindu", "Muslim", "Christian", "Sikh", "Atheist"];
const intentionChoices = ["Long term relationship", "Short term relationship", "Short term, open to long", "Figuring it out"];
const promptChoices = ["My perfect day includes", "My goal in life is", "My greatest strength", "What I order on the table"];
const APP_NAME = "Amis";
const FEEDBACK_FORM_URL = "https://forms.gle/Nzw2rj29PaQ2ynXC7";
const ONBOARDING_DRAFT_KEY = "amis-onboarding-draft";
const MEDIA_MESSAGE_PREFIX = "__amis_media__:";
const INVITE_NOTICE_KEY_PREFIX = "amis-invite-notices";

const onboardingSteps: Array<{ key: OnboardingStepKey; title: string; subtitle: string }> = [
  { key: "mode", title: "Select Your Preferable version of App", subtitle: "Please select out of the following two" },
  { key: "full_name", title: "What is Your Name?", subtitle: "Please enter your name" },
  { key: "auth", title: "Enter the Info?", subtitle: "Please enter your email or number" },
  { key: "age", title: "What is Your Age?", subtitle: "Please select your age" },
  { key: "height_cm", title: "What is Your Height?", subtitle: "Feet and centimeters stay synced" },
  { key: "gender", title: "What is Your Sexuality?", subtitle: "Please select your gender" },
  { key: "pronouns", title: "What is Your Pronouns", subtitle: "Please select your pronouns" },
  { key: "interested_in", title: "Your Interest is in?", subtitle: "Please select the gender you're interested in" },
  { key: "photos", title: "Upload Your Photos", subtitle: "Pick one cover image and up to three extra photos" },
  { key: "hobbies", title: "What are your hobbies?", subtitle: "Please select up to two hobbies" },
  { key: "religion", title: "What is Your Religion?", subtitle: "Please select your religious belief" },
  { key: "zodiac", title: "What is Your Sign?", subtitle: "Please enter your zodiac sign" },
  { key: "grade", title: "What Grade are You studying in?", subtitle: "Please select your grade" },
  { key: "school_name", title: "What is Your School Name?", subtitle: "Please enter your school name" },
  { key: "dating_intention", title: "What is Your Preferable Dating Intentions?", subtitle: "Please select your preference" },
  { key: "prompt", title: "Your Prompt?", subtitle: "Please enter the prompt about you to display with your image" },
];
const authStepIndex = onboardingSteps.findIndex((step) => step.key === "auth");

function scoreProfile(me: Profile, candidate: Profile) {
  const allowedGenders = getAllowedRecommendationGenders(me);
  if (!allowedGenders.has(normalize(candidate.gender))) return { score: 0, reasons: ["Outside current recommendation mix"] };
  let score = 40;
  const reasons = ["Inside your current gender mix"];
  if (normalize(me.city) === normalize(candidate.city)) { score += 15; reasons.push("Same city"); }
  if (normalize(me.school_name) === normalize(candidate.school_name)) { score += 18; reasons.push("Same school"); }
  const shared = candidate.hobbies.filter((item) => me.hobbies.includes(item)).length;
  if (shared) { score += shared * 12; reasons.push(`${shared} shared hobbies`); }
  if (normalize(me.dating_intention) === normalize(candidate.dating_intention)) { score += 10; reasons.push("Same dating intention"); }
  return { score, reasons };
}

function getAllowedRecommendationGenders(profile: Profile) {
  const selected = parseInterestedIn(profile.interested_in);
  return selected.size ? selected : new Set(["male", "female", "gay", "lesbian"]);
}

function parseInterestedIn(value: string) {
  return new Set(
    value
      .split(",")
      .map((item) => normalize(item))
      .filter(Boolean),
  );
}

function serializeInterestedIn(values: string[]) {
  return values.join(", ");
}

function encodeMediaMessage(payload: EncodedMediaMessage) {
  return `${MEDIA_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

function decodeMediaMessage(content: string): EncodedMediaMessage | null {
  if (!content.startsWith(MEDIA_MESSAGE_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(MEDIA_MESSAGE_PREFIX.length)) as EncodedMediaMessage;
  } catch {
    return null;
  }
}

function appendInviteNoticeForUser(userId: string, notice: InviteNotice) {
  if (typeof window === "undefined") return;
  const key = `${INVITE_NOTICE_KEY_PREFIX}:${userId}`;
  const raw = window.localStorage.getItem(key);
  let previous: InviteNotice[] = [];
  if (raw) {
    try {
      previous = JSON.parse(raw) as InviteNotice[];
    } catch {
      previous = [];
    }
  }
  window.localStorage.setItem(key, JSON.stringify([notice, ...previous]));
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState("Set up Supabase or use demo mode to explore the app.");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [useDemoMode, setUseDemoMode] = useState(!liveReady);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState<"Dating" | "Friends">("Dating");
  const [profileForm, setProfileForm] = useState(baseProfile);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likesSent, setLikesSent] = useState<Like[]>([]);
  const [likesReceived, setLikesReceived] = useState<Like[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [savedForLater, setSavedForLater] = useState<string[]>([]);
  const [passedProfileIds, setPassedProfileIds] = useState<string[]>([]);
  const [declinedIncomingInviteIds, setDeclinedIncomingInviteIds] = useState<string[]>([]);
  const [inviteNotices, setInviteNotices] = useState<InviteNotice[]>([]);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showFriendsConstruction, setShowFriendsConstruction] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [photoState, setPhotoState] = useState<PhotoState>({ cover: null, gallery: [null, null, null] });
  const [editingStepKey, setEditingStepKey] = useState<OnboardingStepKey | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as {
        authEmail?: string;
        authPassword?: string;
        mode?: "Dating" | "Friends";
        photoState?: PhotoState;
        profileForm?: Omit<Profile, "id">;
        stepIndex?: number;
      };
      if (draft.authEmail) setAuthEmail(draft.authEmail);
      if (draft.authPassword) setAuthPassword(draft.authPassword);
      if (draft.mode) setMode(draft.mode);
      if (draft.photoState) setPhotoState(draft.photoState);
      if (draft.profileForm) setProfileForm((previous) => ({ ...previous, ...draft.profileForm }));
      if (typeof draft.stepIndex === "number") setStepIndex(draft.stepIndex);
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
      authEmail,
      authPassword,
      mode,
      photoState,
      profileForm,
      stepIndex,
    }));
  }, [authEmail, authPassword, mode, photoState, profileForm, stepIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentProfile?.id) return;
    const key = `${INVITE_NOTICE_KEY_PREFIX}:${currentProfile.id}`;
    window.localStorage.setItem(key, JSON.stringify(inviteNotices));
  }, [currentProfile?.id, inviteNotices]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentProfile?.id) return;
    const key = `${INVITE_NOTICE_KEY_PREFIX}:${currentProfile.id}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setInviteNotices([]);
      return;
    }
    try {
      setInviteNotices(JSON.parse(raw) as InviteNotice[]);
    } catch {
      setInviteNotices([]);
    }
  }, [currentProfile?.id]);

  const enterDemoMode = useCallback(() => {
    const me: Profile = {
      id: "me-demo",
      ...baseProfile,
      full_name: profileForm.full_name || "Aoresta",
      city: profileForm.city || "Indore",
      school_name: profileForm.school_name || "Your School",
      prompt_answer: profileForm.prompt_answer || "Sitting all day grinding in a video game",
      hobbies: profileForm.hobbies,
      avatar_url: profileForm.avatar_url ?? photoState.cover,
    };
    setUseDemoMode(true);
    setCurrentProfile(me);
    setProfiles(demoProfiles);
    setLikesSent([{ from_user: "me-demo", to_user: "demo-1" }]);
    setLikesReceived([{ from_user: "demo-1", to_user: "me-demo" }]);
    setMessages([
      { id: "m1", sender_id: "me-demo", receiver_id: "demo-1", content: "Hey, your prompt is nice.", created_at: new Date().toISOString() },
      { id: "m2", sender_id: "demo-1", receiver_id: "me-demo", content: "Thank you. Yours is fun too.", created_at: new Date().toISOString() },
    ]);
    setChatTargetId("demo-1");
    setStatus("Demo mode is active. Supabase is not required to explore the UI.");
  }, [photoState.cover, profileForm]);

  const loadLiveData = useCallback(async (userId: string) => {
    if (!supabase) return;
    const [{ data: mine }, { data: others }, { data: sent }, { data: received }, { data: msgs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("*").neq("id", userId),
      supabase.from("likes").select("from_user,to_user").eq("from_user", userId),
      supabase.from("likes").select("from_user,to_user").eq("to_user", userId),
      supabase.from("messages").select("*").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: true }),
    ]);
    if (mine) {
      setUseDemoMode(false);
      setCurrentProfile(mine as Profile);
      const { id, ...rest } = mine as Profile;
      void id;
      setProfileForm(rest);
      setPhotoState({
        cover: rest.avatar_url ?? null,
        gallery: [rest.avatar_url ?? null, null, null],
      });
      setStepIndex(onboardingSteps.length);
      if (typeof window !== "undefined") window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } else {
      setUseDemoMode(false);
      setCurrentProfile(null);
      setStepIndex((previous) => Math.max(previous, authStepIndex + 1));
      setStatus("Logged in successfully. Continue your profile setup.");
    }
    setProfiles((others as Profile[]) ?? []);
    setLikesSent((sent as Like[]) ?? []);
    setLikesReceived((received as Like[]) ?? []);
    setMessages((msgs as Message[]) ?? []);
    setChatTargetId((previous) => {
      const available = ((others as Profile[]) ?? []).map((profile) => profile.id);
      if (previous && available.includes(previous)) return previous;
      return available[0] ?? null;
    });
    if (mine) setStatus("Live data loaded from Supabase.");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!liveReady) {
      const timer = window.setTimeout(() => enterDemoMode(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [enterDemoMode]);

  useEffect(() => {
    if (!useDemoMode && session?.user.id) {
      const timer = window.setTimeout(() => { void loadLiveData(session.user.id); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadLiveData, session, useDemoMode]);

  useEffect(() => {
    if (!supabase || useDemoMode || !session?.user.id) return;
    const userId = session.user.id;
    const channel = supabase
      .channel(`amis-live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = (payload.new || payload.old) as Partial<Message>;
        if (row.sender_id === userId || row.receiver_id === userId) {
          void loadLiveData(userId);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, (payload) => {
        const row = (payload.new || payload.old) as Partial<Like>;
        if (row.from_user === userId || row.to_user === userId) {
          void loadLiveData(userId);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadLiveData, session?.user.id, useDemoMode]);

  useEffect(() => {
    if (!session?.user.id || useDemoMode) return;
    const timer = window.setInterval(() => {
      void loadLiveData(session.user.id);
    }, activeTab === "messages" ? 1200 : 3000);
    return () => window.clearInterval(timer);
  }, [activeTab, loadLiveData, session?.user.id, useDemoMode]);

  useEffect(() => () => {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== "inactive") {
      voiceRecorderRef.current.stop();
    }
  }, []);

  const recommendations = useMemo(() => {
    if (!currentProfile) return [];
    const hiddenIds = new Set([
      currentProfile.id,
      ...likesSent.map((item) => item.to_user),
      ...savedForLater,
      ...passedProfileIds,
    ]);
    return profiles
      .filter((profile) => !hiddenIds.has(profile.id))
      .map((profile) => ({ profile, ...scoreProfile(currentProfile, profile) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [currentProfile, likesSent, passedProfileIds, profiles, savedForLater]);

  const matches = useMemo(() => {
    const sent = new Set(likesSent.map((item) => item.to_user));
    const received = new Set(likesReceived.map((item) => item.from_user));
    return profiles.filter((profile) => sent.has(profile.id) && received.has(profile.id));
  }, [likesReceived, likesSent, profiles]);

  const pendingIncomingInvites = useMemo(() => {
    const sent = new Set(likesSent.map((item) => item.to_user));
    return profiles.filter((profile) => {
      const incoming = likesReceived.some((item) => item.from_user === profile.id);
      return incoming && !sent.has(profile.id) && !declinedIncomingInviteIds.includes(profile.id);
    });
  }, [declinedIncomingInviteIds, likesReceived, likesSent, profiles]);

  const pendingOutgoingInvites = useMemo(() => {
    const received = new Set(likesReceived.map((item) => item.from_user));
    return profiles.filter((profile) => likesSent.some((item) => item.to_user === profile.id) && !received.has(profile.id));
  }, [likesReceived, likesSent, profiles]);

  const chatPartners = useMemo(() => matches, [matches]);
  const selectedPartner = chatPartners.find((item) => item.id === chatTargetId) ?? chatPartners[0] ?? null;
  const visibleMessages = messages.filter((message) => {
    if (!currentProfile || !selectedPartner) return false;
    return (message.sender_id === currentProfile.id && message.receiver_id === selectedPartner.id) || (message.sender_id === selectedPartner.id && message.receiver_id === currentProfile.id);
  });
  const unreadInviteNoticeCount = pendingIncomingInvites.length + inviteNotices.length;

  async function requestMagicLink() {
    if (!supabase || !authEmail) return;
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail, options: { emailRedirectTo: redirectTo } });
    if (!error) {
      setStatus("Magic link sent. Open your email and come back to this page.");
      return;
    }

    const lower = error.message.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("security purposes") || lower.includes("email address")) {
      setStatus("Login email limit reached. For public launch, connect custom SMTP in Supabase Auth so your users can receive login links at scale.");
      return;
    }

    setStatus(error.message);
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setStatus(error.message);
    }
  }

  async function loginWithPassword() {
    if (!supabase || !authPassword) return;
    if (session?.user.id) {
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) {
        setStatus(error.message);
        return;
      }
      setStatus("Password saved. You can now log out and log back in with this password later.");
      setStepIndex((previous) => Math.max(previous, authStepIndex + 1));
      return;
    }
    if (!authEmail) return;
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (!error) {
      setUseDemoMode(false);
      setStatus("Logged in successfully. Tap the continue button below.");
      setStepIndex((previous) => Math.max(previous, authStepIndex + 1));
      return;
    }

    const lower = error.message.toLowerCase();
    if (!lower.includes("invalid login credentials")) {
      setStatus(error.message);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (!signUpError) {
      setUseDemoMode(false);
      setSession(signUpData.session ?? null);
      setStatus(signUpData.session
        ? "Account created and logged in. Tap continue below."
        : "Account created. If Supabase asks for email confirmation, finish that once and then come back.");
      setStepIndex((previous) => Math.max(previous, authStepIndex + 1));
      return;
    }

    if (signUpError.message.toLowerCase().includes("already registered")) {
      setStatus("This email already exists, but that password isn't working yet. Use Google or a login link once, then save a fresh password here.");
      return;
    }

    setStatus(signUpError.message);
  }

  async function saveProfile() {
    const isFirstProfileSave = !currentProfile;
    if (useDemoMode) {
      enterDemoMode();
      setStepIndex(onboardingSteps.length);
      return;
    }
    if (!supabase || !session?.user.id) {
      setStatus("Sign in first so Amis can save your profile. Complete login, then tap continue again.");
      setStepIndex(authStepIndex);
      return;
    }
    const { error, data } = await supabase.from("profiles").upsert({ id: session.user.id, ...profileForm }).select().single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setCurrentProfile(data as Profile);
    setStatus("Profile saved to Supabase.");
    setStepIndex(onboardingSteps.length);
    if (isFirstProfileSave) {
      void fetch("/api/review-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.full_name,
          age: data.age,
          school_name: data.school_name,
          grade: data.grade,
          religion: data.religion,
          height_cm: data.height_cm,
          avatar_url: data.avatar_url,
          email: session.user.email ?? authEmail,
        }),
      });
    }
    await loadLiveData(session.user.id);
  }

  function beginEdit(stepKey: OnboardingStepKey) {
    const nextIndex = onboardingSteps.findIndex((step) => step.key === stepKey);
    if (nextIndex === -1) return;
    setEditingStepKey(stepKey);
    setStepIndex(nextIndex);
    setActiveTab("profile");
  }

  async function saveEditedStep() {
    await saveProfile();
    setEditingStepKey(null);
    setActiveTab("profile");
  }

  async function logoutAndStartOver() {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== "inactive") {
      voiceRecorderRef.current.stop();
    }
    if (supabase && !useDemoMode) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentProfile(null);
    setProfiles([]);
    setLikesSent([]);
    setLikesReceived([]);
    setMessages([]);
    setChatTargetId(null);
    setMessageDraft("");
    setSavedForLater([]);
    setPassedProfileIds([]);
    setDeclinedIncomingInviteIds([]);
    setInviteNotices([]);
    setShowInvitePanel(false);
    setShowFriendsConstruction(false);
    setIsRecordingVoice(false);
    setPhotoState({ cover: null, gallery: [null, null, null] });
    setProfileForm(baseProfile);
    setAuthEmail("");
    setAuthPassword("");
    setEditingStepKey(null);
    setUseDemoMode(!liveReady);
    setActiveTab("home");
    setStepIndex(0);
    setStatus("You have been logged out. Start again whenever you're ready.");
    if (typeof window !== "undefined") window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  }

  async function likeProfile(targetId: string) {
    if (!currentProfile) {
      setStatus("No profile saved yet.");
      return;
    }
    if (targetId === currentProfile.id) {
      setStatus("You can't like your own profile.");
      return;
    }
    const isAcceptingIncomingInvite = likesReceived.some((item) => item.from_user === targetId);
    if (useDemoMode) {
      setLikesSent((previous) => [...previous.filter((item) => item.to_user !== targetId), { from_user: currentProfile.id, to_user: targetId }]);
      if (isAcceptingIncomingInvite) {
        appendInviteNoticeForUser(targetId, {
          id: crypto.randomUUID(),
          type: "accepted",
          profileId: currentProfile.id,
          createdAt: new Date().toISOString(),
        });
      }
      setStatus("Invite sent.");
      return;
    }
    if (!supabase) return;
    const { error } = await supabase.from("likes").upsert({ from_user: currentProfile.id, to_user: targetId });
    setStatus(error ? error.message : "Invite sent.");
    if (!error) {
      if (isAcceptingIncomingInvite) {
        appendInviteNoticeForUser(targetId, {
          id: crypto.randomUUID(),
          type: "accepted",
          profileId: currentProfile.id,
          createdAt: new Date().toISOString(),
        });
      }
      await loadLiveData(currentProfile.id);
    }
  }

  async function declineInvite(fromUserId: string) {
    if (!currentProfile) return;
    setDeclinedIncomingInviteIds((previous) => [...new Set([...previous, fromUserId])]);
    appendInviteNoticeForUser(fromUserId, {
      id: crypto.randomUUID(),
      type: "rejected",
      profileId: currentProfile.id,
      createdAt: new Date().toISOString(),
    });
    if (!useDemoMode && supabase) {
      await supabase.from("likes").delete().eq("from_user", fromUserId).eq("to_user", currentProfile.id);
      await loadLiveData(currentProfile.id);
    }
    setStatus("Invite declined.");
  }

  async function sendMessageContent(content: string) {
    if (!currentProfile || !selectedPartner || !content.trim()) return;
    if (useDemoMode) {
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), sender_id: currentProfile.id, receiver_id: selectedPartner.id, content: content.trim(), created_at: new Date().toISOString() }]);
      return;
    }
    if (!supabase) return;
    const { error } = await supabase.from("messages").insert({ sender_id: currentProfile.id, receiver_id: selectedPartner.id, content: content.trim() });
    setStatus(error ? error.message : "Message sent.");
    if (!error) {
      await loadLiveData(currentProfile.id);
    }
  }

  async function readAsDataUrl(file: Blob) {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read file."));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
    return result;
  }

  async function sendMessage() {
    const next = messageDraft.trim();
    if (!next) return;
    await sendMessageContent(next);
    setMessageDraft("");
  }

  async function attachToMessage(file: File | null) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus("Please keep attachments under 2 MB for now.");
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    const type: EncodedMediaMessage["type"] = file.type.startsWith("image/") ? "image" : "file";
    await sendMessageContent(encodeMediaMessage({
      type,
      name: file.name,
      dataUrl,
      mimeType: file.type || "application/octet-stream",
    }));
  }

  async function toggleVoiceRecording() {
    if (isRecordingVoice && voiceRecorderRef.current) {
      voiceRecorderRef.current.stop();
      return;
    }

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("Voice recording is not supported on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      voiceStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const durationSeconds = Math.max(1, Math.round(((Date.now() - (voiceStartedAtRef.current ?? Date.now())) / 1000)));
        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void (async () => {
          if (blob.size > 2 * 1024 * 1024) {
            setStatus("Voice note is too large. Keep it shorter for now.");
          } else {
            const dataUrl = await readAsDataUrl(blob);
            await sendMessageContent(encodeMediaMessage({
              type: "audio",
              name: `voice-note-${Date.now()}.webm`,
              dataUrl,
              mimeType: recorder.mimeType || "audio/webm",
              durationSeconds,
            }));
          }
          stream.getTracks().forEach((track) => track.stop());
          voiceRecorderRef.current = null;
          voiceChunksRef.current = [];
          voiceStartedAtRef.current = null;
          setIsRecordingVoice(false);
        })();
      };

      recorder.start();
      voiceRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setStatus("Recording voice note. Tap the mic again to send it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't start recording.");
      setIsRecordingVoice(false);
    }
  }

  const progress = Math.min(((stepIndex + 1) / onboardingSteps.length) * 100, 100);
  const activeStep = onboardingSteps[Math.min(stepIndex, onboardingSteps.length - 1)];
  const showOnboarding = stepIndex < onboardingSteps.length || editingStepKey !== null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ffe6f1_0%,transparent_45%),linear-gradient(180deg,#fffaf6_0%,#f5ede6_100%)] px-3 py-4 text-stone-900">
      <div className="mx-auto w-full max-w-[430px] rounded-[2rem] border border-white/60 bg-[linear-gradient(165deg,#fffdfa_0%,#f9f2e8_100%)] shadow-[0_20px_50px_rgba(56,32,20,0.08)] backdrop-blur">
        {showOnboarding ? (
          showFriendsConstruction ? (
            <FriendsConstructionScreen
              onBack={() => {
                setShowFriendsConstruction(false);
                setMode("Dating");
              }}
            />
          ) : (
          <section className="flex min-h-screen flex-col px-5 pb-5 pt-5">
            <div className="flex items-center gap-4">
              <button
                className="grid h-10 w-10 place-items-center rounded-full text-stone-900 disabled:opacity-35"
                disabled={editingStepKey === null && stepIndex === 0}
                onClick={() => {
                  if (editingStepKey) {
                    setEditingStepKey(null);
                    setStepIndex(onboardingSteps.length);
                    setActiveTab("profile");
                    return;
                  }
                  setStepIndex((value) => Math.max(0, value - 1));
                }}
                type="button"
              >
                <ArrowLeftIcon />
              </button>
              <div className="h-3 flex-1 rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-pink-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="pt-12">
              <h1 className="text-[2.2rem] leading-[1.12]">{activeStep.title}</h1>
              <p className="mt-4 text-lg text-stone-400">{activeStep.subtitle}</p>
            </div>

            <div className="pt-10">
              <OnboardingBody
                stepKey={activeStep.key}
                mode={mode}
                setMode={setMode}
                onChooseFriends={() => {
                  setMode("Friends");
                  setShowFriendsConstruction(true);
                }}
                authEmail={authEmail}
                authPassword={authPassword}
                sessionEmail={session?.user.email ?? null}
                setAuthEmail={setAuthEmail}
                setAuthPassword={setAuthPassword}
                requestMagicLink={requestMagicLink}
                loginWithPassword={loginWithPassword}
                signInWithGoogle={signInWithGoogle}
                liveReady={liveReady}
                useDemoMode={useDemoMode}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                photoState={photoState}
                setPhotoState={setPhotoState}
                status={status}
              />
              {activeStep.key !== "auth" && status ? (
                <div className="mt-6 rounded-[1.2rem] border border-stone-200 bg-white/70 px-4 py-4 text-sm leading-7 text-stone-600">
                  {status}
                </div>
              ) : null}
            </div>

            <div className="mt-auto flex justify-end pt-24 pr-0">
              {editingStepKey ? (
                <button
                  className="w-full rounded-[1.4rem] bg-stone-950 px-5 py-4 text-lg font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.14)]"
                  onClick={() => void saveEditedStep()}
                  type="button"
                >
                  Save
                </button>
              ) : (
                <ContinueButton
                  onClick={() => {
                    if (stepIndex === onboardingSteps.length - 1) {
                      void saveProfile();
                      return;
                    }
                    setStepIndex((value) => value + 1);
                  }}
                />
              )}
            </div>
          </section>
          )
        ) : (
          <section className="min-h-screen">
            {activeTab === "home" && (
              <HomeScreen
                currentProfile={currentProfile}
                recommendations={recommendations}
                onLike={likeProfile}
                savedForLaterCount={savedForLater.length}
                onOpenMessages={() => setActiveTab("messages")}
                onOpenInvites={() => setShowInvitePanel((previous) => !previous)}
                onOpenProfile={() => setActiveTab("profile")}
                unreadInviteNoticeCount={unreadInviteNoticeCount}
                showInvitePanel={showInvitePanel}
                pendingIncomingInvites={pendingIncomingInvites}
                pendingOutgoingInvites={pendingOutgoingInvites}
                inviteNotices={inviteNotices}
                onAcceptInvite={(id) => void likeProfile(id)}
                onDeclineInvite={(id) => void declineInvite(id)}
                onDismissInviteNotice={(id) => setInviteNotices((previous) => previous.filter((item) => item.id !== id))}
                onPass={(id) => {
                  setPassedProfileIds((previous) => [...new Set([...previous, id])]);
                  setStatus("Skipped for now.");
                }}
                onSaveLater={(id) => {
                  setSavedForLater((previous) => [...new Set([...previous, id])]);
                  setStatus("Profile saved for later recommendation review.");
                }}
              />
            )}
            {activeTab === "profile" && (
              <ProfileScreen currentProfile={currentProfile} profileForm={profileForm} photoState={photoState} onBack={() => setActiveTab("home")} onEditStep={beginEdit} onLogout={logoutAndStartOver} />
            )}
            {activeTab === "messages" && (
              <MessagesScreen
                partners={chatPartners}
                selectedPartner={selectedPartner}
                setChatTargetId={setChatTargetId}
                visibleMessages={visibleMessages}
                messageDraft={messageDraft}
                setMessageDraft={setMessageDraft}
                sendMessage={sendMessage}
                onAttachFile={attachToMessage}
                onToggleRecording={toggleVoiceRecording}
                isRecordingVoice={isRecordingVoice}
                currentProfile={currentProfile}
                onBack={() => setActiveTab("home")}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function OnboardingBody(props: {
  stepKey: OnboardingStepKey;
  mode: "Dating" | "Friends";
  setMode: (value: "Dating" | "Friends") => void;
  onChooseFriends: () => void;
  authEmail: string;
  authPassword: string;
  sessionEmail: string | null;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  requestMagicLink: () => Promise<void>;
  loginWithPassword: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  liveReady: boolean;
  useDemoMode: boolean;
  profileForm: Omit<Profile, "id">;
  setProfileForm: React.Dispatch<React.SetStateAction<Omit<Profile, "id">>>;
  photoState: PhotoState;
  setPhotoState: React.Dispatch<React.SetStateAction<PhotoState>>;
  status: string;
}) {
  const { stepKey, mode, setMode, onChooseFriends, authEmail, authPassword, sessionEmail, setAuthEmail, setAuthPassword, requestMagicLink, loginWithPassword, signInWithGoogle, liveReady, useDemoMode, profileForm, setProfileForm, photoState, setPhotoState, status } = props;
  const update = <K extends keyof Omit<Profile, "id">>(key: K, value: Omit<Profile, "id">[K]) => setProfileForm((previous) => ({ ...previous, [key]: value }));

  if (stepKey === "mode") {
    return (
      <div className="space-y-6">
        <button className={`w-full overflow-hidden rounded-[2rem] border ${mode === "Dating" ? "border-stone-900" : "border-transparent"} bg-[linear-gradient(180deg,#f7b9c8_0%,#f1a8bc_100%)]`} onClick={() => setMode("Dating")} type="button">
          <Image alt="Dating card" className="h-44 w-full object-cover" height={176} src="/dating-card.png" width={400} />
        </button>
        <button className={`w-full overflow-hidden rounded-[2rem] border ${mode === "Friends" ? "border-stone-900" : "border-transparent"} bg-[#efe0cb]`} onClick={onChooseFriends} type="button">
          <Image alt="Friends card" className="h-36 w-full object-cover" height={144} src="/friends-card.png" width={400} />
        </button>
      </div>
    );
  }

  if (stepKey === "auth") {
    return (
      <div className="space-y-4">
        <Field value={authEmail} onChange={setAuthEmail} placeholder="Enter your email or number" />
        <Field value={authPassword} onChange={setAuthPassword} placeholder="Enter your password" type="password" />
        {sessionEmail && (
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
            You are logged in as <span className="font-semibold">{sessionEmail}</span>. Tap the continue button below to keep going.
          </div>
        )}
        <button className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-white disabled:opacity-40" disabled={!liveReady} onClick={() => void requestMagicLink()} type="button">
          Send login link
        </button>
        <button className="w-full rounded-2xl border border-stone-900 bg-white px-4 py-3 text-stone-950 disabled:opacity-40" disabled={!liveReady || !authPassword || (!sessionEmail && !authEmail)} onClick={() => void loginWithPassword()} type="button">
          {sessionEmail ? "Save password" : "Login with password"}
        </button>
        <button className="w-full rounded-2xl border border-stone-300 bg-[#f6eee5] px-4 py-3 text-stone-950 disabled:opacity-40" disabled={!liveReady} onClick={() => void signInWithGoogle()} type="button">
          Continue with Google
        </button>
        {sessionEmail && (
          <div className="rounded-[1rem] bg-[#f6eee5] px-4 py-3 text-sm leading-6 text-stone-600">
            After logging in once, enter a password here and tap <span className="font-semibold">Save password</span> to use it next time.
          </div>
        )}
        <div className="text-sm leading-7 text-stone-500">
          {useDemoMode
            ? "Demo mode is active. Supabase is not required to explore the UI."
            : status}
        </div>
      </div>
    );
  }

  if (stepKey === "age") return <ScrollWheel values={[13, 14, 15, 16, 17, 18, 19]} selected={profileForm.age} onSelect={(value) => update("age", value)} format={(value) => String(value)} />;
  if (stepKey === "height_cm") return <HeightSelector value={profileForm.height_cm} onChange={(value) => update("height_cm", value)} />;
  if (stepKey === "gender") return <GenderChoiceGrid selected={[profileForm.gender]} onToggle={(value) => update("gender", value)} singleSelect />;
  if (stepKey === "pronouns") return <ChoiceList values={pronounChoices} selected={profileForm.pronouns} onSelect={(value) => update("pronouns", value)} />;
  if (stepKey === "interested_in") {
    const selectedInterests = Array.from(parseInterestedIn(profileForm.interested_in));
    return (
      <div className="space-y-4">
        <GenderChoiceGrid
          selected={selectedInterests}
          onToggle={(value) => {
            const normalized = normalize(value);
            const exists = selectedInterests.includes(normalized);
            const next = exists
              ? selectedInterests.filter((item) => item !== normalized)
              : selectedInterests.length < 4
                ? [...selectedInterests, normalized]
                : [...selectedInterests.slice(1), normalized];
            update("interested_in", serializeInterestedIn(next.map((item) => genderChoices.find((choice) => normalize(choice) === item) ?? item)));
          }}
        />
        <p className="text-sm text-stone-500">Choose up to 4 options.</p>
      </div>
    );
  }
  if (stepKey === "photos") return <PhotoUploadStep photoState={photoState} setPhotoState={setPhotoState} setCover={(value) => update("avatar_url", value)} />;
  if (stepKey === "religion") return <ChoiceList values={religionChoices} selected={profileForm.religion ?? ""} onSelect={(value) => update("religion", value)} />;
  if (stepKey === "grade") return <Wheel values={gradeChoices} selected={profileForm.grade} onSelect={(value) => update("grade", value)} format={(value) => value} />;
  if (stepKey === "dating_intention") return <ChoiceList values={intentionChoices} selected={profileForm.dating_intention} onSelect={(value) => update("dating_intention", value)} />;
  if (stepKey === "hobbies") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {hobbyChoices.map((item) => {
            const selected = profileForm.hobbies.includes(item);
            return (
              <button
                key={item}
                className={`rounded-full border px-5 py-3 text-lg ${selected ? "border-stone-900 bg-white text-stone-950" : "border-stone-300 text-stone-700"}`}
                onClick={() => {
                  const next = selected ? profileForm.hobbies.filter((hobby) => hobby !== item) : profileForm.hobbies.length < 2 ? [...profileForm.hobbies, item] : [profileForm.hobbies[1], item];
                  update("hobbies", next);
                }}
                type="button"
              >
                {item}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-stone-500">Selected: {profileForm.hobbies.join(", ")}</p>
      </div>
    );
  }
  if (stepKey === "prompt") {
    return (
      <div className="space-y-5">
        <ChoiceList values={promptChoices} selected={profileForm.prompt_title} onSelect={(value) => update("prompt_title", value)} />
        <Field value={profileForm.prompt_answer} onChange={(value) => update("prompt_answer", value)} placeholder="Type your prompt answer here" />
      </div>
    );
  }

  return (
    <Field
      value={
        stepKey === "full_name" ? profileForm.full_name :
        stepKey === "school_name" ? profileForm.school_name :
        stepKey === "zodiac" ? profileForm.zodiac ?? "" :
        profileForm.city
      }
      onChange={(value) => {
        if (stepKey === "full_name") update("full_name", value);
        else if (stepKey === "school_name") update("school_name", value);
        else if (stepKey === "zodiac") update("zodiac", value);
        else update("city", value);
      }}
      placeholder={stepKey === "full_name" ? "Enter your name" : stepKey === "school_name" ? "Enter your school name" : stepKey === "zodiac" ? "Enter your zodiac sign" : "Enter your city"}
    />
  );
}

function HomeScreen(props: {
  currentProfile: Profile | null;
  recommendations: Array<{ profile: Profile; score: number; reasons: string[] }>;
  onLike: (id: string) => Promise<void>;
  savedForLaterCount: number;
  onOpenMessages: () => void;
  onOpenInvites: () => void;
  onOpenProfile: () => void;
  unreadInviteNoticeCount: number;
  showInvitePanel: boolean;
  pendingIncomingInvites: Profile[];
  pendingOutgoingInvites: Profile[];
  inviteNotices: InviteNotice[];
  onAcceptInvite: (id: string) => void;
  onDeclineInvite: (id: string) => void;
  onDismissInviteNotice: (id: string) => void;
  onPass: (id: string) => void;
  onSaveLater: (id: string) => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [gestureText, setGestureText] = useState("Swipe right to send invite. If they like back, you match and unlock DMs.");
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const top = props.recommendations[cardIndex]?.profile ?? null;
  const next = props.recommendations[cardIndex + 1]?.profile ?? null;
  const profileLookup = useMemo(() => {
    const all = [...props.recommendations.map((item) => item.profile), ...props.pendingIncomingInvites, ...props.pendingOutgoingInvites];
    return all.reduce<Record<string, Profile>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [props.pendingIncomingInvites, props.pendingOutgoingInvites, props.recommendations]);

  useEffect(() => {
    if (cardIndex >= props.recommendations.length) {
      setCardIndex(0);
    }
  }, [cardIndex, props.recommendations.length]);

  function advanceCard() {
    if (!props.recommendations.length) return;
    setCardIndex((value) => Math.min(value + 1, Math.max(props.recommendations.length - 1, 0)));
    setDrag({ x: 0, y: 0 });
  }

  async function handleLike() {
    if (!top) {
      setGestureText("No more profiles right now.");
      return;
    }
    await props.onLike(top.id);
    setGestureText(`Liked ${top.full_name}.`);
    advanceCard();
  }

  function handlePass() {
    if (!top) {
      setGestureText("No more profiles right now.");
      return;
    }
    props.onPass(top.id);
    setGestureText(`Passed on ${top.full_name}.`);
    advanceCard();
  }

  function handleSaveLater() {
    if (!top) {
      setGestureText("No more profiles right now.");
      return;
    }
    props.onSaveLater(top.id);
    setGestureText(`Saved ${top.full_name} for later.`);
    advanceCard();
  }

  function beginGesture(x: number, y: number) {
    gestureStart.current = { x, y };
  }

  function moveGesture(x: number, y: number) {
    if (!gestureStart.current) return;
    setDrag({
      x: x - gestureStart.current.x,
      y: y - gestureStart.current.y,
    });
  }

  function endGesture() {
    if (!gestureStart.current) return;
    if (drag.y < -70) handleSaveLater();
    else if (drag.x > 60) void handleLike();
    else if (drag.x < -60) handlePass();
    else setDrag({ x: 0, y: 0 });
    gestureStart.current = null;
  }

  return (
    <div className="soft-fade-in px-5 pt-5">
      <div className="flex items-center gap-3">
        <button className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm" onClick={props.onOpenProfile} type="button">
          <ToolbarButtonImage alt="Account" fallback={<ProfileIcon />} src="/home-account-button.png" />
        </button>
        <div className="flex flex-1 items-center gap-3 rounded-full bg-[radial-gradient(circle_at_top,#ffffff_0%,#efefef_100%)] px-4 py-3 text-sm text-stone-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_10px_rgba(0,0,0,0.05)]">
          <SearchIcon />
          <span>Search here</span>
        </div>
        <button className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm" onClick={props.onOpenMessages} type="button">
          <ToolbarButtonImage alt="Messages" fallback={<ChatIcon />} src="/home-dm-button.png" />
        </button>
        <button className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm" onClick={props.onOpenInvites} type="button">
          <HeartOutlineIcon className="h-7 w-7" />
          {props.unreadInviteNoticeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold leading-none text-white">
              {props.unreadInviteNoticeCount > 9 ? "9+" : props.unreadInviteNoticeCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-4 text-center text-sm leading-6 text-stone-500">{gestureText}</div>
      {props.showInvitePanel && (
        <div className="mt-4 space-y-3 rounded-[1.2rem] border border-black/10 bg-white/90 p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold tracking-[0.02em] text-stone-700">Invites</div>
          {!!props.pendingIncomingInvites.length && (
            <div className="space-y-2">
              {props.pendingIncomingInvites.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f9f2f6] px-3 py-2">
                  <div>
                    <div className="font-semibold text-stone-900">{profile.full_name}</div>
                    <div className="text-xs text-stone-500">Sent you an invite</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => props.onAcceptInvite(profile.id)} type="button">Accept</button>
                    <button className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700" onClick={() => props.onDeclineInvite(profile.id)} type="button">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!!props.pendingOutgoingInvites.length && (
            <div className="space-y-2">
              {props.pendingOutgoingInvites.map((profile) => (
                <div key={`out-${profile.id}`} className="flex items-center justify-between rounded-xl bg-[#f6f4ef] px-3 py-2">
                  <div className="font-semibold text-stone-800">{profile.full_name}</div>
                  <div className="text-xs text-amber-700">Pending</div>
                </div>
              ))}
            </div>
          )}
          {!!props.inviteNotices.length && (
            <div className="space-y-2">
              {props.inviteNotices.slice(0, 6).map((notice) => {
                const person = profileLookup[notice.profileId];
                return (
                  <button
                    key={notice.id}
                    className="flex w-full items-center justify-between rounded-xl bg-[#f7f7f7] px-3 py-2 text-left"
                    onClick={() => props.onDismissInviteNotice(notice.id)}
                    type="button"
                  >
                    <div className="text-sm text-stone-700">
                      {notice.type === "accepted" ? `${person?.full_name ?? "Someone"} liked back. You can DM now.` : `${person?.full_name ?? "Someone"} declined your invite.`}
                    </div>
                    <span className="text-xs text-stone-500">Dismiss</span>
                  </button>
                );
              })}
            </div>
          )}
          {!props.pendingIncomingInvites.length && !props.pendingOutgoingInvites.length && !props.inviteNotices.length && (
            <div className="text-sm text-stone-500">No invite activity yet.</div>
          )}
        </div>
      )}

      <div className="relative mt-8">
        {top ? (
          <>
            {next && <div className="pointer-events-none absolute right-2 top-4 h-[23rem] w-[84%] rounded-[1.25rem] bg-[linear-gradient(180deg,#7f613a_0%,#b07a42_14%,#8a5e2f_100%)] opacity-75 shadow-sm" />}

            <div
              className="card-rise-in relative overflow-hidden rounded-[1.1rem] bg-[#e5ddd3] transition-transform duration-150"
              onMouseDown={(event) => beginGesture(event.clientX, event.clientY)}
              onMouseLeave={endGesture}
              onMouseMove={(event) => moveGesture(event.clientX, event.clientY)}
              onMouseUp={endGesture}
              onTouchEnd={endGesture}
              onTouchMove={(event) => moveGesture(event.touches[0].clientX, event.touches[0].clientY)}
              onTouchStart={(event) => beginGesture(event.touches[0].clientX, event.touches[0].clientY)}
              style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 10}deg)` }}
            >
              {drag.x > 40 && <div className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">Liked</div>}
              {drag.x < -40 && <div className="absolute left-4 top-4 z-10 rounded-full bg-stone-950/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">Passed</div>}
              {drag.y < -40 && <div className="absolute left-4 top-4 z-10 rounded-full bg-amber-500/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">Later</div>}
              <button className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/85 shadow-sm" onClick={handleSaveLater} type="button">
                <StarIcon />
              </button>
              <ProfileImage
                alt={top.full_name || "Profile photo"}
                className="h-[22rem] w-full object-cover"
                fallbackClassName="h-[22rem] w-full bg-[linear-gradient(135deg,#d7c2b2_0%,#dbe4ec_100%)]"
                src={top.avatar_url}
              />
            </div>

            <div className="mt-5 rounded-[1rem] bg-[linear-gradient(135deg,#f6cade_0%,#ffd8e8_48%,#f7bfd0_100%)] p-5 shadow-[0_12px_24px_rgba(233,159,185,0.22)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[2.3rem] leading-none">{top.full_name}</div>
                  <div className="mt-2 text-[1.65rem] leading-none">Age - {top.age}</div>
                </div>
                <HeartOutlineIcon />
              </div>
              <p className="mt-6 text-[2.15rem] leading-[1.2]">{top.prompt_title} - {top.prompt_answer}</p>
            </div>
          </>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-stone-300 bg-white/80 px-6 py-12 text-center shadow-sm">
            <div className="text-[2rem] font-[Georgia,'Times New Roman',serif]">No more profiles right now</div>
            <p className="mt-3 text-sm leading-6 text-stone-500">When new people join or when you come back later, fresh cards will show up here.</p>
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-between px-4">
        <button className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]" onClick={handlePass} type="button">
          <CloseIcon />
        </button>
        <div className="text-sm text-stone-500">Saved for later: {props.savedForLaterCount}</div>
        <button className="glow-pulse grid h-20 w-20 place-items-center rounded-full bg-[#ffeff4] shadow-[0_12px_24px_rgba(240,70,120,0.15)]" onClick={() => void handleLike()} type="button">
          <HeartFillIcon />
        </button>
      </div>
    </div>
  );
}
function ProfileScreen(props: {
  currentProfile: Profile | null;
  profileForm: Omit<Profile, "id">;
  photoState: PhotoState;
  onBack: () => void;
  onEditStep: (stepKey: OnboardingStepKey) => void;
  onLogout: () => Promise<void>;
}) {
  const profile = props.currentProfile ?? ({ id: "local", ...props.profileForm } as Profile);
  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between">
        <button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm" onClick={props.onBack} type="button">
          <ArrowLeftIcon />
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm" onClick={() => props.onEditStep("full_name")} type="button">
          <PencilIcon />
        </button>
      </div>

      <div className="relative mx-auto mt-8 h-[19rem] w-[19rem] overflow-hidden rounded-[3rem] bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)] shadow-[0_14px_30px_rgba(40,28,21,0.08)]">
        <ProfileImage
          alt={profile.full_name || "Your profile photo"}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)]"
          src={props.photoState.cover || profile.avatar_url}
        />
        <button className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/80 shadow-sm" onClick={() => props.onEditStep("photos")} type="button">
          <PencilIcon />
        </button>
      </div>

      <h2 className="mt-7 text-center text-[3.2rem] leading-none">{profile.full_name || "Your Name"}</h2>
      <p className="mt-2 text-center text-sm tracking-[0.08em] text-stone-500 uppercase">{profile.city || "City"} · {profile.school_name || "School"}</p>

      <div className="mt-6 rounded-[1.2rem] bg-[linear-gradient(140deg,#ffe9f3_0%,#f8f0ff_100%)] p-4 shadow-[0_10px_20px_rgba(170,100,130,0.14)]">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{profile.prompt_title}</div>
        <p className="mt-2 text-[1.08rem] leading-7 text-stone-800">{profile.prompt_answer || "Add a fun prompt answer to make your profile stand out."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.hobbies.map((hobby) => (
            <span key={hobby} className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-stone-700">{hobby}</span>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <EditableRow label="Age" value={String(profile.age)} onEdit={() => props.onEditStep("age")} />
        <EditableRow label="Height" value={`${profile.height_cm}cm`} onEdit={() => props.onEditStep("height_cm")} />
        <EditableRow label="Relationship type" value={profile.dating_intention} onEdit={() => props.onEditStep("dating_intention")} />
        <EditableRow label="Class" value={profile.grade} onEdit={() => props.onEditStep("grade")} />
        <EditableRow label="Pronouns" value={profile.pronouns} onEdit={() => props.onEditStep("pronouns")} />
        <EditableRow label="Religion" value={profile.religion || "Not set"} onEdit={() => props.onEditStep("religion")} />
      </div>

      <div className="pb-10 pt-10">
        <a
          className={`block w-full rounded-[1.4rem] px-5 py-4 text-center text-lg font-semibold shadow-[0_14px_28px_rgba(0,0,0,0.1)] ${
            FEEDBACK_FORM_URL
              ? "bg-stone-950 text-white"
              : "cursor-not-allowed bg-stone-300 text-stone-600"
          }`}
          href={FEEDBACK_FORM_URL || undefined}
          onClick={(event) => {
            if (!FEEDBACK_FORM_URL) event.preventDefault();
          }}
          rel="noreferrer"
          target="_blank"
        >
          Feedback
        </a>
        {!FEEDBACK_FORM_URL && (
          <p className="mt-3 text-center text-sm text-stone-500">Add your Google Form link in `FEEDBACK_FORM_URL` near the top of this file.</p>
        )}
        <button
          className="mt-4 block w-full rounded-[1.4rem] border border-stone-900 bg-white px-5 py-4 text-center text-lg font-semibold text-stone-950 shadow-[0_14px_28px_rgba(0,0,0,0.06)]"
          onClick={() => void props.onLogout()}
          type="button"
        >
          Logout / Start Over
        </button>
      </div>
    </div>
  );
}
function MessagesScreen(props: {
  partners: Profile[];
  selectedPartner: Profile | null;
  setChatTargetId: (id: string) => void;
  visibleMessages: Message[];
  messageDraft: string;
  setMessageDraft: (value: string) => void;
  sendMessage: () => Promise<void>;
  onAttachFile: (file: File | null) => Promise<void>;
  onToggleRecording: () => Promise<void>;
  isRecordingVoice: boolean;
  currentProfile: Profile | null;
  onBack: () => void;
}) {
  const [showConversation, setShowConversation] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!props.selectedPartner) {
      setShowConversation(false);
      setShowProfileDetails(false);
    }
  }, [props.selectedPartner]);

  return (
    <div className="soft-fade-in px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <button
          className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"
          onClick={() => {
            if (showConversation) {
              setShowConversation(false);
              setShowProfileDetails(false);
              return;
            }
            props.onBack();
          }}
          type="button"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="text-center text-[2.7rem] leading-[0.95]">{showConversation ? props.selectedPartner?.full_name ?? "Chat" : "Direct Messages"}</h2>
        <span className="w-10" />
      </div>

      {!showConversation && (
        <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-white/75 p-3 shadow-[0_12px_26px_rgba(40,28,21,0.06)]">
          <div className="space-y-3">
            {props.partners.map((partner) => {
              const active = props.selectedPartner?.id === partner.id;
              return (
                <button
                  key={partner.id}
                  className={`flex w-full items-center gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition-all ${active ? "border-stone-200 bg-[#f2e9dc] shadow-[0_10px_18px_rgba(40,28,21,0.08)]" : "border-transparent bg-transparent hover:bg-white/60"}`}
                  onClick={() => {
                    props.setChatTargetId(partner.id);
                    setShowConversation(true);
                  }}
                  type="button"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-[linear-gradient(180deg,#d2efff_0_55%,#b7db76_56%_72%,#8ca300_73%)] shadow-sm">
                    <ProfileImage
                      alt={partner.full_name}
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full bg-[linear-gradient(180deg,#d2efff_0_55%,#b7db76_56%_72%,#8ca300_73%)]"
                      src={partner.avatar_url}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.9rem] font-[Georgia,'Times New Roman',serif]">{partner.full_name}</div>
                    <div className="text-xs text-stone-400">{active ? "Open now" : "Tap to chat"}</div>
                  </div>
                  {active && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
            {!props.partners.length && <div className="px-2 py-6 text-center text-sm text-stone-500">Only mutual matches can chat. Accept an invite or get liked back to unlock DMs.</div>}
          </div>
        </div>
      )}

      {props.selectedPartner && showConversation && (
        <div className="card-rise-in mt-6 rounded-[1.6rem] border border-black/10 bg-white/80 p-4 shadow-[0_14px_32px_rgba(40,28,21,0.08)]">
          <div className="flex items-center justify-center gap-3">
            <button
              className="h-14 w-14 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm"
              onClick={() => setShowProfileDetails(true)}
              type="button"
            >
              <ProfileImage
                alt={props.selectedPartner.full_name}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)]"
                src={props.selectedPartner.avatar_url}
              />
            </button>
            <button className="text-center text-[2.2rem] font-[Georgia,'Times New Roman',serif]" onClick={() => setShowProfileDetails(true)} type="button">
              {props.selectedPartner.full_name}
            </button>
          </div>

          <div className="mt-6 min-h-[18rem] max-h-[52vh] space-y-4 overflow-y-auto pr-1">
            {props.visibleMessages.map((message) => {
              const mine = message.sender_id === props.currentProfile?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-[2rem] border-2 border-stone-900 px-4 py-3 text-base leading-6 shadow-sm ${
                      mine ? "rounded-br-[0.4rem] bg-white" : "rounded-bl-[0.4rem] bg-[#fffdf8]"
                    }`}
                  >
                    <MessageBubble content={message.content} />
                  </div>
                </div>
              );
            })}
            {!props.visibleMessages.length && (
              <div className="py-8 text-center text-sm text-stone-500">Start the conversation here.</div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-[1.4rem] bg-[#f4eee6] px-2 py-2">
            <input
              ref={fileInputRef}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void props.onAttachFile(file);
                event.currentTarget.value = "";
              }}
              type="file"
            />
            <button className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm" onClick={() => fileInputRef.current?.click()} type="button">
              <ClipButtonImage />
            </button>
            <input
              className="min-w-0 flex-1 rounded-[1rem] border border-black/10 bg-white px-4 py-3 text-base outline-none"
              placeholder="type here"
              value={props.messageDraft}
              onChange={(event) => props.setMessageDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void props.sendMessage();
                }
              }}
            />
            <button className={`grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-sm ${props.isRecordingVoice ? "bg-red-500 text-white" : "bg-white"}`} onClick={() => void props.onToggleRecording()} type="button">
              <MicIcon />
            </button>
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-950 text-white shadow-sm" onClick={() => void props.sendMessage()} type="button">
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {props.selectedPartner && showProfileDetails && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/25 px-5" onClick={() => setShowProfileDetails(false)}>
          <div className="w-full max-w-[360px] rounded-[2rem] bg-[#f9f4ed] px-6 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.16)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" onClick={() => setShowProfileDetails(false)} type="button">
                <ArrowLeftIcon />
              </button>
              <span className="w-10" />
            </div>
            <div className="mx-auto mt-4 h-40 w-40 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)]">
              <ProfileImage
                alt={props.selectedPartner.full_name}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)]"
                src={props.selectedPartner.avatar_url}
              />
            </div>
            <h3 className="mt-4 text-center text-[2.3rem] leading-none">{props.selectedPartner.full_name}</h3>
            <div className="mt-7 space-y-4 text-[1.15rem] leading-8">
              <PartnerInfoRow label="Height" value={`${props.selectedPartner.height_cm}cm`} />
              <PartnerInfoRow label="Relationship type" value={props.selectedPartner.dating_intention} />
              <PartnerInfoRow label="Class" value={props.selectedPartner.grade} />
              <PartnerInfoRow label="School" value={props.selectedPartner.school_name} />
              <PartnerInfoRow label="Pronouns" value={props.selectedPartner.pronouns} />
              <PartnerInfoRow label="Religion" value={props.selectedPartner.religion || "Not shared"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PartnerInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div>{label} - {value}</div>
      <div className="mt-1 h-px w-full bg-stone-300" />
    </div>
  );
}

function FriendsConstructionScreen({ onBack }: { onBack: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="flex min-h-screen flex-col px-5 pb-5 pt-5">
      <div className="flex items-center gap-4">
        <button className="grid h-10 w-10 place-items-center rounded-full text-stone-900" onClick={onBack} type="button">
          <ArrowLeftIcon />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        {!imageError ? (
          <div className="relative w-full max-w-[290px] overflow-hidden rounded-[1.8rem]">
            <Image
              alt="Friends mode under construction"
              className="h-auto w-full object-contain"
              height={540}
              onError={() => setImageError(true)}
              src="/friends-under-construction.png"
              width={290}
            />
          </div>
        ) : (
          <div className="w-full rounded-[2rem] bg-white/80 px-6 py-12 text-center shadow-sm">
            <div className="text-[2.5rem] font-black uppercase tracking-[-0.04em] text-[#ff9800]">Sorry!</div>
            <p className="mt-3 text-lg text-stone-700">Friends mode is under construction right now.</p>
            <p className="mt-2 text-sm leading-6 text-stone-500">Add your artwork at `/public/friends-under-construction.png` and it will appear here automatically.</p>
          </div>
        )}
        <p className="mt-8 text-center text-sm leading-6 text-stone-500">We’re still building the friends side of Amis. For now, please use Dating mode.</p>
        <button className="mt-6 w-full max-w-[240px] rounded-[1.2rem] bg-stone-950 px-5 py-4 text-base font-semibold text-white" onClick={onBack} type="button">
          Back to Dating
        </button>
      </div>
    </section>
  );
}

function Field({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <input className="w-full rounded-[1rem] bg-slate-100 px-5 py-5 text-lg outline-none" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} />;
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      className="relative h-[160px] w-[420px] max-w-full overflow-hidden bg-transparent touch-manipulation"
      onClick={onClick}
      type="button"
    >
      {!imageError ? (
        <Image
          alt="Continue button"
          className="pointer-events-none select-none object-contain"
          draggable={false}
          fill
          onError={() => setImageError(true)}
          src="/continue-button.png"
        />
      ) : (
        <div className="flex h-full items-center justify-end">
          <span className="mr-2 flex items-center gap-1">
            <span className="h-5 w-3 bg-stone-950 [clip-path:polygon(0_0,100%_0,70%_100%,0_100%)]" />
            <span className="h-5 w-3 bg-stone-950 [clip-path:polygon(0_0,100%_0,70%_100%,0_100%)]" />
          </span>
          <span className="rounded-l-xl bg-stone-950 px-6 py-4 text-base font-semibold text-white">To Be Continued</span>
          <span className="flex h-[58px] w-[68px] items-center justify-center bg-stone-950 text-white [clip-path:polygon(0_0,72%_0,100%_50%,72%_100%,0_100%,24%_50%)]">
            <ArrowRightIcon />
          </span>
        </div>
      )}
    </button>
  );
}

function ChoiceList({ values, selected, onSelect, large }: { values: string[]; selected: string; onSelect: (value: string) => void; large?: boolean }) {
  return (
    <div className="space-y-4">
      {values.map((item) => (
        <button
          key={item}
          className={`w-full rounded-[1.2rem] border px-5 py-5 text-left font-sans tracking-[-0.02em] ${selected === item ? "border-stone-900 bg-white" : "border-stone-300"} ${large ? "text-[2rem] font-bold" : "text-[1.65rem] font-semibold"}`}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function GenderChoiceGrid({
  selected,
  onToggle,
  singleSelect,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  singleSelect?: boolean;
}) {
  return (
    <div className="space-y-4">
      {genderChoices.map((item) => {
        const active = selected.includes(normalize(item));
        return (
          <button
            key={item}
            className={`flex w-full items-center gap-4 rounded-[1.2rem] border px-4 py-4 text-left transition-all ${active ? "border-stone-900 bg-white shadow-sm" : "border-stone-300 bg-transparent"}`}
            onClick={() => onToggle(item)}
            type="button"
          >
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-stone-200 bg-white">
              <GenderBadgeImage gender={item} />
            </div>
            <div className="h-10 w-px bg-stone-300" />
            <div className="flex-1 text-[1.4rem] font-bold uppercase tracking-[-0.02em]">{item}</div>
            {!singleSelect && active && <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Selected</div>}
          </button>
        );
      })}
    </div>
  );
}

function Wheel<T extends string | number>({ values, selected, onSelect, format }: { values: T[]; selected: T; onSelect: (value: T) => void; format: (value: T) => string }) {
  return (
    <div className="mx-auto flex max-w-[220px] flex-col items-center gap-2 py-10">
      {values.map((item) => {
        const active = item === selected;
        const distance = Math.abs(values.indexOf(item) - values.indexOf(selected));
        return (
          <button key={String(item)} className={`${active ? "text-7xl font-black text-black" : distance === 1 ? "text-5xl font-bold text-stone-500" : "text-4xl font-semibold text-stone-300"}`} onClick={() => onSelect(item)} type="button">
            {format(item)}
          </button>
        );
      })}
    </div>
  );
}

function ScrollWheel<T extends string | number>({ values, selected, onSelect, format }: { values: T[]; selected: T; onSelect: (value: T) => void; format: (value: T) => string }) {
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef<number | null>(null);
  const selectedIndex = values.findIndex((value) => value === selected);
  const slotCount = 7;
  const centerSlot = Math.floor(slotCount / 2);

  function shift(delta: number) {
    const nextIndex = Math.max(0, Math.min(values.length - 1, selectedIndex + delta));
    if (nextIndex !== selectedIndex) onSelect(values[nextIndex]);
  }

  function finishGesture() {
    if (dragOffset <= -24) shift(1);
    else if (dragOffset >= 24) shift(-1);
    setDragOffset(0);
    startY.current = null;
  }

  function begin(y: number) {
    startY.current = y;
  }

  function move(y: number) {
    if (startY.current === null) return;
    setDragOffset(Math.max(-48, Math.min(48, y - startY.current)));
  }

  const displayValues = Array.from({ length: slotCount }, (_, slotIndex) => {
    const valueIndex = selectedIndex + slotIndex - centerSlot;
    if (valueIndex < 0 || valueIndex >= values.length) {
      return { item: null as T | null, diff: slotIndex - centerSlot };
    }

    return {
      item: values[valueIndex],
      diff: slotIndex - centerSlot,
    };
  });

  return (
    <div className="relative mx-auto h-[24rem] max-w-[220px] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[72px] -translate-y-1/2 border-y-2 border-stone-300" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#f9f4ed] via-[#f9f4ed]/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f9f4ed] via-[#f9f4ed]/85 to-transparent" />
      <div
        className="flex h-full w-full touch-none flex-col items-center justify-center transition-transform duration-150"
        onMouseDown={(event) => begin(event.clientY)}
        onMouseLeave={finishGesture}
        onMouseMove={(event) => move(event.clientY)}
        onMouseUp={finishGesture}
        onTouchEnd={finishGesture}
        onTouchMove={(event) => move(event.touches[0].clientY)}
        onTouchStart={(event) => begin(event.touches[0].clientY)}
        onWheel={(event) => {
          event.preventDefault();
          shift(event.deltaY > 0 ? 1 : -1);
        }}
        style={{ transform: `translateY(${dragOffset}px)` }}
      >
        {displayValues.map(({ item, diff }, index) =>
          item === null ? (
            <div key={`empty-${index}`} className="block h-[72px] w-full shrink-0" />
          ) : (
            <button
              key={`${String(item)}-${index}`}
              className={`${diff === 0 ? "text-7xl font-black text-black" : Math.abs(diff) === 1 ? "text-5xl font-bold text-stone-500" : "text-4xl font-semibold text-stone-300"} block h-[72px] w-full shrink-0 text-center leading-[72px] transition-all`}
              onClick={() => onSelect(item)}
              type="button"
            >
              {format(item)}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function HeightSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const cms = Array.from({ length: 61 }, (_, index) => 140 + index);
  return (
    <div className="grid grid-cols-2 gap-6 pt-6">
      <div>
        <div className="mb-4 text-center text-2xl font-bold uppercase">Feet</div>
        <ScrollWheel values={cms} selected={value} onSelect={onChange} format={(item) => formatFeet(item)} />
      </div>
      <div className="border-l border-stone-300 pl-6">
        <div className="mb-4 text-center text-2xl font-bold uppercase">Centimeters</div>
        <ScrollWheel values={cms} selected={value} onSelect={onChange} format={(item) => String(item)} />
      </div>
    </div>
  );
}

function PhotoUploadStep(props: {
  photoState: PhotoState;
  setPhotoState: React.Dispatch<React.SetStateAction<PhotoState>>;
  setCover: (value: string | null) => void;
}) {
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function readFile(file: File | null, onLoad: (value: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onLoad(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-7">
      <div className="mx-auto max-w-[280px]">
        <button className="block w-full" onClick={() => coverInputRef.current?.click()} type="button">
          <div className="overflow-hidden rounded-[2rem] bg-[#ddd3c7] shadow-[0_10px_24px_rgba(60,40,28,0.08)]">
            <ProfileImage
              alt="Cover photo"
              className="h-[17rem] w-full object-cover"
              fallbackClassName="h-[17rem] w-full bg-[linear-gradient(135deg,#d9c7b9_0%,#d6e0e9_100%)]"
              src={props.photoState.cover}
            />
          </div>
        </button>
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            readFile(event.target.files?.[0] ?? null, (value) => {
              props.setPhotoState((previous) => ({ ...previous, cover: value }));
              props.setCover(value);
            });
          }}
          ref={coverInputRef}
          type="file"
        />
        <div className="mt-3 text-center text-[1.8rem]">Cover Image</div>
      </div>

      <div className="grid grid-cols-3 items-start gap-5 pt-2">
        {props.photoState.gallery.map((photo, index) => (
          <div key={`gallery-${index}`} className="relative">
            <button className="block w-full" onClick={() => galleryInputRefs.current[index]?.click()} type="button">
              <div className="overflow-hidden rounded-[1.8rem] bg-[#ddd3c7] shadow-[0_10px_20px_rgba(60,40,28,0.08)]">
                <ProfileImage
                  alt={`Extra photo ${index + 1}`}
                  className={`w-full object-cover ${index === 1 ? "h-[7.4rem]" : "h-[5.2rem]"}`}
                  fallbackClassName={`w-full bg-[linear-gradient(135deg,#bf9a72_0%,#4c3526_100%)] ${index === 1 ? "h-[7.4rem]" : "h-[5.2rem]"}`}
                  src={photo}
                />
              </div>
            </button>
            <button className="absolute -left-2 -top-6" onClick={() => galleryInputRefs.current[index]?.click()} type="button">
              <ClipButtonImage />
            </button>
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                readFile(event.target.files?.[0] ?? null, (value) => {
                  props.setPhotoState((previous) => ({
                    ...previous,
                    gallery: previous.gallery.map((item, itemIndex) => (itemIndex === index ? value : item)),
                  }));
                });
              }}
              ref={(node) => {
                galleryInputRefs.current[index] = node;
              }}
              type="file"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-4">
      <div>
        <div className="text-[2rem] leading-tight">{label} - {value}</div>
      </div>
      <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" onClick={onEdit} type="button">
        <PencilIcon />
      </button>
    </div>
  );
}

function ProfileImage({ src, alt, className, fallbackClassName }: { src?: string | null; alt: string; className: string; fallbackClassName: string }) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(src) && !imageError;

  return showImage ? (
    <Image
      alt={alt}
      className={className}
      height={640}
      onError={() => setImageError(true)}
      src={src!}
      width={640}
    />
  ) : (
    <div className={fallbackClassName} />
  );
}

function ToolbarButtonImage({ src, alt, fallback }: { src: string; alt: string; fallback: React.ReactNode }) {
  const [imageError, setImageError] = useState(false);

  if (!imageError) {
    return (
      <Image
        alt={alt}
        className="h-full w-full object-cover"
        height={48}
        onError={() => setImageError(true)}
        src={src}
        width={48}
      />
    );
  }

  return fallback;
}

function ClipButtonImage() {
  return <ToolbarButtonImage alt="Clip" fallback={<PaperclipIcon />} src="/clip-button.png" />;
}

function GenderBadgeImage({ gender }: { gender: string }) {
  const normalized = normalize(gender);
  const src =
    normalized === "male" ? "/gender-male.png" :
    normalized === "female" ? "/gender-female.png" :
    normalized === "gay" ? "/gender-gay.png" :
    "/gender-lesbian.png";

  return (
    <ToolbarButtonImage
      alt={gender}
      fallback={<GenderFallbackIcon gender={gender} />}
      src={src}
    />
  );
}

function GenderFallbackIcon({ gender }: { gender: string }) {
  const normalized = normalize(gender);

  if (normalized === "male") {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="15" r="5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 11 20 4m-5 0h5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (normalized === "female") {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 14v7m-3-3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (normalized === "gay") {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="15" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.7 12.3 20 3m-5 0h5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 14v6m-3-3h6M16 14v6m-3-3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function MessageBubble({ content }: { content: string }) {
  const media = decodeMediaMessage(content);

  if (!media) return <>{content}</>;

  if (media.type === "image") {
    return (
      <a className="block" download={media.name} href={media.dataUrl} target="_blank" rel="noreferrer">
        <Image alt={media.name} className="h-auto max-h-64 w-full rounded-[1rem] object-cover" height={360} src={media.dataUrl} width={360} />
        <div className="mt-2 text-xs text-stone-500">Tap to open or save</div>
      </a>
    );
  }

  if (media.type === "audio") {
    return (
      <div className="space-y-2">
        <audio className="w-full" controls src={media.dataUrl} />
        <div className="text-xs text-stone-500">{media.durationSeconds ? `${media.durationSeconds}s voice note` : media.name}</div>
      </div>
    );
  }

  return (
    <a className="underline decoration-stone-400 underline-offset-4" download={media.name} href={media.dataUrl} target="_blank" rel="noreferrer">
      Download {media.name}
    </a>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m4 20 4.4-1 9.9-9.9a1.8 1.8 0 0 0 0-2.6l-.8-.8a1.8 1.8 0 0 0-2.6 0L5 15.6 4 20Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="m13.5 7.5 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4 20.5c1.7-3.5 4.4-5.2 8-5.2s6.3 1.7 8 5.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8A2.5 2.5 0 0 1 16.5 16H11l-4.5 4v-4H7.5A2.5 2.5 0 0 1 5 13.5v-8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="M8 8h8M8 11.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path d="m12 3.6 2.5 5 5.5.8-4 3.9.9 5.4L12 16l-4.9 2.7.9-5.4-4-3.9 5.5-.8 2.5-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function HeartOutlineIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 20.2 4.7 13A4.8 4.8 0 0 1 11.5 6l.5.5.5-.5A4.8 4.8 0 1 1 19.3 13L12 20.2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.2 19.5c2-.5 4-1.7 5.6-3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function HeartFillIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" fill="none" viewBox="0 0 24 24">
      <path d="M12 20.4 4.6 12.9A4.9 4.9 0 0 1 11.6 6l.4.5.4-.5a4.9 4.9 0 1 1 7 6.9L12 20.4Z" fill="#ff5a61" stroke="#ff5a61" strokeWidth="1.2" />
      <circle cx="16.9" cy="8.5" r="1.1" fill="#ffb0b5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" fill="none" viewBox="0 0 24 24">
      <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg aria-hidden="true" className="h-10 w-10" fill="none" viewBox="0 0 24 24">
      <path d="m8 12.5 6.3-6.3a3.4 3.4 0 1 1 4.8 4.8l-8.4 8.4a5 5 0 0 1-7.1-7.1l8.2-8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <rect height="9" rx="3.5" stroke="currentColor" strokeWidth="1.9" width="7" x="8.5" y="4" />
      <path d="M6.5 11.5a5.5 5.5 0 1 0 11 0M12 17v3M9 20h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M4 19 20 12 4 5l2.8 7L4 19Z" fill="currentColor" />
      <path d="M6.8 12H20" stroke="#f9f4ed" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}
function formatFeet(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}"`;
}

function normalize(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

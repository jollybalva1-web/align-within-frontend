"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ENDPOINT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// --- COLOR PALETTE ---
const COLORS = {
  gold: "#C9A84C",
  goldLight: "#E8D5A0",
  goldSubtle: "#F5EDD6",
  cream: "#FDF8EF",
  creamDark: "#F5EDDF",
  warmWhite: "#FFFCF7",
  charcoal: "#2C2C2C",
  charcoalLight: "#4A4A4A",
  warmGray: "#7A7167",
  warmGrayLight: "#B5ADA3",
  warmGraySubtle: "#E8E2DA",
  earth: "#8B7355",
  earthLight: "#A99478",
  sage: "#7A8B6F",
  sageLight: "#9BAD8E",
  terracotta: "#C17F59",
  deepBrown: "#3D2B1F",
  red: "#B85450",
  amber: "#C9A84C",
  green: "#7A8B6F",
};

const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Sans 3', 'Segoe UI', sans-serif",
};

/** ====== BACKEND POST (no-cors to avoid preflight) ====== **/
async function postToBackend(payload) {
  if (!ENDPOINT_URL) return;
  try {
    await fetch(ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // silent fail for UX; backend can still work for most users
  }
}

/** ====== ASSESSMENT DATA ====== **/
const QUESTIONS = [
  // Insight (Q2-Q7)
  { id: "Q2", text: "I can usually explain the real reason behind my reactions.", construct: "insight", reverse: false },
  { id: "Q3", text: "When I feel stuck, I can name what's causing it — like fear, clashing priorities, or not knowing enough.", construct: "insight", reverse: false },
  { id: "Q4", text: "I notice repeating decision habits in my choices.", construct: "insight", reverse: false },
  { id: "Q5", text: "I can separate what happened from what I'm telling myself it means.", construct: "insight", reverse: false },
  { id: "Q6", text: "I can name my common triggers — situations that reliably throw me off.", construct: "insight", reverse: false },
  { id: "Q7", text: "I can usually name the specific emotion I'm feeling, not just \"bad\" or \"stressed.\"", construct: "insight", reverse: false },

  // Clarity (Q8-Q11)
  { id: "Q8", text: "My strengths and weaknesses feel clear to me.", construct: "clarity", reverse: false },
  { id: "Q9", text: "My values are clear enough to guide decisions.", construct: "clarity", reverse: false },
  { id: "Q10", text: "I know which environments bring out my best vs my worst.", construct: "clarity", reverse: false },
  { id: "Q11", text: "My sense of who I am shifts a lot depending on who I'm with.", construct: "clarity", reverse: true },

  // Learning (Q12-Q16)
  { id: "Q12", text: "After big moments, I reflect and adjust how I act next time.", construct: "learning", reverse: false },
  { id: "Q13", text: "I can take lessons from mistakes without beating myself up.", construct: "learning", reverse: false },
  { id: "Q14", text: "I repeat the same mistakes even after I've understood them.", construct: "learning", reverse: true },
  { id: "Q15", text: "I can predict situations where I'm likely to make a decision I regret.", construct: "learning", reverse: false },
  { id: "Q16", text: "I avoid looking closely at my role in recurring problems.", construct: "learning", reverse: true },

  // Boundaries (Q17-Q20)
  { id: "Q17", text: "I often say yes even when I want to say no.", construct: "boundaries", reverse: false },
  { id: "Q18", text: "I feel responsible for other people's comfort.", construct: "boundaries", reverse: false },
  { id: "Q19", text: "I state my needs early rather than hoping they'll be noticed.", construct: "boundaries", reverse: true },
  { id: "Q20", text: "I put off hard conversations even when waiting makes things worse.", construct: "boundaries", reverse: false },

  // Reactivity (Q21-Q23)
  { id: "Q21", text: "My emotions can spike quickly when things feel uncertain.", construct: "reactivity", reverse: false },
  { id: "Q22", text: "When I'm emotional, it's hard to think clearly in the moment.", construct: "reactivity", reverse: false },
  { id: "Q23", text: "I return to baseline quickly after I'm upset.", construct: "reactivity", reverse: true },

  // Thinking Style (Q24-Q26)
  { id: "Q24", text: "I keep thinking or researching even when taking a small step would teach me more.", construct: "overthinking", reverse: false },
  { id: "Q25", text: "I sometimes act quickly and regret it later.", construct: "impulsivity", reverse: false },
  { id: "Q26", text: "I delay decisions hoping the situation will resolve itself.", construct: "avoidance", reverse: false },

  // Radar (Q27-Q29)
  { id: "Q27", text: "I usually notice when someone's tone or energy changes with me.", construct: "radar", reverse: false },
  { id: "Q28", text: "I can tell when something feels off in a relationship or group dynamic, even if it's subtle.", construct: "radar", reverse: false },
  { id: "Q29", text: "After an interaction, I often realize later that I missed cues in the moment.", construct: "radar", reverse: true },

  // Interpretation (Q30-Q32)
  { id: "Q30", text: "When something feels off, I consider several explanations instead of jumping to one.", construct: "interpretation", reverse: false },
  { id: "Q31", text: "If someone behaves strangely, I assume it's about me.", construct: "interpretation", reverse: true },
  { id: "Q32", text: "When I feel uncertain about someone's intent, I prefer to ask a clarifying question rather than guess.", construct: "interpretation", reverse: false },

  // Intent vs Impact (Q33)
  { id: "Q33", text: "I sometimes learn that my words or actions landed differently than I intended.", construct: "intent_impact", reverse: false },
];

const VIGNETTES = {
  career: {
    text: "In a meeting, your manager praises your work. A colleague who usually chats with you becomes quieter afterward and avoids eye contact.",
    prompt: "What's the most accurate observation?",
    options: [
      { label: "Nothing notable happened", correct: false },
      { label: "There was a shift in the colleague's behavior after the praise", correct: true },
      { label: "The manager is signaling you're being promoted", correct: false },
      { label: "The colleague is definitely jealous", correct: false },
    ],
  },
  relationships: {
    text: "Someone is warm in person, but over text they reply late and rarely initiate plans. When you suggest meeting, they say \"busy\" without offering alternatives.",
    prompt: "What's the most accurate observation?",
    options: [
      { label: "They're manipulating you", correct: false },
      { label: "They like you but are nervous", correct: false },
      { label: "The behavior is inconsistent: warmth in person, low initiative by text", correct: true },
      { label: "They're a bad person", correct: false },
    ],
  },
};

// Interpretations (no emojis)
const INTERPRETATIONS = {
  overall: {
    "Needs Attention": "You're still building a clear map of yourself. In high-stakes moments, it can be hard to tell what you want, what's true, and what's just noise.",
    "Developing": "You have a decent read on yourself, but clarity can blur under pressure. With a few upgrades, your decisions will feel cleaner and less draining.",
    "Strong": "You generally know what drives you. Your self-map is stable enough to guide choices, and you tend to learn and adjust over time.",
  },
  insight: {
    "Needs Attention": "You may struggle to explain why you react the way you do. Triggers and patterns aren't always visible to you yet.",
    "Developing": "You sometimes understand your reactions, but under pressure it gets foggy.",
    "Strong": "You can usually name what's driving your reactions — fear, values, uncertainty — and that helps you respond better.",
  },
  clarity: {
    "Needs Attention": "Your sense of self shifts depending on context or who you're with. Values and strengths may feel unclear.",
    "Developing": "You have a reasonable sense of who you are, but it can wobble under stress or social pressure.",
    "Strong": "Your values, strengths, and sense of identity are stable enough to guide decisions consistently.",
  },
  learning: {
    "Needs Attention": "You may repeat patterns even after recognizing them. Reflecting on mistakes can feel difficult or painful.",
    "Developing": "You learn from some experiences but not others. Patterns sometimes repeat.",
    "Strong": "You reflect after key moments and adjust. You can learn from mistakes without excessive self-criticism.",
  },
  boundaries: {
    "Needs Attention": "You tend to say yes when you mean no, feel responsible for others' comfort, and avoid difficult conversations until things build up.",
    "Developing": "Boundaries slip under pressure. You sometimes over-give or delay hard conversations.",
    "Strong": "You protect your needs and can say no. You may want to check that warmth and flexibility are still present.",
  },
  reactivity: {
    "Needs Attention": "Uncertainty spikes your emotions quickly. It's hard to think clearly when activated, and returning to baseline takes time.",
    "Developing": "You feel things but can usually manage. Under high stress, emotions may take over temporarily.",
    "Strong": "You stay steady under uncertainty. Emotions don't hijack your thinking. Watch for under-feeling or emotional avoidance.",
  },
  overthinking: {
    "Needs Attention": "You research and ruminate instead of taking small steps. Analysis becomes a way to avoid action.",
    "Developing": "You balance thinking and doing, though you can get stuck sometimes.",
    "Strong": "You act without excessive analysis. Make sure you're not skipping important reflection.",
  },
  impulsivity: {
    "Needs Attention": "You often act quickly and regret it later. Slowing down before decisions would help.",
    "Developing": "Sometimes you act fast and regret it, but not consistently.",
    "Strong": "You rarely act without thinking. Decisions are considered.",
  },
  avoidance: {
    "Needs Attention": "You tend to delay decisions, hoping the situation will sort itself out. It usually doesn't.",
    "Developing": "You sometimes delay hoping things resolve themselves.",
    "Strong": "You face decisions rather than postponing them.",
  },
  radar: {
    "Needs Attention": "You may miss subtle shifts in tone, energy, or group dynamics — especially under pressure.",
    "Developing": "You catch some signals but miss others, particularly when stressed or distracted.",
    "Strong": "You notice when something feels \"off\" in interactions, even if it's subtle. You pick up on shifts in tone and energy.",
  },
  interpretation: {
    "Needs Attention": "You tend to lock onto one explanation quickly — often \"it's about me\" — without considering alternatives.",
    "Developing": "You sometimes jump to conclusions but can course-correct when prompted.",
    "Strong": "You hold multiple possible explanations and prefer to ask clarifying questions rather than assume.",
  },
  intent_impact: {
    "Needs Attention": "You may be unaware when your words or actions land differently than intended. Blind spots here can strain relationships.",
    "Developing": "You sometimes notice gaps between what you meant and how it landed.",
    "Strong": "You're generally aware that intent and impact don't always match, which helps you communicate and repair better.",
  },
};

const MICRO_TOOLS = {
  insight: {
    "Needs Attention": "After your next strong reaction, write: \"I felt ___ because ___\". No judging. Just naming.",
    "Developing": "When you notice a familiar frustration, ask: \"Have I felt this before in a similar situation?\"",
    "Strong": "Use your awareness to catch reactions earlier — before they drive decisions.",
  },
  clarity: {
    "Needs Attention": "Write your top 3 values. Next week, check if your decisions reflected them.",
    "Developing": "Notice when your sense of self shifts around certain people. What are you adjusting, and why?",
    "Strong": "Test your self-knowledge in unfamiliar situations. That's where real clarity shows up.",
  },
  learning: {
    "Needs Attention": "After a mistake, write one thing you'd do differently — then stop. No spiraling.",
    "Developing": "Pick one recurring pattern this week. Before it happens, decide what you'll do differently.",
    "Strong": "Share what you've learned with someone. Teaching locks it in.",
  },
  boundaries: {
    "Needs Attention": "Next time you want to say no, say: \"Let me think about it\" first. Buy space.",
    "Developing": "Before a hard conversation, write your one non-negotiable. Hold it.",
    "Strong": "Check that flexibility and warmth are still present alongside firmness.",
  },
  reactivity: {
    "Needs Attention": "When emotions spike, name the feeling out loud. Naming slows the spiral.",
    "Developing": "Use a 90-second rule: when activated, wait 90 seconds before responding.",
    "Strong": "Make sure steadiness is not suppression. Feeling is allowed.",
  },
  overthinking: {
    "Needs Attention": "Set a 10-minute timer. Think/research until it rings — then take one small action.",
    "Developing": "Ask: \"What's the smallest step I could take right now?\" Then do it.",
    "Strong": "Balance action with brief reflection for high-stakes decisions.",
  },
  impulsivity: {
    "Needs Attention": "Before a big decision, write it down and wait 24 hours.",
    "Developing": "When you feel the urge to act fast, ask: \"What am I avoiding by rushing?\"",
    "Strong": "Your considered approach serves you well. Trust it.",
  },
  avoidance: {
    "Needs Attention": "Pick the smallest decision you've been postponing. Finish it today.",
    "Developing": "When you notice hope-based delay, write what you're avoiding.",
    "Strong": "You face things head-on. Also give yourself time to process before deciding.",
  },
  radar: {
    "Needs Attention": "In your next conversation, watch for tone shifts. Notice without reacting.",
    "Developing": "After a group interaction, note one signal you caught and one you might have missed.",
    "Strong": "Notice everything, but don't treat everything as a fire to put out.",
  },
  interpretation: {
    "Needs Attention": "Next time you assume intent, write two other plausible explanations.",
    "Developing": "Replace \"They did that because...\" with \"I wonder if...\"",
    "Strong": "Your multi-lens thinking is a strength. Use it to invite nuance.",
  },
  intent_impact: {
    "Needs Attention": "After an important conversation, ask: \"How did that land for you?\"",
    "Developing": "Before a high-stakes message, re-read as the receiver. What might they feel?",
    "Strong": "This awareness helps you repair fast. Keep checking in real time.",
  },
};

// scoring helpers
function reverseScore(val) { return 6 - val; }
function avgToHundred(values) {
  if (!values.length) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(((avg - 1) / 4) * 100);
}
const FLIPPED_CONSTRUCTS = ["boundaries", "reactivity", "overthinking", "impulsivity", "avoidance"];
function getLevel(score, construct) {
  if (FLIPPED_CONSTRUCTS.includes(construct)) {
    if (score >= 67) return "Needs Attention";
    if (score >= 34) return "Developing";
    return "Strong";
  }
  if (score >= 67) return "Strong";
  if (score >= 34) return "Developing";
  return "Needs Attention";
}
function computeScores(answers, vignetteCorrect) {
  const cleaned = QUESTIONS.map((q, i) => {
    const raw = answers[i];
    const v = q.reverse ? reverseScore(raw) : raw;
    return Number(v);
  });

  const pick = (construct) =>
    QUESTIONS.map((q, i) => ({ q, i }))
      .filter(x => x.q.construct === construct)
      .map(x => cleaned[x.i]);

  const insight = avgToHundred(pick("insight"));
  const clarity = avgToHundred(pick("clarity"));
  const learning = avgToHundred(pick("learning"));
  const overall = Math.round((insight + clarity + learning) / 3);

  const boundaries = avgToHundred(pick("boundaries"));
  const reactivity = avgToHundred(pick("reactivity"));
  const overthinking = avgToHundred(pick("overthinking"));
  const impulsivity = avgToHundred(pick("impulsivity"));
  const avoidance = avgToHundred(pick("avoidance"));

  const radarItems = avgToHundred(pick("radar"));
  const radar = Math.round(0.8 * radarItems + 0.2 * (vignetteCorrect ? 100 : 0));

  const interpretation = avgToHundred(pick("interpretation"));
  const intent_impact = avgToHundred(pick("intent_impact"));

  return {
    overall: { score: overall, level: getLevel(overall, "overall") },
    insight: { score: insight, level: getLevel(insight, "insight") },
    clarity: { score: clarity, level: getLevel(clarity, "clarity") },
    learning: { score: learning, level: getLevel(learning, "learning") },
    boundaries: { score: boundaries, level: getLevel(boundaries, "boundaries") },
    reactivity: { score: reactivity, level: getLevel(reactivity, "reactivity") },
    overthinking: { score: overthinking, level: getLevel(overthinking, "overthinking") },
    impulsivity: { score: impulsivity, level: getLevel(impulsivity, "impulsivity") },
    avoidance: { score: avoidance, level: getLevel(avoidance, "avoidance") },
    radar: { score: radar, level: getLevel(radar, "radar") },
    interpretation: { score: interpretation, level: getLevel(interpretation, "interpretation") },
    intent_impact: { score: intent_impact, level: getLevel(intent_impact, "intent_impact") },
  };
}

/** ====== UI COMPONENTS ====== **/
function LevelBadge({ level }) {
  const config = {
    "Needs Attention": { bg: "#FEF0EF", border: "#E8B4B1", text: COLORS.red },
    "Developing": { bg: "#FFF8E8", border: "#E8D5A0", text: COLORS.amber },
    "Strong": { bg: "#F0F5EE", border: "#B5CCAC", text: COLORS.sage },
  };
  const c = config[level] || config["Developing"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 14px", borderRadius: "20px",
      fontSize: "13px", fontWeight: 600,
      fontFamily: FONTS.body,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      letterSpacing: "0.02em",
    }}>
      {level}
    </span>
  );
}

function ScoreBar({ score, construct }) {
  const isFlipped = FLIPPED_CONSTRUCTS.includes(construct);
  let barColor;
  if (isFlipped) barColor = score >= 67 ? COLORS.red : score >= 34 ? COLORS.amber : COLORS.sage;
  else barColor = score >= 67 ? COLORS.sage : score >= 34 ? COLORS.amber : COLORS.red;

  return (
    <div style={{ width: "100%", height: "6px", background: COLORS.warmGraySubtle, borderRadius: "3px", overflow: "hidden" }}>
      <div style={{
        width: `${score}%`, height: "100%", background: barColor,
        borderRadius: "3px", transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }} />
    </div>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${FONTS.body}; background: ${COLORS.cream}; color: ${COLORS.charcoal}; -webkit-font-smoothing: antialiased; line-height: 1.6; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
  .fade-up { animation: fadeUp 0.7s ease-out forwards; }
  .fade-up-d1 { animation: fadeUp 0.7s ease-out 0.1s forwards; opacity: 0; }
  .fade-up-d2 { animation: fadeUp 0.7s ease-out 0.2s forwards; opacity: 0; }
  .fade-up-d3 { animation: fadeUp 0.7s ease-out 0.3s forwards; opacity: 0; }
  .fade-up-d4 { animation: fadeUp 0.7s ease-out 0.4s forwards; opacity: 0; }
  .fade-up-d5 { animation: fadeUp 0.7s ease-out 0.5s forwards; opacity: 0; }
  .fade-in { animation: fadeIn 0.5s ease-out forwards; }
  .scale-in { animation: scaleIn 0.5s ease-out forwards; }

  .btn-primary {
    background: ${COLORS.gold};
    color: ${COLORS.deepBrown};
    border: none;
    padding: 14px 36px;
    border-radius: 8px;
    font-family: ${FONTS.body};
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    letter-spacing: 0.02em;
  }
  .btn-primary:hover {
    background: ${COLORS.earth};
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-secondary {
    background: transparent;
    color: ${COLORS.charcoal};
    border: 1.5px solid ${COLORS.warmGrayLight};
    padding: 12px 28px;
    border-radius: 8px;
    font-family: ${FONTS.body};
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .btn-secondary:hover {
    border-color: ${COLORS.gold};
    color: ${COLORS.gold};
    background: ${COLORS.goldSubtle};
  }

  .card {
    background: white;
    border-radius: 12px;
    border: 1px solid ${COLORS.warmGraySubtle};
    padding: 28px;
    transition: all 0.2s ease;
  }
  .card-hover:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border-color: ${COLORS.goldLight};
  }

  input[type="email"], input[type="text"], textarea {
    font-family: ${FONTS.body};
    font-size: 15px;
    padding: 12px 16px;
    border: 1.5px solid ${COLORS.warmGraySubtle};
    border-radius: 8px;
    background: white;
    color: ${COLORS.charcoal};
    outline: none;
    transition: border-color 0.2s ease;
    width: 100%;
  }
  input[type="email"]:focus, input[type="text"]:focus, textarea:focus {
    border-color: ${COLORS.gold};
    box-shadow: 0 0 0 3px ${COLORS.goldSubtle};
  }
`;

/** ====== NAV + FOOTER ====== **/
function Nav({ page, setPage }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(253, 248, 239, 0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${COLORS.warmGraySubtle}`,
      padding: "0 24px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div
        onClick={() => setPage("landing")}
        style={{
          fontFamily: FONTS.display, fontSize: "20px", fontWeight: 600,
          color: COLORS.charcoal, cursor: "pointer",
        }}
      >
        Align Within
      </div>
      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <span onClick={() => setPage("landing")} style={{
          fontFamily: FONTS.body, fontSize: "14px", fontWeight: 500,
          color: page === "landing" ? COLORS.gold : COLORS.warmGray,
          cursor: "pointer",
        }}>Home</span>
        <button className="btn-primary" onClick={() => setPage("age-gate")} style={{ padding: "8px 20px", fontSize: "14px" }}>
          Take the Assessment
        </button>
      </div>
    </nav>
  );
}

function Footer({ setPage }) {
  return (
    <footer style={{
      background: COLORS.deepBrown, color: COLORS.warmGrayLight,
      padding: "48px 24px 32px", fontFamily: FONTS.body, fontSize: "14px",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: "32px", marginBottom: "32px"
        }}>
          <div>
            <div style={{ fontFamily: FONTS.display, fontSize: "18px", color: "white", marginBottom: "8px" }}>
              Align Within
            </div>
            <div style={{ maxWidth: "280px", lineHeight: 1.6 }}>Clear thinking starts within.</div>
          </div>

          <div style={{ display: "flex", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span onClick={() => setPage("privacy")} style={{ color: COLORS.warmGrayLight, cursor: "pointer" }}>Privacy Policy</span>
              <span onClick={() => setPage("terms")} style={{ color: COLORS.warmGrayLight, cursor: "pointer" }}>Terms of Use</span>
              <span onClick={() => setPage("contact")} style={{ color: COLORS.warmGrayLight, cursor: "pointer" }}>Contact</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.1)`,
          paddingTop: "20px", fontSize: "13px", color: COLORS.warmGray
        }}>
          © 2026 Align Within. This is a self-reflection tool, not a medical or psychological diagnosis.
        </div>
      </div>
    </footer>
  );
}

/** ====== PAGES ====== **/
function LandingPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream }}>
      <section style={{
        minHeight: "90vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "100px 24px 60px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          background: `radial-gradient(ellipse at 30% 20%, ${COLORS.gold} 0%, transparent 60%),
                       radial-gradient(ellipse at 70% 80%, ${COLORS.earth} 0%, transparent 60%)`,
        }} />

        <div className="fade-up" style={{ position: "relative", maxWidth: "640px" }}>
          <div style={{
            fontFamily: FONTS.body, fontSize: "13px", fontWeight: 600,
            color: COLORS.gold, letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            Self-Awareness Assessment
          </div>

          <div style={{ marginBottom: "28px" }}>
            <div style={{
              fontFamily: FONTS.display, fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 500,
              color: COLORS.charcoalLight, marginBottom: "4px",
            }}>
              Know your patterns.
            </div>
            <div className="fade-up-d1" style={{
              fontFamily: FONTS.display, fontSize: "clamp(28px, 4.5vw, 38px)", fontWeight: 600,
              color: COLORS.charcoal, marginBottom: "4px",
            }}>
              Choose wisely.
            </div>
            <div className="fade-up-d2" style={{
              fontFamily: FONTS.display, fontSize: "clamp(38px, 6vw, 56px)", fontWeight: 700,
              color: COLORS.gold, lineHeight: 1.1,
            }}>
              Align within.
            </div>
          </div>

          <p className="fade-up-d3" style={{
            fontFamily: FONTS.body, fontSize: "18px", lineHeight: 1.7,
            color: COLORS.charcoalLight, maxWidth: "480px", margin: "0 auto 40px",
          }}>
            An 8-minute assessment that maps how you make decisions, handle emotions, and read people — so you can stop repeating patterns and start choosing clearly.
          </p>

          <div className="fade-up-d4">
            <button className="btn-primary" onClick={() => setPage("age-gate")} style={{ fontSize: "17px", padding: "16px 44px" }}>
              Start the Assessment
            </button>
            <div style={{ marginTop: "16px", fontSize: "14px", color: COLORS.warmGray }}>
              Free · 8 minutes · No account needed
            </div>
          </div>
        </div>
      </section>

      <section style={{
        padding: "80px 24px", background: COLORS.warmWhite,
        borderTop: `1px solid ${COLORS.warmGraySubtle}`,
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "32px", fontWeight: 600,
            color: COLORS.charcoal, textAlign: "center", marginBottom: "12px",
          }}>What you'll discover</h2>
          <p style={{
            fontFamily: FONTS.body, fontSize: "17px", color: COLORS.warmGray,
            textAlign: "center", marginBottom: "48px", maxWidth: "520px", margin: "0 auto 48px",
          }}>
            Your results map across three pillars and nine lenses of self-awareness.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { title: "Insight", desc: "Can you name what drives your reactions?" },
              { title: "Clarity", desc: "Is your sense of self stable under pressure?" },
              { title: "Learning", desc: "Do you adjust after mistakes, or repeat them?" },
              { title: "Boundaries", desc: "Do you protect your needs or over-give?" },
              { title: "Reactivity", desc: "How quickly do emotions hijack your thinking?" },
              { title: "Thinking Style", desc: "Do you overthink, act impulsively, or avoid?" },
              { title: "Social Radar", desc: "Do you catch subtle shifts in people?" },
              { title: "Interpretation", desc: "Do you jump to conclusions or stay open?" },
              { title: "Intent vs Impact", desc: "Does what you mean match how you land?" },
            ].map((item, i) => (
              <div key={i} className="card card-hover" style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ fontFamily: FONTS.display, fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{item.title}</div>
                <div style={{ fontSize: "14px", color: COLORS.warmGray, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 24px", background: COLORS.cream }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "28px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "32px",
          }}>Built with care</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { title: "Private by default", text: "No account required. Data logs are tied to an anonymous session unless you submit an email." },
              { title: "Not a diagnosis", text: "A reflection tool to reduce spiraling and improve clarity." },
              { title: "Adults only", text: "Designed for ages 18 and older." },
              { title: "Practical and grounded", text: "Built to help you act with more clarity in real situations." },
            ].map((item, i) => (
              <div key={i} style={{
                background: COLORS.warmWhite, border: `1px solid ${COLORS.warmGraySubtle}`,
                borderRadius: "10px", padding: "20px", textAlign: "left",
              }}>
                <div style={{ fontFamily: FONTS.display, fontSize: "16px", fontWeight: 600, marginBottom: "6px", color: COLORS.charcoal }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "14px", color: COLORS.charcoalLight, lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{
        padding: "80px 24px", textAlign: "center",
        background: `linear-gradient(180deg, ${COLORS.cream} 0%, ${COLORS.goldSubtle} 100%)`,
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "32px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "8px",
          }}>Ready to see your patterns?</h2>
          <p style={{
            fontFamily: FONTS.display, fontSize: "20px", fontStyle: "italic",
            color: COLORS.gold, marginBottom: "32px",
          }}>
            Align within.
          </p>
          <button className="btn-primary" onClick={() => setPage("age-gate")} style={{ fontSize: "17px", padding: "16px 44px" }}>
            Start the Assessment
          </button>
        </div>
      </section>

      <Footer setPage={setPage} />
    </div>
  );
}

function AgeGate({ setPage, onConfirm }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "100px 24px 60px",
      background: COLORS.cream,
    }}>
      <div className="scale-in" style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: FONTS.display, fontSize: "28px", fontWeight: 600, marginBottom: "10px" }}>
          Before we start
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: "16px", color: COLORS.warmGray, marginBottom: "28px", lineHeight: 1.6 }}>
          This assessment is designed for adults aged 18+. It explores emotional patterns and decision-making habits.
        </p>
        <button
          className="btn-primary"
          onClick={onConfirm}
          style={{ width: "100%", marginBottom: "12px" }}
        >
          I confirm I'm 18 or older
        </button>
        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ width: "100%" }}>
          Go back
        </button>
        <p style={{ marginTop: "16px", fontSize: "13px", color: COLORS.warmGrayLight }}>
          By continuing, you agree to our{" "}
          <span onClick={() => setPage("terms")} style={{ color: COLORS.earth, cursor: "pointer", textDecoration: "underline" }}>Terms</span>{" "}
          and{" "}
          <span onClick={() => setPage("privacy")} style={{ color: COLORS.earth, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function AnchorPage({ setPage, setAnchor, onAnchorSelected }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "100px 24px 60px",
      background: COLORS.cream,
    }}>
      <div className="fade-up" style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{
          fontFamily: FONTS.body, fontSize: "13px", fontWeight: 600,
          color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: "16px",
        }}>Step 1 of 3</div>
        <h2 style={{
          fontFamily: FONTS.display, fontSize: "28px", fontWeight: 600,
          color: COLORS.charcoal, marginBottom: "12px",
        }}>Which area is most on your mind?</h2>
        <p style={{
          fontFamily: FONTS.body, fontSize: "16px", color: COLORS.warmGray,
          marginBottom: "36px",
        }}>
          This shapes the scenario you'll read first.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { key: "relationships", label: "Relationships", desc: "Personal connections, friendships, family" },
            { key: "career", label: "Career", desc: "Work, professional decisions, team dynamics" },
          ].map((opt) => (
            <div
              key={opt.key}
              onClick={() => {
                setAnchor(opt.key);
                onAnchorSelected(opt.label);
                setPage("vignette");
              }}
              className="card card-hover"
              style={{
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                padding: "20px 24px", textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: "17px", fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: "14px", color: COLORS.warmGray }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VignettePage({ anchor, setPage, setVignetteCorrect, setVignetteAnswer, onVignetteAnswered }) {
  const [selected, setSelected] = useState(null);
  const vignette = VIGNETTES[anchor];

  const handleNext = () => {
    const correct = vignette.options[selected].correct;
    const ans = vignette.options[selected].label;
    setVignetteCorrect(correct);
    setVignetteAnswer(ans);
    onVignetteAnswered(ans, correct);
    setPage("assessment");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "100px 24px 60px",
      background: COLORS.cream,
    }}>
      <div className="fade-up" style={{ maxWidth: "560px", width: "100%" }}>
        <div style={{
          fontFamily: FONTS.body, fontSize: "13px", fontWeight: 600,
          color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: "16px", textAlign: "center",
        }}>Step 2 of 3 · Scenario</div>

        <div className="card" style={{ marginBottom: "28px" }}>
          <p style={{
            fontFamily: FONTS.body, fontSize: "17px", lineHeight: 1.7,
            color: COLORS.charcoal, fontStyle: "italic",
          }}>
            "{vignette.text}"
          </p>
        </div>

        <h3 style={{
          fontFamily: FONTS.display, fontSize: "20px", fontWeight: 600,
          color: COLORS.charcoal, marginBottom: "16px",
        }}>{vignette.prompt}</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {vignette.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: "16px 20px", borderRadius: "10px", cursor: "pointer",
                background: selected === i ? COLORS.goldSubtle : "white",
                border: `1.5px solid ${selected === i ? COLORS.gold : COLORS.warmGraySubtle}`,
                fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoal,
                transition: "all 0.2s ease", lineHeight: 1.5,
              }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "24px", height: "24px", borderRadius: "50%", marginRight: "12px",
                border: `2px solid ${selected === i ? COLORS.gold : COLORS.warmGrayLight}`,
                background: selected === i ? COLORS.gold : "transparent",
                fontSize: "12px", color: "white", fontWeight: 700,
                transition: "all 0.2s ease", verticalAlign: "middle",
              }}>
                {selected === i ? "✓" : ""}
              </span>
              {opt.label}
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={handleNext} disabled={selected === null} style={{ width: "100%" }}>
          Continue
        </button>
      </div>
    </div>
  );
}

function AssessmentPage({ setPage, setAnswers, onAnswerClick }) {
  const [responses, setResponses] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  const total = QUESTIONS.length;
  const progress = (Object.keys(responses).length / total) * 100;

  const handleSelect = (qIndex, value) => {
    setResponses((prev) => ({ ...prev, [qIndex]: value }));
    onAnswerClick(QUESTIONS[qIndex].text, value);

    if (qIndex < total - 1) setTimeout(() => setCurrentQ(qIndex + 1), 250);
  };

  const handleSubmit = () => {
    const answersArray = QUESTIONS.map((_, i) => responses[i]);
    setAnswers(answersArray);
    setPage("results");
  };

  const allAnswered = Object.keys(responses).length === total;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px", paddingBottom: "60px" }}>
      <div style={{
        position: "fixed", top: "60px", left: 0, right: 0, zIndex: 50,
        height: "3px", background: COLORS.warmGraySubtle,
      }}>
        <div style={{
          height: "100%", background: COLORS.gold,
          width: `${progress}%`, transition: "width 0.4s ease",
        }} />
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 24px" }}>
        <div style={{
          fontFamily: FONTS.body, fontSize: "13px", fontWeight: 600,
          color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: "8px", textAlign: "center",
        }}>Step 3 of 3 · Assessment</div>

        <div style={{
          fontFamily: FONTS.body, fontSize: "14px", color: COLORS.warmGray,
          textAlign: "center", marginBottom: "36px",
        }}>
          {Object.keys(responses).length} of {total} answered
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              className="card"
              style={{
                opacity: i <= currentQ || responses[i] !== undefined ? 1 : 0.5,
                transition: "opacity 0.3s ease",
                borderColor: responses[i] !== undefined ? COLORS.goldLight : COLORS.warmGraySubtle,
              }}
            >
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <span style={{
                  fontFamily: FONTS.body, fontSize: "13px", fontWeight: 700,
                  color: COLORS.gold, minWidth: "32px",
                }}>{i + 1}.</span>
                <p style={{
                  fontFamily: FONTS.body, fontSize: "16px", color: COLORS.charcoal,
                  lineHeight: 1.6,
                }}>{q.text}</p>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <div
                    key={val}
                    onClick={() => handleSelect(i, val)}
                    style={{
                      width: "56px", textAlign: "center", padding: "10px 4px",
                      borderRadius: "8px",
                      background: responses[i] === val ? COLORS.gold : COLORS.warmWhite,
                      color: responses[i] === val ? "white" : COLORS.charcoalLight,
                      border: `1.5px solid ${responses[i] === val ? COLORS.gold : COLORS.warmGraySubtle}`,
                      fontSize: "15px", fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {val}
                    <div style={{
                      fontSize: "9px", fontWeight: 400, marginTop: "2px",
                      color: responses[i] === val ? "rgba(255,255,255,0.8)" : COLORS.warmGrayLight,
                      lineHeight: 1.2,
                    }}>
                      {labels[val - 1].split(" ").map((w, wi) => <span key={wi}>{w}<br /></span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={!allAnswered} style={{ fontSize: "17px", padding: "16px 48px" }}>
            See My Results
          </button>
          {!allAnswered && (
            <div style={{ marginTop: "12px", fontSize: "14px", color: COLORS.warmGray }}>
              Answer all {total} questions to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsPage({ scores, setPage, submissionData, onFeedback, onComplete }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(null);

  const CONSTRUCT_LABELS = {
    overall: "Overall Self-Awareness",
    insight: "Insight",
    clarity: "Self-Concept Clarity",
    learning: "Integrative Learning",
    boundaries: "Boundaries",
    reactivity: "Reactivity",
    overthinking: "Overthinking",
    impulsivity: "Impulsivity",
    avoidance: "Decision Avoidance",
    radar: "Social Radar",
    interpretation: "Social Interpretation",
    intent_impact: "Intent vs Impact",
  };

  const pillars = ["insight", "clarity", "learning"];
  const lenses = ["boundaries", "reactivity", "overthinking", "impulsivity", "avoidance", "radar", "interpretation", "intent_impact"];

  const allConstructs = [...pillars, ...lenses];
  const strengths = allConstructs.filter((c) => scores[c].level === "Strong").slice(0, 3);
  const needsWork = allConstructs.filter((c) => scores[c].level === "Needs Attention").slice(0, 3);

  const handleFinalSubmit = async () => {
    if (!email.includes("@")) return;
    setSubmitting(true);

    await onComplete({
      email,
      feedbackRating,
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 24px 60px" }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            fontFamily: FONTS.body, fontSize: "13px", fontWeight: 600,
            color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase",
            marginBottom: "12px",
          }}>Your Results</div>

          <h1 style={{
            fontFamily: FONTS.display, fontSize: "36px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "8px",
          }}>Your Clarity Map</h1>

          <p style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.warmGray }}>
            This is a reflection tool, not a diagnosis.
          </p>
        </div>

        <div className="fade-up-d1 card" style={{
          padding: "32px", marginBottom: "24px", textAlign: "center",
          background: `linear-gradient(135deg, white 0%, ${COLORS.goldSubtle} 100%)`,
          borderColor: COLORS.goldLight,
        }}>
          <div style={{ fontFamily: FONTS.body, fontSize: "14px", fontWeight: 600, color: COLORS.gold, marginBottom: "8px" }}>
            OVERALL SELF-AWARENESS
          </div>

          <div style={{
            fontFamily: FONTS.display, fontSize: "56px", fontWeight: 700,
            color: COLORS.charcoal, lineHeight: 1, marginBottom: "8px",
          }}>
            {scores.overall.score}
          </div>

          <LevelBadge level={scores.overall.level} />

          <p style={{
            fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoalLight,
            marginTop: "16px", lineHeight: 1.6, maxWidth: "440px", margin: "16px auto 0",
          }}>
            {INTERPRETATIONS.overall[scores.overall.level]}
          </p>
        </div>

        {(strengths.length > 0 || needsWork.length > 0) && (
          <div className="fade-up-d2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {strengths.length > 0 && (
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.sage, marginBottom: "10px" }}>
                  Strengths
                </div>
                {strengths.map((c) => (
                  <div key={c} style={{ fontSize: "14px", color: COLORS.charcoal, marginBottom: "4px" }}>
                    {CONSTRUCT_LABELS[c]}
                  </div>
                ))}
              </div>
            )}
            {needsWork.length > 0 && (
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.red, marginBottom: "10px" }}>
                  Focus Areas
                </div>
                {needsWork.map((c) => (
                  <div key={c} style={{ fontSize: "14px", color: COLORS.charcoal, marginBottom: "4px" }}>
                    {CONSTRUCT_LABELS[c]}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="fade-up-d3">
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "24px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "16px",
          }}>Your Three Pillars</h2>

          {pillars.map((key) => (
            <div key={key} className="card" style={{ marginBottom: "16px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontFamily: FONTS.display, fontSize: "17px", fontWeight: 600, color: COLORS.charcoal }}>
                  {CONSTRUCT_LABELS[key]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: "20px", fontWeight: 700, color: COLORS.charcoal }}>
                    {scores[key].score}
                  </span>
                  <LevelBadge level={scores[key].level} />
                </div>
              </div>
              <ScoreBar score={scores[key].score} construct={key} />
              <p style={{ fontFamily: FONTS.body, fontSize: "14px", color: COLORS.charcoalLight, marginTop: "12px", lineHeight: 1.6 }}>
                {INTERPRETATIONS[key][scores[key].level]}
              </p>
              <div style={{
                marginTop: "12px", padding: "12px 16px", borderRadius: "8px",
                background: COLORS.goldSubtle, border: `1px solid ${COLORS.goldLight}`,
                fontSize: "13px", color: COLORS.earth, lineHeight: 1.5,
              }}>
                Tip: {MICRO_TOOLS[key][scores[key].level]}
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up-d4" style={{ marginTop: "32px" }}>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "24px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "16px",
          }}>Your Decision Habits</h2>

          {lenses.map((key) => (
            <div key={key} className="card" style={{ marginBottom: "16px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontFamily: FONTS.display, fontSize: "17px", fontWeight: 600, color: COLORS.charcoal }}>
                  {CONSTRUCT_LABELS[key]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: "20px", fontWeight: 700, color: COLORS.charcoal }}>
                    {scores[key].score}
                  </span>
                  <LevelBadge level={scores[key].level} />
                </div>
              </div>

              <ScoreBar score={scores[key].score} construct={key} />

              <p style={{ fontFamily: FONTS.body, fontSize: "14px", color: COLORS.charcoalLight, marginTop: "12px", lineHeight: 1.6 }}>
                {INTERPRETATIONS[key][scores[key].level]}
              </p>

              {key === "intent_impact" && (
                <p style={{ fontFamily: FONTS.body, fontSize: "12px", color: COLORS.warmGrayLight, marginTop: "6px", fontStyle: "italic" }}>
                  Note: This is based on a single item.
                </p>
              )}

              <div style={{
                marginTop: "12px", padding: "12px 16px", borderRadius: "8px",
                background: COLORS.goldSubtle, border: `1px solid ${COLORS.goldLight}`,
                fontSize: "13px", color: COLORS.earth, lineHeight: 1.5,
              }}>
                Tip: {MICRO_TOOLS[key][scores[key].level]}
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up-d5" style={{ marginTop: "40px" }}>
          <div className="card" style={{ padding: "28px", textAlign: "center" }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: "20px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "12px" }}>
              How accurate did this feel?
            </h3>

            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  onClick={() => {
                    setFeedbackRating(n);
                    onFeedback(n);
                  }}
                  style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: "18px", fontWeight: 600,
                    background: feedbackRating === n ? COLORS.gold : COLORS.warmWhite,
                    color: feedbackRating === n ? "white" : COLORS.charcoalLight,
                    border: `2px solid ${feedbackRating === n ? COLORS.gold : COLORS.warmGraySubtle}`,
                    transition: "all 0.2s ease",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: COLORS.warmGrayLight, maxWidth: "260px", margin: "0 auto" }}>
              <span>Way off</span><span>Spot on</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <div className="card" style={{
            padding: "32px", textAlign: "center",
            background: `linear-gradient(135deg, white 0%, ${COLORS.goldSubtle} 100%)`,
            borderColor: COLORS.goldLight,
          }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: "22px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
              Want your results by email?
            </h3>
            <p style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoalLight, marginBottom: "24px", lineHeight: 1.6 }}>
              Enter your email and we’ll send your results and next steps. Your responses are already logged to the sheet under an anonymous session id.
            </p>

            {!submitted ? (
              <div>
                <div style={{ display: "flex", gap: "8px", maxWidth: "400px", margin: "0 auto" }}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1 }} />
                  <button className="btn-primary" onClick={handleFinalSubmit} disabled={!email.includes("@") || submitting} style={{ whiteSpace: "nowrap" }}>
                    {submitting ? "Sending..." : "Send my results"}
                  </button>
                </div>
                <p style={{ marginTop: "10px", fontSize: "12px", color: COLORS.warmGrayLight }}>
                  Reply to the email with a 1–5 accuracy rating to help us refine this.
                </p>
              </div>
            ) : (
              <div style={{ padding: "16px", background: COLORS.goldSubtle, borderRadius: "8px" }}>
                <p style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.earth, fontWeight: 600 }}>
                  Done. Please check your inbox.
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button className="btn-secondary" onClick={() => setPage("landing")}>Back to Home</button>
        </div>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}

function PrivacyPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "32px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: COLORS.warmGray, marginBottom: "32px" }}>Last updated: February 2026</p>

        <div style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoalLight, lineHeight: 1.8 }}>
          <p style={{ marginBottom: "20px" }}>
            Align Within is a self-reflection tool. We collect minimal data.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            What we collect
          </h3>
          <p style={{ marginBottom: "12px" }}>
            <strong>Assessment responses:</strong> Your clicks can be logged to a spreadsheet under an anonymous session id to support scoring and improvement.
          </p>
          <p style={{ marginBottom: "20px" }}>
            <strong>Email (optional):</strong> If you submit your email, we use it to send your results and follow-up updates.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Contact
          </h3>
          <p style={{ marginBottom: "20px" }}>
            For privacy requests, email us at {CONFIG?.ADMIN_EMAIL || "jollybalva1@gmail.com"}.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ marginTop: "20px" }}>
          Back to Home
        </button>
      </div>
      <Footer setPage={setPage} />
    </div>
  );
}

function TermsPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "32px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
          Terms of Use
        </h1>
        <p style={{ fontSize: "14px", color: COLORS.warmGray, marginBottom: "32px" }}>Last updated: February 2026</p>

        <div style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoalLight, lineHeight: 1.8 }}>
          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
            What this is
          </h3>
          <p style={{ marginBottom: "20px" }}>
            Align Within is a self-reflection tool. It is not therapy, counseling, medical advice, or psychological diagnosis.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
            Adults only
          </h3>
          <p style={{ marginBottom: "20px" }}>
            This tool is intended for adults aged 18 and older.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
            No medical advice
          </h3>
          <p style={{ marginBottom: "20px" }}>
            If you are in crisis, contact local emergency services or a qualified professional.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ marginTop: "20px" }}>
          Back to Home
        </button>
      </div>
      <Footer setPage={setPage} />
    </div>
  );
}

function ContactPage({ setPage, onContactSend }) {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleContactSubmit = async () => {
    if (!contactEmail.includes("@") || !message) return;
    await onContactSend({ name, email: contactEmail, message });
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "32px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px" }}>
          Contact Us
        </h1>
        <p style={{ fontFamily: FONTS.body, fontSize: "16px", color: COLORS.warmGray, marginBottom: "32px" }}>
          Questions, feedback, or data deletion requests — we're here.
        </p>

        {!sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: COLORS.charcoal, marginBottom: "6px", display: "block" }}>
                Name
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>

            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: COLORS.charcoal, marginBottom: "6px", display: "block" }}>
                Email
              </label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="your@email.com" />
            </div>

            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: COLORS.charcoal, marginBottom: "6px", display: "block" }}>
                Message
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="How can we help?" style={{ resize: "vertical" }} />
            </div>

            <button className="btn-primary" onClick={handleContactSubmit} disabled={!contactEmail.includes("@") || !message} style={{ marginTop: "8px" }}>
              Send Message
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontFamily: FONTS.body, fontSize: "16px", color: COLORS.charcoal }}>
              Message sent. We'll get back to you soon.
            </p>
          </div>
        )}

        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ marginTop: "24px" }}>
          Back to Home
        </button>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}

/** ====== MAIN APP ====== **/
export default function AlignWithin() {
  const [page, setPage] = useState("landing");
  const [anchor, setAnchor] = useState(null);
  const [vignetteCorrect, setVignetteCorrect] = useState(false);
  const [vignetteAnswer, setVignetteAnswer] = useState("");
  const [answers, setAnswers] = useState(null);
  const [scores, setScores] = useState(null);

  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "server";
    const key = "aw_session_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const id = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : String(Date.now()) + "-" + String(Math.random()).slice(2);

    window.localStorage.setItem(key, id);
    return id;
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (answers) {
      const computed = computeScores(answers, vignetteCorrect);
      setScores(computed);
    }
  }, [answers, vignetteCorrect]);

  const pageSetterWithReset = useCallback((newPage) => setPage(newPage), []);

  const onConfirmAge = async () => {
    await postToBackend({ type: "session_start", sessionId, ageConfirmed: true });
    pageSetterWithReset("anchor");
  };

  const onAnchorSelected = async (label) => {
    await postToBackend({ type: "session_update", sessionId, context: label });
  };

  const onVignetteAnswered = async (answerLabel, correct) => {
    await postToBackend({
      type: "session_update",
      sessionId,
      context: anchor === "career" ? "Career" : "Relationships",
      vignetteAnswer: answerLabel,
      vignetteCorrect: !!correct,
    });
  };

  const onAnswerClick = async (questionText, value) => {
    await postToBackend({
      type: "session_update",
      sessionId,
      questionText,
      value,
    });
  };

  const onFeedback = async (rating) => {
    await postToBackend({
      type: "session_update",
      sessionId,
      feedbackRating: rating,
    });
  };

  const onComplete = async ({ email, feedbackRating }) => {
    await postToBackend({
      type: "assessment_complete",
      sessionId,
      ageConfirmed: true,
      context: anchor === "career" ? "Career" : "Relationships",
      vignetteAnswer,
      vignetteCorrect,
      answers,
      feedbackRating: feedbackRating ?? "",
      email,
    });
  };

  const onContactSend = async ({ name, email, message }) => {
    await postToBackend({ type: "contact", name, email, message });
  };

  const submissionData = {
    context: anchor,
    vignetteAnswer,
    vignetteCorrect,
    answers,
    scores,
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <Nav page={page} setPage={pageSetterWithReset} />

      {page === "landing" && <LandingPage setPage={pageSetterWithReset} />}

      {page === "age-gate" && <AgeGate setPage={pageSetterWithReset} onConfirm={onConfirmAge} />}

      {page === "anchor" && (
        <AnchorPage
          setPage={pageSetterWithReset}
          setAnchor={setAnchor}
          onAnchorSelected={onAnchorSelected}
        />
      )}

      {page === "vignette" && (
        <VignettePage
          anchor={anchor}
          setPage={pageSetterWithReset}
          setVignetteCorrect={setVignetteCorrect}
          setVignetteAnswer={setVignetteAnswer}
          onVignetteAnswered={onVignetteAnswered}
        />
      )}

      {page === "assessment" && (
        <AssessmentPage
          setPage={pageSetterWithReset}
          setAnswers={setAnswers}
          onAnswerClick={onAnswerClick}
        />
      )}

      {page === "results" && scores && (
        <ResultsPage
          scores={scores}
          setPage={pageSetterWithReset}
          submissionData={submissionData}
          onFeedback={onFeedback}
          onComplete={onComplete}
        />
      )}

      {page === "privacy" && <PrivacyPage setPage={pageSetterWithReset} />}
      {page === "terms" && <TermsPage setPage={pageSetterWithReset} />}
      {page === "contact" && <ContactPage setPage={pageSetterWithReset} onContactSend={onContactSend} />}
    </div>
  );
}

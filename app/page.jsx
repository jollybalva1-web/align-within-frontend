
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// --- CONNECTION ---
// This pulls the URL from your .env.local file
const ENDPOINT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// ═══════════════════════════════════════════════════════════
// ALIGN WITHIN — MVP Website
// Complete self-awareness assessment with scoring + results
// ═══════════════════════════════════════════════════════════

// ── COLOR PALETTE ──
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

// ... rest of your component (export default function Page() { ... })
// ── FONT IMPORTS (loaded via style tag) ──
const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Sans 3', 'Segoe UI', sans-serif",
};

// ── ASSESSMENT DATA ──
const QUESTIONS = [
  // Pillar 1: Insight (Q2-Q7, indices 0-5)
  { id: "Q2", text: "I can usually explain the real reason behind my reactions.", construct: "insight", reverse: false },
  { id: "Q3", text: "When I feel stuck, I can name what's causing it — like fear, clashing priorities, or not knowing enough.", construct: "insight", reverse: false },
  { id: "Q4", text: "I notice repeating decision habits in my choices.", construct: "insight", reverse: false },
  { id: "Q5", text: "I can separate what happened from what I'm telling myself it means.", construct: "insight", reverse: false },
  { id: "Q6", text: "I can name my common triggers — situations that reliably throw me off.", construct: "insight", reverse: false },
  { id: "Q7", text: 'I can usually name the specific emotion I\'m feeling, not just "bad" or "stressed."', construct: "insight", reverse: false },

  // Pillar 2: Self-Concept Clarity (Q8-Q11, indices 6-9)
  { id: "Q8", text: "My strengths and weaknesses feel clear to me.", construct: "clarity", reverse: false },
  { id: "Q9", text: "My values are clear enough to guide decisions.", construct: "clarity", reverse: false },
  { id: "Q10", text: "I know which environments bring out my best vs my worst.", construct: "clarity", reverse: false },
  { id: "Q11", text: "My sense of who I am shifts a lot depending on who I'm with.", construct: "clarity", reverse: true },

  // Pillar 3: Integrative Learning (Q12-Q16, indices 10-14)
  { id: "Q12", text: "After big moments, I reflect and adjust how I act next time.", construct: "learning", reverse: false },
  { id: "Q13", text: "I can take lessons from mistakes without beating myself up.", construct: "learning", reverse: false },
  { id: "Q14", text: "I repeat the same mistakes even after I've understood them.", construct: "learning", reverse: true },
  { id: "Q15", text: "I can predict situations where I'm likely to make a decision I regret.", construct: "learning", reverse: false },
  { id: "Q16", text: "I avoid looking closely at my role in recurring problems.", construct: "learning", reverse: true },

  // Lens A: Boundaries (Q17-Q20, indices 15-18)
  { id: "Q17", text: "I often say yes even when I want to say no.", construct: "boundaries", reverse: false },
  { id: "Q18", text: "I feel responsible for other people's comfort.", construct: "boundaries", reverse: false },
  { id: "Q19", text: "I state my needs early rather than hoping they'll be noticed.", construct: "boundaries", reverse: true },
  { id: "Q20", text: "I put off hard conversations even when waiting makes things worse.", construct: "boundaries", reverse: false },

  // Lens B: Reactivity (Q21-Q23, indices 19-21)
  { id: "Q21", text: "My emotions can spike quickly when things feel uncertain.", construct: "reactivity", reverse: false },
  { id: "Q22", text: "When I'm emotional, it's hard to think clearly in the moment.", construct: "reactivity", reverse: false },
  { id: "Q23", text: "I return to baseline quickly after I'm upset.", construct: "reactivity", reverse: true },

  // Lens C: Thinking Style (Q24-Q26, indices 22-24)
  { id: "Q24", text: "I keep thinking or researching even when taking a small step would teach me more.", construct: "overthinking", reverse: false },
  { id: "Q25", text: "I sometimes act quickly and regret it later.", construct: "impulsivity", reverse: false },
  { id: "Q26", text: "I delay decisions hoping the situation will resolve itself.", construct: "avoidance", reverse: false },

  // Lens D: Social Awareness - Radar (Q27-Q29, indices 25-27)
  { id: "Q27", text: "I usually notice when someone's tone or energy changes with me.", construct: "radar", reverse: false },
  { id: "Q28", text: 'I can tell when something feels "off" in a relationship or group dynamic, even if it\'s subtle.', construct: "radar", reverse: false },
  { id: "Q29", text: "After an interaction, I often realize later that I missed cues in the moment.", construct: "radar", reverse: true },

  // Lens D: Social Awareness - Interpretation (Q30-Q32, indices 28-30)
  { id: "Q30", text: "When something feels off, I consider several explanations instead of jumping to one.", construct: "interpretation", reverse: false },
  { id: "Q31", text: "If someone behaves strangely, I assume it's about me.", construct: "interpretation", reverse: true },
  { id: "Q32", text: "When I feel uncertain about someone's intent, I prefer to ask a clarifying question rather than guess.", construct: "interpretation", reverse: false },

  // Intent vs Impact (Q33, index 31)
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

// ── INTERPRETATION COPY ──
// Using updated level labels: Needs Attention / Developing / Strong
// For "flipped" constructs (boundaries, reactivity, overthinking, impulsivity, avoidance):
//   High score = Needs Attention (the pattern is strong/problematic)
//   Low score = Strong (less of this pattern = healthier)
// For normal constructs (insight, clarity, learning, radar, interpretation, intent_impact):
//   High score = Strong
//   Low score = Needs Attention

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

// Micro-tools placeholder copy per construct
const MICRO_TOOLS = {
  insight: {
    "Needs Attention": "Try this: After your next strong reaction, pause and write down \"I felt ___ because ___\". Don't judge it. Just name it.",
    "Developing": "Try this: When you notice a familiar frustration, ask \"Have I felt this before in a similar situation?\" Start connecting dots.",
    "Strong": "Keep going: Use your awareness to catch reactions earlier — before they drive decisions.",
  },
  clarity: {
    "Needs Attention": "Try this: Write down 3 things you value most. Next week, check — did your decisions reflect them?",
    "Developing": "Try this: Notice when your sense of self shifts around certain people. What are you adjusting, and why?",
    "Strong": "Keep going: Test your self-knowledge in unfamiliar situations. That's where real clarity shows up.",
  },
  learning: {
    "Needs Attention": "Try this: After a mistake, write one thing you'd do differently — then stop. No spiraling.",
    "Developing": "Try this: Pick one recurring pattern this week. Before it happens, decide what you'll do differently.",
    "Strong": "Keep going: Share what you've learned with someone. Teaching it locks it in.",
  },
  boundaries: {
    "Needs Attention": "Try this: Next time you want to say no, say \"Let me think about it\" first. Buy yourself space.",
    "Developing": "Try this: Before your next hard conversation, write down your one non-negotiable. Hold it.",
    "Strong": "Keep going: Check in — are you leaving room for others' needs too? Firm doesn't mean rigid.",
  },
  reactivity: {
    "Needs Attention": "Try this: When emotions spike, name the feeling out loud. \"I'm feeling anxious.\" Naming it slows the spiral.",
    "Developing": "Try this: Create a 90-second rule — when activated, wait 90 seconds before responding.",
    "Strong": "Keep going: Make sure you're not suppressing emotions. Steady is good; numb isn't.",
  },
  overthinking: {
    "Needs Attention": "Try this: Set a timer for 10 minutes. Research or think until it rings — then take one small action.",
    "Developing": "Try this: Ask yourself \"What's the smallest step I could take right now?\" Then do it.",
    "Strong": "Keep going: Balance action with brief reflection. Quick decisions benefit from a moment's pause.",
  },
  impulsivity: {
    "Needs Attention": "Try this: Before your next big decision, write it down and wait 24 hours. See if you still want it.",
    "Developing": "Try this: Notice the urge to act fast. Ask \"What am I avoiding by rushing?\"",
    "Strong": "Keep going: Your considered approach serves you well. Trust it.",
  },
  avoidance: {
    "Needs Attention": "Try this: Pick the smallest decision you've been postponing. Make it today. Done beats perfect.",
    "Developing": "Try this: When you catch yourself hoping a situation resolves itself, write down what you're avoiding.",
    "Strong": "Keep going: You face things head-on. Make sure you're also giving yourself time to process before deciding.",
  },
  radar: {
    "Needs Attention": "Try this: In your next conversation, watch for one thing — tone shifts. Just notice, don't react.",
    "Developing": "Try this: After your next group interaction, recall one signal you caught and one you might have missed.",
    "Strong": "Keep going: Use your radar wisely. Noticing everything doesn't mean reacting to everything.",
  },
  interpretation: {
    "Needs Attention": "Try this: Next time you assume someone's intent, write down 2 other possible explanations.",
    "Developing": "Try this: Replace \"They did that because...\" with \"I wonder if...\" — keep it open.",
    "Strong": "Keep going: Your multi-lens thinking is a strength. Use it to help others see nuance too.",
  },
  intent_impact: {
    "Needs Attention": "Try this: After an important conversation, ask one trusted person \"How did that land?\"",
    "Developing": "Try this: Before a high-stakes message, re-read it as if you're the receiver. What might they feel?",
    "Strong": "Keep going: This awareness helps you repair fast. Keep checking intent vs impact in real-time.",
  },
};

// ── SCORING ENGINE ──
function reverseScore(val) {
  return 6 - val;
}

function avgToHundred(values) {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(((avg - 1) / 4) * 100);
}

// For flipped constructs, direction reversal in level assignment
const FLIPPED_CONSTRUCTS = ["boundaries", "reactivity", "overthinking", "impulsivity", "avoidance"];

function getLevel(score, construct) {
  // For flipped constructs: high score = Needs Attention
  if (FLIPPED_CONSTRUCTS.includes(construct)) {
    if (score >= 67) return "Needs Attention";
    if (score >= 34) return "Developing";
    return "Strong";
  }
  // Normal: high score = Strong
  if (score >= 67) return "Strong";
  if (score >= 34) return "Developing";
  return "Needs Attention";
}

function computeScores(answers, vignetteCorrect) {
  const getScores = (construct) =>
    QUESTIONS.filter((q) => q.construct === construct).map((q, i) => {
      const idx = QUESTIONS.indexOf(q);
      const raw = answers[idx];
      return q.reverse ? reverseScore(raw) : raw;
    });

  const insightScores = getScores("insight");
  const clarityScores = getScores("clarity");
  const learningScores = getScores("learning");
  const boundariesScores = getScores("boundaries");
  const reactivityScores = getScores("reactivity");
  const overthinkingScores = getScores("overthinking");
  const impulsivityScores = getScores("impulsivity");
  const avoidanceScores = getScores("avoidance");
  const radarItemScores = getScores("radar");
  const interpretationScores = getScores("interpretation");
  const intentImpactScores = getScores("intent_impact");

  const insightScore = avgToHundred(insightScores);
  const clarityScore = avgToHundred(clarityScores);
  const learningScore = avgToHundred(learningScores);
  const overallScore = Math.round((insightScore + clarityScore + learningScore) / 3);

  const radarItemAvg = avgToHundred(radarItemScores);
  const radarCheck = vignetteCorrect ? 100 : 0;
  const radarScore = Math.round(0.8 * radarItemAvg + 0.2 * radarCheck);

  const scores = {
    overall: { score: overallScore, level: getLevel(overallScore, "overall") },
    insight: { score: insightScore, level: getLevel(insightScore, "insight") },
    clarity: { score: clarityScore, level: getLevel(clarityScore, "clarity") },
    learning: { score: learningScore, level: getLevel(learningScore, "learning") },
    boundaries: { score: avgToHundred(boundariesScores), level: getLevel(avgToHundred(boundariesScores), "boundaries") },
    reactivity: { score: avgToHundred(reactivityScores), level: getLevel(avgToHundred(reactivityScores), "reactivity") },
    overthinking: { score: avgToHundred(overthinkingScores), level: getLevel(avgToHundred(overthinkingScores), "overthinking") },
    impulsivity: { score: avgToHundred(impulsivityScores), level: getLevel(avgToHundred(impulsivityScores), "impulsivity") },
    avoidance: { score: avgToHundred(avoidanceScores), level: getLevel(avgToHundred(avoidanceScores), "avoidance") },
    radar: { score: radarScore, level: getLevel(radarScore, "radar") },
    interpretation: { score: avgToHundred(interpretationScores), level: getLevel(avgToHundred(interpretationScores), "interpretation") },
    intent_impact: { score: avgToHundred(intentImpactScores), level: getLevel(avgToHundred(intentImpactScores), "intent_impact") },
  };

  return scores;
}

// ── LEVEL BADGE COMPONENT ──
function LevelBadge({ level }) {
  const config = {
    "Needs Attention": { bg: "#FEF0EF", border: "#E8B4B1", text: COLORS.red, icon: "◆" },
    "Developing": { bg: "#FFF8E8", border: "#E8D5A0", text: COLORS.amber, icon: "◈" },
    "Strong": { bg: "#F0F5EE", border: "#B5CCAC", text: COLORS.sage, icon: "●" },
  };
  const c = config[level] || config["Developing"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
      fontFamily: FONTS.body, background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      letterSpacing: "0.02em",
    }}>
      <span style={{ fontSize: "8px" }}>{c.icon}</span> {level}
    </span>
  );
}

// ── SCORE BAR ──
function ScoreBar({ score, construct }) {
  const isFlipped = FLIPPED_CONSTRUCTS.includes(construct);
  // For flipped: lower bar = better. Color: green when low, red when high
  // For normal: higher bar = better. Color: green when high, red when low
  let barColor;
  if (isFlipped) {
    barColor = score >= 67 ? COLORS.red : score >= 34 ? COLORS.amber : COLORS.sage;
  } else {
    barColor = score >= 67 ? COLORS.sage : score >= 34 ? COLORS.amber : COLORS.red;
  }

  return (
    <div style={{ width: "100%", height: "6px", background: COLORS.warmGraySubtle, borderRadius: "3px", overflow: "hidden" }}>
      <div style={{
        width: `${score}%`, height: "100%", background: barColor,
        borderRadius: "3px", transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }} />
    </div>
  );
}

// ── GLOBAL STYLES ──
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: ${FONTS.body};
    background: ${COLORS.cream};
    color: ${COLORS.charcoal};
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
  }
  
  ::selection {
    background: ${COLORS.goldLight};
    color: ${COLORS.deepBrown};
  }
  
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  
  .fade-up { animation: fadeUp 0.7s ease-out forwards; }
  .fade-up-d1 { animation: fadeUp 0.7s ease-out 0.1s forwards; opacity: 0; }
  .fade-up-d2 { animation: fadeUp 0.7s ease-out 0.2s forwards; opacity: 0; }
  .fade-up-d3 { animation: fadeUp 0.7s ease-out 0.3s forwards; opacity: 0; }
  .fade-up-d4 { animation: fadeUp 0.7s ease-out 0.4s forwards; opacity: 0; }
  .fade-up-d5 { animation: fadeUp 0.7s ease-out 0.5s forwards; opacity: 0; }
  .fade-in { animation: fadeIn 0.5s ease-out forwards; }
  .scale-in { animation: scaleIn 0.5s ease-out forwards; }
  
  .likert-option {
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }
  .likert-option:hover {
    transform: translateY(-2px);
  }
  
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
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
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
  
  a {
    color: ${COLORS.earth};
    text-decoration: underline;
    text-decoration-color: ${COLORS.goldLight};
    text-underline-offset: 3px;
    transition: all 0.2s ease;
  }
  a:hover {
    color: ${COLORS.gold};
    text-decoration-color: ${COLORS.gold};
  }
`;

// ═══════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════

// ── NAVIGATION ──
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
          color: COLORS.charcoal, cursor: "pointer", letterSpacing: "-0.01em",
        }}
      >
        Align Within
      </div>
      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <span onClick={() => setPage("landing")} style={{
          fontFamily: FONTS.body, fontSize: "14px", fontWeight: 500,
          color: page === "landing" ? COLORS.gold : COLORS.warmGray,
          cursor: "pointer", transition: "color 0.2s",
        }}>Home</span>
        <button className="btn-primary" onClick={() => setPage("age-gate")} style={{
          padding: "8px 20px", fontSize: "14px",
        }}>Take the Assessment</button>
      </div>
    </nav>
  );
}

// ── FOOTER ──
function Footer({ setPage }) {
  return (
    <footer style={{
      background: COLORS.deepBrown, color: COLORS.warmGrayLight,
      padding: "48px 24px 32px", fontFamily: FONTS.body, fontSize: "14px",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "32px" }}>
          <div>
            <div style={{ fontFamily: FONTS.display, fontSize: "18px", color: "white", marginBottom: "8px" }}>Align Within</div>
            <div style={{ maxWidth: "280px", lineHeight: 1.6 }}>Clear thinking starts within.</div>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span onClick={() => setPage("privacy")} style={{ color: COLORS.warmGrayLight, cursor: "pointer", textDecoration: "none" }}>Privacy Policy</span>
              <span onClick={() => setPage("terms")} style={{ color: COLORS.warmGrayLight, cursor: "pointer", textDecoration: "none" }}>Terms of Use</span>
              <span onClick={() => setPage("contact")} style={{ color: COLORS.warmGrayLight, cursor: "pointer", textDecoration: "none" }}>Contact</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: "20px", fontSize: "13px", color: COLORS.warmGray }}>
          © 2026 Align Within. This is a self-reflection tool, not a medical or psychological diagnosis.
        </div>
      </div>
    </footer>
  );
}

// ── LANDING PAGE ──
function LandingPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream }}>
      {/* Hero */}
      <section style={{
        minHeight: "90vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "100px 24px 60px", position: "relative", overflow: "hidden",
      }}>
        {/* Subtle background texture */}
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
            <div className="fade-up" style={{
              fontFamily: FONTS.display, fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 500,
              color: COLORS.charcoalLight, marginBottom: "4px", letterSpacing: "-0.01em",
            }}>
              Know your patterns.
            </div>
            <div className="fade-up-d1" style={{
              fontFamily: FONTS.display, fontSize: "clamp(28px, 4.5vw, 38px)", fontWeight: 600,
              color: COLORS.charcoal, marginBottom: "4px", letterSpacing: "-0.02em",
            }}>
              Choose wisely.
            </div>
            <div className="fade-up-d2" style={{
              fontFamily: FONTS.display, fontSize: "clamp(38px, 6vw, 56px)", fontWeight: 700,
              color: COLORS.gold, letterSpacing: "-0.02em", lineHeight: 1.1,
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

      {/* What You'll Learn */}
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
            textAlign: "center", marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px",
          }}>
            Your results map across three pillars and nine lenses of self-awareness.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { title: "Insight", desc: "Can you name what drives your reactions?", icon: "◐" },
              { title: "Clarity", desc: "Is your sense of self stable under pressure?", icon: "◑" },
              { title: "Learning", desc: "Do you adjust after mistakes, or repeat them?", icon: "◒" },
              { title: "Boundaries", desc: "Do you protect your needs or over-give?", icon: "◓" },
              { title: "Reactivity", desc: "How quickly do emotions hijack your thinking?", icon: "◔" },
              { title: "Thinking Style", desc: "Do you overthink, act impulsively, or avoid?", icon: "◕" },
              { title: "Social Radar", desc: "Do you catch subtle shifts in people?", icon: "◖" },
              { title: "Interpretation", desc: "Do you jump to conclusions or stay open?", icon: "◗" },
              { title: "Intent vs Impact", desc: "Does what you mean match how you land?", icon: "◉" },
            ].map((item, i) => (
              <div key={i} className="card card-hover" style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", color: COLORS.gold, marginBottom: "12px" }}>{item.icon}</div>
                <div style={{ fontFamily: FONTS.display, fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{item.title}</div>
                <div style={{ fontSize: "14px", color: COLORS.warmGray, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ padding: "64px 24px", background: COLORS.cream }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: "28px", fontWeight: 600,
            color: COLORS.charcoal, marginBottom: "32px",
          }}>Built with care</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { icon: "🔒", text: "Private by default. No accounts, no tracking." },
              { icon: "⚖️", text: "Not a diagnosis. A reflection tool." },
              { icon: "🔞", text: "Designed for adults (18+)." },
              { icon: "🧭", text: "Built to reduce spiraling and improve clarity." },
            ].map((item, i) => (
              <div key={i} style={{
                background: COLORS.warmWhite, border: `1px solid ${COLORS.warmGraySubtle}`,
                borderRadius: "10px", padding: "20px", textAlign: "left",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontSize: "14px", color: COLORS.charcoalLight, lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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

// ── AGE GATE ──
function AgeGate({ setPage }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "100px 24px 60px",
      background: COLORS.cream,
    }}>
      <div className="scale-in" style={{
        maxWidth: "420px", width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔞</div>
        <h2 style={{
          fontFamily: FONTS.display, fontSize: "26px", fontWeight: 600,
          color: COLORS.charcoal, marginBottom: "12px",
        }}>Before we start</h2>
        <p style={{
          fontFamily: FONTS.body, fontSize: "16px", color: COLORS.warmGray,
          marginBottom: "32px", lineHeight: 1.6,
        }}>
          This assessment is designed for adults. It explores emotional patterns and decision-making habits that are most relevant to people 18 and older.
        </p>
        <button className="btn-primary" onClick={() => setPage("anchor")} style={{ width: "100%", marginBottom: "12px" }}>
          I confirm I'm 18 or older
        </button>
        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ width: "100%" }}>
          Go back
        </button>
        <p style={{ marginTop: "16px", fontSize: "13px", color: COLORS.warmGrayLight }}>
          Not intended for minors. By continuing, you agree to our{" "}
          <span onClick={() => setPage("terms")} style={{ color: COLORS.earth, cursor: "pointer", textDecoration: "underline" }}>Terms</span> and{" "}
          <span onClick={() => setPage("privacy")} style={{ color: COLORS.earth, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

// ── ANCHOR SELECTION ──
function AnchorPage({ setPage, setAnchor }) {
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
        }}>What's most on your mind?</h2>
        <p style={{
          fontFamily: FONTS.body, fontSize: "16px", color: COLORS.warmGray,
          marginBottom: "36px",
        }}>
          This shapes the scenario you'll read first. Pick what feels most relevant right now.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { key: "relationships", label: "Relationships", desc: "Personal connections, friendships, family", icon: "💬" },
            { key: "career", label: "Career", desc: "Work, professional decisions, team dynamics", icon: "💼" },
          ].map((opt) => (
            <div
              key={opt.key}
              onClick={() => { setAnchor(opt.key); setPage("vignette"); }}
              className="card card-hover"
              style={{
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                padding: "20px 24px", textAlign: "left",
              }}
            >
              <div style={{ fontSize: "28px" }}>{opt.icon}</div>
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

// ── VIGNETTE ──
function VignettePage({ anchor, setPage, setVignetteCorrect, setVignetteAnswer }) {
  const [selected, setSelected] = useState(null);
  const vignette = VIGNETTES[anchor];

  const handleNext = () => {
    setVignetteCorrect(vignette.options[selected].correct);
    setVignetteAnswer(vignette.options[selected].label);
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
                {selected === i && "✓"}
              </span>
              {opt.label}
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={selected === null}
          style={{ width: "100%" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ── ASSESSMENT (LIKERT QUESTIONS) ──
function AssessmentPage({ setPage, setAnswers }) {
  const [responses, setResponses] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const containerRef = useRef(null);

  const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  const total = QUESTIONS.length;
  const progress = (Object.keys(responses).length / total) * 100;

  const handleSelect = (qIndex, value) => {
    setResponses((prev) => ({ ...prev, [qIndex]: value }));
    // Auto-advance after short delay
    if (qIndex < total - 1) {
      setTimeout(() => setCurrentQ(qIndex + 1), 300);
    }
  };

  const handleSubmit = () => {
    const answersArray = QUESTIONS.map((_, i) => responses[i]);
    setAnswers(answersArray);
    setPage("results");
  };

  const allAnswered = Object.keys(responses).length === total;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px", paddingBottom: "60px" }}>
      {/* Progress bar */}
      <div style={{
        position: "fixed", top: "60px", left: 0, right: 0, zIndex: 50,
        height: "3px", background: COLORS.warmGraySubtle,
      }}>
        <div style={{
          height: "100%", background: COLORS.gold,
          width: `${progress}%`, transition: "width 0.4s ease",
        }} />
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 24px" }} ref={containerRef}>
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

        {/* Questions */}
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

              {/* Likert scale */}
              <div style={{
                display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap",
              }}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <div
                    key={val}
                    className="likert-option"
                    onClick={() => handleSelect(i, val)}
                    style={{
                      width: "56px", textAlign: "center", padding: "10px 4px",
                      borderRadius: "8px",
                      background: responses[i] === val ? COLORS.gold : COLORS.warmWhite,
                      color: responses[i] === val ? "white" : COLORS.charcoalLight,
                      border: `1.5px solid ${responses[i] === val ? COLORS.gold : COLORS.warmGraySubtle}`,
                      fontSize: "15px", fontWeight: 600,
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

        {/* Submit */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{ fontSize: "17px", padding: "16px 48px" }}
          >
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

// ── RESULTS PAGE ──
function ResultsPage({ scores, setPage, submissionData, endpointUrl }) {
  const [showWaitlist, setShowWaitlist] = useState(false);
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

  // Find top strengths and areas to work on
  const allConstructs = [...pillars, ...lenses];
  const strengths = allConstructs.filter((c) => scores[c].level === "Strong").slice(0, 3);
  const needsWork = allConstructs.filter((c) => scores[c].level === "Needs Attention").slice(0, 3);

  // UPDATED: Uses hidden form submission to bypass CORS
  const handleSubmit = () => {
    if (!email.includes("@")) return;
    
    setSubmitting(true);
    
    // Prepare payload
    const payload = {
      type: "assessment",
      name: "Anonymous",
      email: email,
      ageConfirmed: "Yes",
      context: submissionData.context,
      careerVignette: submissionData.context === "career" ? submissionData.vignetteAnswer : "",
      relationshipVignette: submissionData.context === "relationships" ? submissionData.vignetteAnswer : "",
      answers: submissionData.answers,
      feedbackRating: feedbackRating || "",
      confusing: "",
      whichUnclear: ""
    };
    
    // Use hidden form submission (bypasses CORS)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpointUrl;
    form.target = 'results_iframe';
    
    const payloadInput = document.createElement('input');
    payloadInput.type = 'hidden';
    payloadInput.name = 'payload';
    payloadInput.value = JSON.stringify(payload);
    form.appendChild(payloadInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    // Show success after delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px", paddingBottom: "0" }}>
      {/* Hidden iframe for form submission - ADDED FOR CORS FIX */}
      <iframe 
        name="results_iframe" 
        style={{ display: 'none' }} 
      />
      
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 24px 60px" }}>

        {/* Header */}
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
          <p style={{
            fontFamily: FONTS.body, fontSize: "15px", color: COLORS.warmGray,
          }}>This is a reflection tool, not a diagnosis. The goal is awareness — not a label.</p>
        </div>

        {/* Overall Score Card */}
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

        {/* Quick Summary: Strengths & Areas */}
        {(strengths.length > 0 || needsWork.length > 0) && (
          <div className="fade-up-d2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {strengths.length > 0 && (
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.sage, marginBottom: "10px", letterSpacing: "0.05em" }}>
                  ● STRENGTHS
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
                <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.red, marginBottom: "10px", letterSpacing: "0.05em" }}>
                  ◆ FOCUS AREAS
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

        {/* Pillars */}
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
              <p style={{
                fontFamily: FONTS.body, fontSize: "14px", color: COLORS.charcoalLight,
                marginTop: "12px", lineHeight: 1.6,
              }}>
                {INTERPRETATIONS[key][scores[key].level]}
              </p>
              {/* Micro-tool */}
              <div style={{
                marginTop: "12px", padding: "12px 16px", borderRadius: "8px",
                background: COLORS.goldSubtle, border: `1px solid ${COLORS.goldLight}`,
                fontSize: "13px", color: COLORS.earth, lineHeight: 1.5,
              }}>
                💡 {MICRO_TOOLS[key][scores[key].level]}
              </div>
            </div>
          ))}
        </div>

        {/* Decision Habits (Lenses) */}
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
              <p style={{
                fontFamily: FONTS.body, fontSize: "14px", color: COLORS.charcoalLight,
                marginTop: "12px", lineHeight: 1.6,
              }}>
                {INTERPRETATIONS[key][scores[key].level]}
              </p>
              {key === "intent_impact" && (
                <p style={{
                  fontFamily: FONTS.body, fontSize: "12px", color: COLORS.warmGrayLight,
                  marginTop: "6px", fontStyle: "italic",
                }}>
                  Note: This is based on a single item. It's one signal, not a full measure.
                </p>
              )}
              <div style={{
                marginTop: "12px", padding: "12px 16px", borderRadius: "8px",
                background: COLORS.goldSubtle, border: `1px solid ${COLORS.goldLight}`,
                fontSize: "13px", color: COLORS.earth, lineHeight: 1.5,
              }}>
                💡 {MICRO_TOOLS[key][scores[key].level]}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="fade-up-d5" style={{ marginTop: "40px" }}>
          <div className="card" style={{ padding: "28px", textAlign: "center" }}>
            <h3 style={{
              fontFamily: FONTS.display, fontSize: "20px", fontWeight: 600,
              color: COLORS.charcoal, marginBottom: "12px",
            }}>How accurate did this feel?</h3>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  onClick={() => setFeedbackRating(n)}
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
            {feedbackRating && (
              <p style={{ marginTop: "12px", fontSize: "14px", color: COLORS.sage }}>
                Thanks for the feedback! {feedbackRating >= 4 ? "Glad it resonated." : "We'll keep refining."}
              </p>
            )}
          </div>
        </div>

        {/* Next Steps CTA */}
        <div style={{ marginTop: "32px" }}>
          <div className="card" style={{
            padding: "32px", textAlign: "center",
            background: `linear-gradient(135deg, white 0%, ${COLORS.goldSubtle} 100%)`,
            borderColor: COLORS.goldLight,
          }}>
            <h3 style={{
              fontFamily: FONTS.display, fontSize: "22px", fontWeight: 600,
              color: COLORS.charcoal, marginBottom: "8px",
            }}>Want help working on these patterns?</h3>
            <p style={{
              fontFamily: FONTS.body, fontSize: "15px", color: COLORS.charcoalLight,
              marginBottom: "24px", lineHeight: 1.6,
            }}>
              I'm running small guided batches where I help you apply specific tools to your top focus areas. Enter your email and I'll send you your personalized next steps.
            </p>
            {!submitted ? (
              <div>
                <div style={{ display: "flex", gap: "8px", maxWidth: "400px", margin: "0 auto" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={handleSubmit} 
                    disabled={!email.includes("@") || submitting} 
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {submitting ? "Sending..." : "Send me next steps"}
                  </button>
                </div>
                <p style={{ marginTop: "10px", fontSize: "12px", color: COLORS.warmGrayLight }}>
                  I'll email you a personalized profile with tools matched to your results.
                </p>
              </div>
            ) : (
              <div style={{ padding: "16px", background: COLORS.goldSubtle, borderRadius: "8px" }}>
                <p style={{ fontFamily: FONTS.body, fontSize: "15px", color: COLORS.earth, fontWeight: 600 }}>
                  ✓ Got it! Check your inbox — I'll send your personalized next steps soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Retake */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button className="btn-secondary" onClick={() => setPage("landing")}>
            Back to Home
          </button>
        </div>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}


// ── PRIVACY POLICY ──
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
            Align Within ("we", "us") is a self-reflection tool. We take your privacy seriously and collect as little data as possible.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            What we collect
          </h3>
          <p style={{ marginBottom: "12px" }}>
            <strong>Assessment responses:</strong> Your answers are processed in your browser to generate your results. We do not store your individual answers linked to your identity.
          </p>
          <p style={{ marginBottom: "20px" }}>
            <strong>Email (optional):</strong> If you join the waitlist, we collect your email address solely to send early access updates. You can unsubscribe at any time.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            How we use your data
          </h3>
          <p style={{ marginBottom: "20px" }}>
            Email addresses are used only for product updates and early access notifications. We do not sell, rent, or share your data with third parties for marketing purposes.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Cookies
          </h3>
          <p style={{ marginBottom: "20px" }}>
            We do not use non-essential cookies or tracking pixels. If this changes in the future, we will ask for your consent before setting any non-essential cookies.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Your rights
          </h3>
          <p style={{ marginBottom: "20px" }}>
            You can request deletion of your email from our waitlist at any time. You can withdraw consent for data processing as easily as you gave it. To exercise any rights, contact us at jollybalva1@gmail.com.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Data security
          </h3>
          <p style={{ marginBottom: "20px" }}>
            We use reasonable security measures to protect any data we hold. Since we minimize what we collect, your exposure is limited by design.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Contact
          </h3>
          <p style={{ marginBottom: "20px" }}>
            For any privacy concerns or data deletion requests, email us at jollybalva1@gmail.com.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ marginTop: "20px" }}>
          ← Back to Home
        </button>
      </div>
      <Footer setPage={setPage} />
    </div>
  );
}

// ── TERMS OF USE ──
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
            Align Within is a self-reflection and self-awareness tool. It is not therapy, counseling, medical advice, or psychological diagnosis. The results are based on your self-reported responses and reflect tendencies and patterns — not clinical conditions.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Age requirement
          </h3>
          <p style={{ marginBottom: "20px" }}>
            This tool is intended for adults aged 18 and older. By using this site, you confirm that you are at least 18 years old. This tool is not intended for minors.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            No medical or professional advice
          </h3>
          <p style={{ marginBottom: "20px" }}>
            The assessment and its results do not replace professional mental health support. If you are experiencing a mental health crisis, please reach out to a qualified professional or emergency service. Results use language like "tendencies," "signals," and "may" — they are not verdicts.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Accuracy
          </h3>
          <p style={{ marginBottom: "20px" }}>
            This tool is in early development. Results are based on self-report and may not capture the full picture of your tendencies. We continuously improve the assessment based on user feedback and research.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Acceptable use
          </h3>
          <p style={{ marginBottom: "20px" }}>
            Do not use this tool to diagnose or assess others without their knowledge. Do not misrepresent your results as medical or clinical findings. Use this tool for personal reflection only.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Limitation of liability
          </h3>
          <p style={{ marginBottom: "20px" }}>
            Align Within is provided "as is" without warranties of any kind. We are not liable for decisions made based on assessment results.
          </p>

          <h3 style={{ fontFamily: FONTS.display, fontSize: "18px", fontWeight: 600, color: COLORS.charcoal, marginBottom: "8px", marginTop: "28px" }}>
            Contact
          </h3>
          <p style={{ marginBottom: "20px" }}>
            Questions about these terms? Email us at jollybalva1@gmail.com.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => setPage("landing")} style={{ marginTop: "20px" }}>
          ← Back to Home
        </button>
      </div>
      <Footer setPage={setPage} />
    </div>
  );
}

// ── CONTACT PAGE ──
function ContactPage({ setPage }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const iframeRef = useRef(null);

  const handleContactSubmit = () => {
    // ✅ Updates requested:
    // 1) Name is required before submit
    // 2) Order: Name -> Email -> Message
    // 3) Button label: "Send me next"
    if (!name.trim()) return;
    if (!contactEmail.includes("@") || !message) return;

    setSending(true);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = ENDPOINT_URL;
    form.target = "hidden_iframe";

    const payloadInput = document.createElement("input");
    payloadInput.type = "hidden";
    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify({
      type: "contact",
      name: name.trim(),
      email: contactEmail.trim(),
      message: message,
    });
    form.appendChild(payloadInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <iframe name="hidden_iframe" ref={iframeRef} style={{ display: "none" }} />

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1
          style={{
            fontFamily: FONTS.display,
            fontSize: "32px",
            fontWeight: 600,
            color: COLORS.charcoal,
            marginBottom: "8px",
          }}
        >
          Contact Us
        </h1>

        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: "16px",
            color: COLORS.warmGray,
            marginBottom: "32px",
          }}
        >
          Questions, feedback, or data deletion requests — we're here.
        </p>

        {!sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: COLORS.charcoal,
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: COLORS.charcoal,
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: COLORS.charcoal,
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="How can we help?"
                style={{ resize: "vertical" }}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleContactSubmit}
              disabled={!name.trim() || !contactEmail.includes("@") || !message || sending}
              style={{ marginTop: "8px" }}
            >
              {sending ? "Sending..." : "Send me next"}
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: "16px",
                color: COLORS.charcoal,
              }}
            >
              Message sent. We'll get back to you soon.
            </p>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => setPage("landing")}
          style={{ marginTop: "24px" }}
        >
          ← Back to Home
        </button>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESULTS PAGE — ADD NAME FIELD TO "SEND ME NEXT STEPS" BOX
// ═══════════════════════════════════════════════════════════
//
// Paste/merge this into your existing ResultsPage.
// Only the "Want help working on these patterns?" CTA block is new.

function ResultsPage({ scores, setPage, submissionData, endpointUrl }) {
  const [feedbackRating, setFeedbackRating] = useState(null);

  // ✅ NEW: name + email fields for the “next steps” box
  const [nextName, setNextName] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [nextSending, setNextSending] = useState(false);
  const [nextSent, setNextSent] = useState(false);
  const iframeRef = useRef(null);

  const handleSendNextSteps = () => {
    if (!nextName.trim()) return;
    if (!nextEmail.includes("@")) return;

    setNextSending(true);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = endpointUrl;
    form.target = "hidden_iframe";

    const payloadInput = document.createElement("input");
    payloadInput.type = "hidden";
    payloadInput.name = "payload";

    // ✅ IMPORTANT: send scores from the website so email matches website exactly
    payloadInput.value = JSON.stringify({
      type: "assessment",
      name: nextName.trim(),
      email: nextEmail.trim(),

      context: submissionData?.context || "",
      vignetteAnswer: submissionData?.vignetteAnswer || "",
      vignetteCorrect: !!submissionData?.vignetteCorrect,
      answers: submissionData?.answers || [],
      scores: submissionData?.scores || scores,

      // optional tag for debugging/analytics
      source: "results_next_steps",
      feedbackRating: feedbackRating || "",
    });

    form.appendChild(payloadInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setTimeout(() => {
      setNextSending(false);
      setNextSent(true);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingTop: "80px" }}>
      <iframe name="hidden_iframe" ref={iframeRef} style={{ display: "none" }} />

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 24px 80px" }}>
        {/* ... keep your existing results UI above ... */}

        {/* Example: your existing feedback rating section would set feedbackRating */}
        {/* (You already have this in your UI; keep yours) */}

        {/* ✅ UPDATED CTA: Name + Email + button */}
        <div
          className="card"
          style={{
            marginTop: "28px",
            padding: "32px 24px",
            border: `1px solid ${COLORS.softBorder || "#e8d8b8"}`,
            borderRadius: "18px",
            textAlign: "center",
            background: COLORS.cream,
          }}
        >
          <h2
            style={{
              fontFamily: FONTS.display,
              fontSize: "26px",
              fontWeight: 600,
              color: COLORS.charcoal,
              marginBottom: "10px",
            }}
          >
            Want help working on these patterns?
          </h2>

          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: "15px",
              color: COLORS.warmGray,
              marginBottom: "18px",
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            I'm running small guided batches where I help you apply specific tools to your top focus areas.
            Enter your name + email and I'll send you your personalized next steps.
          </p>

          {!nextSent ? (
            <>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={nextName}
                  onChange={(e) => setNextName(e.target.value)}
                  placeholder="Your name"
                  style={{ minWidth: "220px" }}
                />

                <input
                  type="email"
                  value={nextEmail}
                  onChange={(e) => setNextEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ minWidth: "240px" }}
                />

                <button
                  className="btn-primary"
                  onClick={handleSendNextSteps}
                  disabled={!nextName.trim() || !nextEmail.includes("@") || nextSending}
                >
                  {nextSending ? "Sending..." : "Send me next steps"}
                </button>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontFamily: FONTS.body,
                  fontSize: "13px",
                  color: COLORS.warmGray,
                }}
              >
                I'll email you a personalized profile with tools matched to your results.
              </div>
            </>
          ) : (
            <div style={{ fontFamily: FONTS.body, color: COLORS.charcoal, marginTop: "10px" }}>
              ✓ Sent. Check your inbox.
            </div>
          )}
        </div>

        <button
          className="btn-secondary"
          onClick={() => setPage("landing")}
          style={{ marginTop: "24px" }}
        >
          Back to Home
        </button>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function AlignWithin() {
  const [page, setPage] = useState("landing");
  const [anchor, setAnchor] = useState(null);
  const [vignetteCorrect, setVignetteCorrect] = useState(false);
  const [vignetteAnswer, setVignetteAnswer] = useState("");
  const [answers, setAnswers] = useState(null);
  const [scores, setScores] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (answers) {
      const computed = computeScores(answers, vignetteCorrect);
      setScores(computed);
    }
  }, [answers, vignetteCorrect]);

  const pageSetterWithReset = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const submissionData = {
    context: anchor,
    vignetteAnswer: vignetteAnswer,
    vignetteCorrect: vignetteCorrect,
    answers: answers,
    scores: scores,
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <Nav page={page} setPage={pageSetterWithReset} />

      {page === "landing" && <LandingPage setPage={pageSetterWithReset} />}
      {page === "age-gate" && <AgeGate setPage={pageSetterWithReset} />}
      {page === "anchor" && <AnchorPage setPage={pageSetterWithReset} setAnchor={setAnchor} />}
      {page === "vignette" && (
        <VignettePage
          anchor={anchor}
          setPage={pageSetterWithReset}
          setVignetteCorrect={setVignetteCorrect}
          setVignetteAnswer={setVignetteAnswer}
        />
      )}
      {page === "assessment" && <AssessmentPage setPage={pageSetterWithReset} setAnswers={setAnswers} />}
      {page === "results" && scores && (
        <ResultsPage
          scores={scores}
          setPage={pageSetterWithReset}
          submissionData={submissionData}
          endpointUrl={ENDPOINT_URL}
        />
      )}
      {page === "privacy" && <PrivacyPage setPage={pageSetterWithReset} />}
      {page === "terms" && <TermsPage setPage={pageSetterWithReset} />}
      {page === "contact" && <ContactPage setPage={pageSetterWithReset} />}
    </div>
  );
}

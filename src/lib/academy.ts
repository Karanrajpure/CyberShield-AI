export type QuizQuestion = { prompt: string; options: string[]; correct: number; explanation: string };
export type Lesson = { id: string; title: string; category: string; minutes: number; summary: string; sections: { title: string; text: string }[]; quiz: QuizQuestion[] };
export const LESSONS: Lesson[] = [
  { id: "basics", title: "Your first line of defence", category: "Cybersecurity basics", minutes: 4, summary: "Small habits that protect your everyday digital life.", sections: [
    { title: "Protect what matters", text: "Your email often controls password resets for other accounts. Give it a unique password and two-factor authentication. Keep backups of important files separate from your device." },
    { title: "Pause before acting", text: "Unexpected messages, downloads and payment requests deserve a second look. Verify through an official app or a contact you already know. Security reduces risk; no tool guarantees complete protection." },
  ], quiz: [
    { prompt: "Why is your email account especially important?", options: ["It controls many account password resets", "It cannot be hacked", "It needs no updates"], correct: 0, explanation: "Someone with your email may reset passwords for other accounts. Protect it with a unique password and 2FA." },
    { prompt: "What is a useful backup habit?", options: ["Keep the only copy on your phone", "Keep a separate backup of important files", "Share all files publicly"], correct: 1, explanation: "A separate backup helps you recover after device loss or ransomware. Test that you can restore it." },
  ] },
  { id: "phishing", title: "Spot the bait", category: "Phishing awareness", minutes: 5, summary: "Recognise urgency, impersonation and suspicious requests.", sections: [
    { title: "Look past the logo", text: "Scammers copy logos and sender names. Pressure to act immediately, unexpected attachments and requests for passwords or codes are warning signs. A familiar logo does not prove authenticity." },
    { title: "Verify independently", text: "Open the service's official app or type its known address instead of following a message link. Call the company using a number from a trusted source, not the message. If you clicked, stop entering information and change exposed credentials through the official service." },
  ], quiz: [
    { prompt: "A message says your bank account closes in ten minutes. What next?", options: ["Send your OTP", "Open its link immediately", "Check through your bank's official app"], correct: 2, explanation: "Urgency is a common phishing tactic. Verify through a channel independent of the message." },
    { prompt: "Does a familiar sender name prove a message is genuine?", options: ["No, names can be impersonated", "Yes, always", "Only when there is a logo"], correct: 0, explanation: "Sender names and logos are easily copied. Check the actual address and verify unusual requests separately." },
  ] },
  { id: "passwords", title: "Stronger accounts", category: "Password protection", minutes: 4, summary: "Unique passwords, managers and a second layer of protection.", sections: [
    { title: "Unique beats reused", text: "A leaked reused password lets attackers try the same login elsewhere. Use a different long password for every account. A reputable password manager can generate and store them." },
    { title: "Add another layer", text: "Use passkeys where available, or enable two-factor authentication. Authenticator apps are generally preferable to SMS codes. Keep recovery codes somewhere secure and never share login codes with someone who contacts you." },
  ], quiz: [
    { prompt: "Which password approach is safest?", options: ["One password everywhere", "A unique long password per account", "Your birthday for every account"], correct: 1, explanation: "Unique passwords stop one exposed password from unlocking all your accounts." },
    { prompt: "A caller asks for your login code. What should you do?", options: ["Read it aloud", "Share half of it", "Do not share it"], correct: 2, explanation: "Login codes authenticate you. A legitimate support conversation does not require you to hand them over." },
  ] },
  { id: "network", title: "Safer connections", category: "Network security", minutes: 4, summary: "Protect your home network and use public Wi-Fi cautiously.", sections: [
    { title: "Secure your router", text: "Use WPA3 or WPA2 encryption and a strong Wi-Fi password. Change the router's default administrator password and install firmware updates. Use a guest network for visitors and smart devices when supported." },
    { title: "Public does not mean trusted", text: "Confirm the network name with the venue. Avoid sensitive transactions on unfamiliar Wi-Fi; use mobile data when practical. HTTPS encrypts the connection but does not make a fraudulent website trustworthy." },
  ], quiz: [
    { prompt: "Which home Wi-Fi setting should you prefer?", options: ["No password", "WPA3 or WPA2 encryption", "An unchanged default admin password"], correct: 1, explanation: "WPA3 or WPA2 protects the wireless connection. Also update the router and change its admin password." },
    { prompt: "What does HTTPS tell you?", options: ["The website cannot be a scam", "Every download is safe", "The connection is encrypted, not necessarily trustworthy"], correct: 2, explanation: "Scammers can use HTTPS too. Encryption is only one part of safe browsing." },
  ] },
  { id: "social-engineering", title: "When trust is the target", category: "Social engineering", minutes: 4, summary: "Resist pressure, fake authority and unexpected payment requests.", sections: [
    { title: "Attackers target people", text: "Social engineering uses authority, fear, kindness or curiosity to get you to act. An attacker may impersonate a colleague, a relative or technical support. Even a voice or video can be manipulated." },
    { title: "Slow down the request", text: "Verify unusual money requests by calling the person on a number you already know. Never install remote-access software because an unsolicited caller demands it. Stop the conversation if you feel pressured." },
  ], quiz: [
    { prompt: "A relative messages from a new number asking for money. What next?", options: ["Call them on their known number", "Pay before checking", "Send your banking password"], correct: 0, explanation: "Verify using an established contact channel. A new number and urgency can signal impersonation." },
    { prompt: "An unsolicited support caller wants remote access. What should you do?", options: ["Install their tool", "Decline and contact official support independently", "Disable your security software"], correct: 1, explanation: "Remote access can expose files and accounts. Contact support using a trusted channel instead." },
  ] },
  { id: "mobile", title: "Protect your pocket", category: "Mobile security", minutes: 4, summary: "Device locks, trusted apps and sensible permissions.", sections: [
    { title: "Keep the device protected", text: "Use a strong screen lock and keep your phone updated. Enable the manufacturer's device-finding tools. Back up important data so a lost phone does not mean lost memories." },
    { title: "Choose apps carefully", text: "Use official app stores, check the publisher and avoid apps pushed by suspicious messages. Review permissions: a torch app should not need your contacts. Remove apps you no longer use." },
  ], quiz: [
    { prompt: "A torch app wants access to your contacts. What is sensible?", options: ["Grant everything", "Share your OTP too", "Deny unnecessary access"], correct: 2, explanation: "Grant only permissions needed for an app's purpose. Unnecessary access increases privacy risk." },
    { prompt: "What helps protect a lost phone?", options: ["A strong screen lock and device-finding tools", "Removing the lock", "Publishing recovery codes"], correct: 0, explanation: "A lock limits access, and device-finding tools may let you locate or remotely lock the phone." },
  ] },
  { id: "browsing", title: "Think before you click", category: "Safe browsing", minutes: 4, summary: "Check addresses, downloads and browser extensions.", sections: [
    { title: "Inspect the destination", text: "Check the actual domain, not just a brand word somewhere in the address. Typos and unusual domains are warning signs. A URL scanner is another source of evidence, not a guarantee. Unknown results do not mean safe." },
    { title: "Limit downloads", text: "Download software from the official publisher. Keep your browser updated, and remove unnecessary extensions. Avoid unexpected attachments and pop-ups that claim your device is infected." },
  ], quiz: [
    { prompt: "A scanner reports Unknown. What does that mean?", options: ["The site is guaranteed safe", "There is not enough evidence to confirm its reputation", "You should disable browser protection"], correct: 1, explanation: "Unknown is not safe. Verify independently and avoid entering sensitive information." },
    { prompt: "Where should you download software?", options: ["An unexpected pop-up", "Any message attachment", "The official publisher or trusted app store"], correct: 2, explanation: "Official sources reduce the risk of tampered installers. Still review permissions and keep software updated." },
  ] },
  { id: "privacy", title: "Share less, control more", category: "Digital privacy", minutes: 4, summary: "Reduce unnecessary exposure of your personal information.", sections: [
    { title: "Review your audience", text: "Limit who can see your posts, contact information and location. Review tagging settings. Avoid posting travel plans, identity documents or details that can help someone impersonate you." },
    { title: "Reduce access", text: "Review app permissions and remove unused accounts where practical. Disable location access when it is not needed. Privacy settings can reduce exposure but cannot prevent someone from copying what you share." },
  ], quiz: [
    { prompt: "Which information should you avoid posting publicly?", options: ["A photo of your identity document", "A general hobby", "A public weather forecast"], correct: 0, explanation: "Identity documents expose sensitive information that can enable fraud and impersonation." },
    { prompt: "What is a useful privacy habit?", options: ["Enable location access for every app", "Regularly review audiences and app permissions", "Assume private posts cannot be copied"], correct: 1, explanation: "Reviewing access and audiences reduces unnecessary exposure. Even private content can be copied." },
  ] },
];

export function gradeQuiz(moduleId: string, answers: number[]) {
  const lesson = LESSONS.find((l) => l.id === moduleId);
  if (!lesson || answers.length !== lesson.quiz.length || answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= (lesson.quiz[i]?.options.length ?? 0))) throw new Error("Answer every quiz question.");
  const correct = lesson.quiz.map((q, i) => answers[i] === q.correct);
  return { score: Math.round(correct.filter(Boolean).length / correct.length * 100), correct };
}

export function learningOutcome(previous: { completion_percentage: number; quiz_score: number | null; completed_at: string | null } | null, score: number | null, now: string) {
  return {
    completion_percentage: previous?.completion_percentage === 100 || score === 100 ? 100 : 50,
    quiz_score: score === null ? previous?.quiz_score ?? null : Math.max(previous?.quiz_score ?? 0, score),
    completed_at: previous?.completed_at ?? (score === 100 ? now : null),
  };
}
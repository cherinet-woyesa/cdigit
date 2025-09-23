// src/lib/speechSynthesis.ts
// Utility for speech synthesis (text-to-speech) supporting Amharic and English

export function speak(text: string, lang: 'am' | 'en' = 'en') {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported in this browser.');
    return;
  }
  const synth = window.speechSynthesis;
  // Try to find a matching voice
  const voices = synth.getVoices();
  let voice = voices.find(v =>
    lang === 'am' ? v.lang.startsWith('am') : v.lang.startsWith('en')
  );
  // Fallback: use default voice
  if (!voice && voices.length > 0) {
    voice = voices[0];
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'am' ? 'am-ET' : 'en-US';
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

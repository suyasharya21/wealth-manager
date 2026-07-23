// Web Speech API Voice Input Dictation Engine
export function initVoiceInput(onSpeechResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onSpeechResult) {
      onSpeechResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  return recognition;
}

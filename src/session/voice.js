/**
 * Voice, camera and print — the browser's own engines, behind one small
 * surface. Everything reports honestly: no speech engine means no read-aloud,
 * and the screens say so instead of pretending to listen.
 */

const SPANISH = 'es-MX';

/* ------------------------------------------------------------- read aloud */

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, lang = SPANISH) {
  if (!canSpeak() || !text || !text.trim()) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/* --------------------------------------------------------------- dictation */

const recognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

export const canListen = () => recognitionCtor() !== null;

/** Listen for one Spanish answer. Returns a cancel function, or null. */
export function listen(onResult, onEnd) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = SPANISH;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? '';
    if (transcript.trim()) onResult(transcript.trim());
  };
  recognition.onend = () => onEnd && onEnd();
  recognition.onerror = () => onEnd && onEnd();
  recognition.start();
  return () => {
    try {
      recognition.abort();
    } catch {
      // The engine already stopped on its own.
    }
  };
}

export const microphoneAvailable = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

/* ------------------------------------------------------- documents & print */

/**
 * The system picker. `capture` asks the device for its camera instead of the
 * file browser, which is how "Tomar foto" works on a phone.
 */
export function pickDocument({ capture = false } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = capture ? 'image/*' : 'application/pdf,image/jpeg,image/png';
    if (capture) input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(
        file
          ? { name: file.name || (capture ? 'Foto de documento' : 'Documento'), kind: file.type === 'application/pdf' ? 'pdf' : 'imagen' }
          : null,
      );
    });
    input.click();
  });
}

export const canPrint = () => typeof window !== 'undefined';

export function printDocument() {
  if (canPrint()) window.print();
}
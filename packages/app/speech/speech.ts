// TS resolution anchor — bundlers load the .native/.web forks.
export {
  canSpeak,
  speak,
  stopSpeaking,
  canListen,
  listen,
  microphoneAvailable,
  voiceInputStatus,
  speechOutputStatus,
  type VoiceSupport,
} from './speech.web';
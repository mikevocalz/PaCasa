'use client';

import { Renderer } from '@openuidev/react-lang';
import { Text, View } from '@acme/ui/tw';
import { library } from './library';
import { safePaCasaProgram } from './schemas';

export interface OpenUIMessageProps {
  ui: string;
  /** Fill the composer but never transmit the proposed message automatically. */
  onSuggestion: (text: string) => void;
}

export function OpenUIMessage({ ui, onSuggestion }: OpenUIMessageProps) {
  if (!safePaCasaProgram(ui)) return (
    <Text role="status" className="text-sm text-silver-400">
      La vista interactiva no está disponible. Puedes leer la respuesta de Pa’Casa arriba.
    </Text>
  );
  return (
    <View className="min-w-0 gap-2">
      <Renderer
        response={ui}
        library={library}
        isStreaming={false}
        onAction={(event) => {
          if (event.type !== 'continue_conversation') return;
          const suggestion = event.humanFriendlyMessage;
          if (typeof suggestion === 'string' && suggestion.trim().length > 0 && suggestion.length <= 2000) {
            onSuggestion(suggestion.trim());
          }
        }}
      />
    </View>
  );
}

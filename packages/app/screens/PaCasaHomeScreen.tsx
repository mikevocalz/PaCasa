'use client';

import { Link } from 'solito/link';
import { ClipboardList, FileText, Languages, ListChecks, MessageCircle, ShieldCheck } from '@acme/ui/icons';
import { Text, View } from '@acme/ui/tw';
import { useAssistantStore } from '../assistant/store';
import { useLanguage } from '../session/locale';
import { t, type StringKey } from '../session/strings';
import { PatientBigAction, PatientFrame, PatientPanel, type PatientIcon } from './patient-ui';

const VISIT_LINKS = [
  { href: '/native', labelKey: 'home.forms', hintKey: 'home.formsHint', icon: ClipboardList },
  { href: '/hybrid', labelKey: 'home.docs', hintKey: 'home.docsHint', icon: FileText },
  { href: '/game', labelKey: 'home.review', hintKey: 'home.reviewHint', icon: ListChecks },
] as const satisfies readonly { href: string; labelKey: StringKey; hintKey: StringKey; icon: PatientIcon }[];

export function PaCasaHomeScreen() {
  const language = useLanguage();
  const openAssistant = useAssistantStore((s) => s.openAssistant);
  return (
    <PatientFrame
      question={t('home.eyebrow', language)}
      title={t('home.title', language)}
      lead={t('home.lead', language)}
    >
      <View className="gap-4 md:flex-row">
        <View className="flex-1">
          <PatientBigAction
            icon={MessageCircle}
            label={t('home.ask', language)}
            hint={t('home.askHint', language)}
            onPress={() => openAssistant('chat')}
          />
        </View>
        <View className="flex-1">
          <PatientBigAction
            icon={Languages}
            label={t('home.talk', language)}
            hint={t('home.talkHint', language)}
            tone="quiet"
            onPress={() => openAssistant('talk')}
          />
        </View>
      </View>

      <PatientPanel label={t('home.visit', language)}>
        <View className="gap-3 md:flex-row">
          {VISIT_LINKS.map(({ href, labelKey, hintKey, icon: Icon }) => (
            <View key={href} className="flex-1">
              <Link href={href} aria-label={t(labelKey, language)}>
                <View className="min-h-24 flex-1 justify-center gap-2 rounded-soft border border-border bg-surface p-4 hover:bg-surface-sunken">
                  <Icon size={24} className="text-accent" />
                  <Text className="font-display text-xl text-text">{t(labelKey, language)}</Text>
                  <Text className="text-sm leading-6 text-text-muted">{t(hintKey, language)}</Text>
                </View>
              </Link>
            </View>
          ))}
        </View>
      </PatientPanel>

      <PatientPanel label={t('home.final', language)}>
        <View className="flex-row items-start gap-3">
          <ShieldCheck size={24} className="mt-1 shrink-0 text-accent" />
          <View className="min-w-0 flex-1 gap-2">
            <Text className="font-display text-xl text-text">{t('home.finalTitle', language)}</Text>
            <Text className="text-base leading-7 text-text-muted">
              {t('home.finalBody', language)}
            </Text>
          </View>
        </View>
      </PatientPanel>
    </PatientFrame>
  );
}

'use client';

import { Text } from '@acme/ui/tw';
import { useAssistantStore } from '../assistant/store';
import type { AssistantSurfaceMode } from '../assistant/modes';
import { useLanguage } from '../session/locale';
import { t, type StringKey } from '../session/strings';
import { PatientButton, PatientFrame, PatientPanel } from './patient-ui';

interface TabContents {
  titleKey: StringKey;
  introKey: StringKey;
  emptyTitleKey: StringKey;
  emptyTextKey: StringKey;
  actionKey: StringKey;
  mode: AssistantSurfaceMode;
}

function ProductTab({ details }: { details: TabContents }) {
  const language = useLanguage();
  const openAssistant = useAssistantStore((s) => s.openAssistant);
  return (
    <PatientFrame question="Pa’Casa" title={t(details.titleKey, language)} lead={t(details.introKey, language)}>
      <PatientPanel label={t(details.emptyTitleKey, language)}>
        <Text className="max-w-xl text-base leading-7 text-text-muted">{t(details.emptyTextKey, language)}</Text>
        <PatientButton label={t(details.actionKey, language)} onPress={() => openAssistant(details.mode)} />
      </PatientPanel>
    </PatientFrame>
  );
}

export const MiPlanScreen = () => <ProductTab details={{
  titleKey: 'tab.plan.title',
  introKey: 'tab.plan.intro',
  emptyTitleKey: 'tab.plan.emptyTitle',
  emptyTextKey: 'tab.plan.emptyText',
  actionKey: 'tab.plan.action',
  mode: 'chat',
}} />;

export const CitasScreen = () => <ProductTab details={{
  titleKey: 'tab.dates.title',
  introKey: 'tab.dates.intro',
  emptyTitleKey: 'tab.dates.emptyTitle',
  emptyTextKey: 'tab.dates.emptyText',
  actionKey: 'tab.dates.action',
  mode: 'chat',
}} />;

export const ApoyoScreen = () => <ProductTab details={{
  titleKey: 'tab.support.title',
  introKey: 'tab.support.intro',
  emptyTitleKey: 'tab.support.emptyTitle',
  emptyTextKey: 'tab.support.emptyText',
  actionKey: 'tab.support.action',
  mode: 'talk',
}} />;

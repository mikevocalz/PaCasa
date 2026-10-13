'use client';

import { useEffect, type ComponentType, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import { Link } from 'solito/link';
import { usePathname } from 'solito/navigation';
import { brandLogo } from '@acme/assets/brand';
import { navChrome } from '@acme/theme';
import { Image, Modal, SafeArea, useAdaptiveNavigationPlacement, useSafeInsets, useInstanceStore, useStore } from '@acme/ui';
import { Calendar, ClipboardList, FileText, HelpCircle, Home, Languages, ListChecks, Menu, Mic, Users, X } from '@acme/ui/icons';
import { Header, Nav, Pressable, ScrollView, Text, View } from '@acme/ui/tw';
import { useAssistantStore } from '../assistant/store';
import { hydrateLanguage, SUPPORTED_LANGUAGES, useLanguage, usePatientLanguage } from '../session/locale';
import { t, type StringKey } from '../session/strings';
import { AssistantOverlay } from './AssistantOverlay';
import { PaCasaLiveOverlay } from './PaCasaLiveOverlay';

/** The four product tabs; patient visit workflows stay reachable from the menu. */
const DESTINATIONS = [
  { href: '/', labelKey: 'nav.home', shortKey: 'nav.home.short', icon: Home },
  { href: '/mi-plan', labelKey: 'nav.plan', shortKey: 'nav.plan.short', icon: ClipboardList },
  { href: '/citas', labelKey: 'nav.dates', shortKey: 'nav.dates.short', icon: Calendar },
  { href: '/apoyo', labelKey: 'nav.support', shortKey: 'nav.support.short', icon: Users },
] as const;

const WORKFLOW_DESTINATIONS = [
  { href: '/native', labelKey: 'nav.forms', shortKey: 'nav.forms.short', icon: ClipboardList },
  { href: '/hybrid', labelKey: 'nav.docs', shortKey: 'nav.docs.short', icon: FileText },
  { href: '/game', labelKey: 'nav.review', shortKey: 'nav.review.short', icon: ListChecks },
  { href: '/immersive', labelKey: 'nav.help', shortKey: 'nav.help.short', icon: HelpCircle },
] as const;

const SECONDARY_DESTINATION = WORKFLOW_DESTINATIONS[3];

const navSize = (value: string) => Number.parseFloat(value);
const RAIL_WIDTH = navSize(navChrome.rail);
const EXPANDED_RAIL_WIDTH = navSize(navChrome.railExpanded);
const ACTION_SIZE = navSize(navChrome.raised);
const ACTION_RAISE = navSize(navChrome.raise);
const INDICATOR_SIZE = navSize(navChrome.indicator);

function Destination({
  href,
  labelKey,
  shortKey,
  icon: Icon,
  active,
  rail,
  expanded,
}: {
  href: string;
  labelKey: StringKey;
  shortKey: StringKey;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  rail: boolean;
  expanded: boolean;
}) {
  const language = useLanguage();
  const label = t(labelKey, language);
  const short = t(shortKey, language);
  return (
    <View className={rail ? 'w-full' : 'min-w-0 flex-1'}>
      <Link href={href}>
        <View
          aria-current={active ? 'page' : undefined}
          aria-label={label}
          className={`relative min-h-12 items-center justify-center gap-1 border border-transparent ${rail && expanded ? 'flex-row px-5' : rail ? 'py-2' : 'px-0'} ${active ? 'bg-surface-sunken' : 'hover:border-border hover:bg-surface-raised'}`}
        >
          {active ? (
            <View
              aria-hidden
              style={rail ? { height: INDICATOR_SIZE } : { width: INDICATOR_SIZE }}
              className={rail ? 'absolute bottom-1 right-0 top-1 w-1 bg-accent' : 'absolute top-0 h-1 bg-accent'}
            />
          ) : null}
          <Icon size={rail ? 24 : 21} strokeWidth={active ? 2.5 : 1.75} className={active ? 'text-accent' : 'text-text-muted'} />
          <Text
            numberOfLines={1}
            className={`${rail && expanded ? 'flex-1 text-sm' : rail ? 'text-xs' : 'whitespace-nowrap text-xs'} ${active ? 'font-semibold text-text' : 'text-text-muted'}`}
          >
            {rail ? label : short}
          </Text>
        </View>
      </Link>
    </View>
  );
}

// The lockup artwork is a dark wordmark on transparency (992x518 source,
// ~1.9:1): on the daylit header it sits bare — the plate is only needed if a
// night chrome ships again. It fills the header's 64px height.
function BrandLockup() {
  return (
    <View className="h-full flex-row items-center justify-center px-2">
      <Image src={brandLogo} alt="Pa'Casa" width={107} height={56} framed={false} />
    </View>
  );
}

/** Compact language switch; each option is abbreviated in its own language. */
const LANGUAGE_ABBR: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  es: 'Esp',
  en: 'Eng',
};

function LanguageSwitch() {
  const language = useLanguage();
  const setPreference = usePatientLanguage((s) => s.setPreference);
  return (
    <View
      role="radiogroup"
      aria-label={t('a11y.language', language)}
      className="h-11 flex-row items-center gap-1 rounded-full border border-border bg-surface-raised p-1"
    >
      <Languages size={16} className="ml-1 text-text-muted" />
      {SUPPORTED_LANGUAGES.map((option) => {
        const active = language === option;
        return (
          <Pressable
            key={option}
            role="radio"
            aria-checked={active}
            accessibilityLabel={option === 'es' ? 'Español' : 'English'}
            onPress={() => setPreference(option)}
            className={`min-h-9 min-w-11 items-center justify-center rounded-full px-2 focus-visible:outline-2 focus-visible:outline-focus ${active ? 'bg-cta' : ''}`}
          >
            <Text className={`text-xs font-bold ${active ? 'text-on-cta' : 'text-text-muted'}`}>
              {LANGUAGE_ABBR[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The raised signature action: opens the Pa'Casa assistant over whatever screen is showing. */
function PaCasaButton({ rail }: { rail: boolean }) {
  const language = useLanguage();
  return (
    <Pressable
      role="button"
      aria-label={t('a11y.pacasa', language)}
      onPress={() => useAssistantStore.getState().openAssistant('chat')}
      style={rail ? undefined : { width: ACTION_SIZE, height: ACTION_SIZE, marginTop: -ACTION_RAISE }}
      className={`items-center justify-center border bg-cta shadow-raised active:bg-cta-pressed focus-visible:outline-2 focus-visible:outline-focus ${rail ? 'min-h-14 w-full gap-1 rounded-soft border-transparent' : 'shrink-0 border-4 border-surface'}`}
    >
      <Mic size={24} strokeWidth={2.25} className="text-on-cta" />
      <Text className="text-xs font-semibold text-on-cta">Pa&apos;Casa</Text>
    </Pressable>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const language = useLanguage();
  const menuStore = useInstanceStore(() => ({ open: false }));
  const menuOpen = useStore(menuStore, (state) => state.open);
  const closeMenu = () => menuStore.setState({ open: false });
  useEffect(() => { menuStore.setState({ open: false }); }, [pathname, menuStore]);
  // Escape dismisses the menu on web; Android back goes through onRequestClose.
  useEffect(() => {
    if (!menuOpen || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') menuStore.setState({ open: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, menuStore]);
  const placement = useAdaptiveNavigationPlacement();
  const insets = useSafeInsets();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const openAssistant = () => useAssistantStore.getState().openAssistant('chat');
  // Read the stored/device language after mount so SSR and the first client
  // render agree (hydration-safe language detection).
  useEffect(() => hydrateLanguage(), []);
  // Keep the DOM lang attribute in sync so screen readers pick the right voice.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);
  const railWidth = placement.hardwareWidth || (placement.expanded ? EXPANDED_RAIL_WIDTH : RAIL_WIDTH) + insets.right;
  const navigation = (
    <Nav
      aria-label={t('nav.sections', language)}
      style={placement.rail ? { width: railWidth, paddingRight: placement.hardwareWidth ? 0 : insets.right, flexShrink: 0 } : { height: 72, flexShrink: 0 }}
      className={placement.rail ? 'h-full border-l border-border bg-surface' : 'flex-row items-center border-t border-border bg-surface px-1 pb-2'}
    >
      <ScrollView
        horizontal={!placement.rail}
        scrollEnabled={placement.rail}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName={placement.rail ? 'grow items-stretch justify-center gap-2 px-2 py-4' : 'flex-1 flex-row items-center'}
      >
      {(placement.rail ? DESTINATIONS : DESTINATIONS.slice(0, 2)).map((destination) => (
        <Destination
          key={destination.href}
          {...destination}
          active={isActive(destination.href)}
          rail={placement.rail}
          expanded={placement.expanded}
        />
      ))}
      {placement.rail ? (
        <View className="mt-3 w-full">
          <PaCasaButton rail />
        </View>
      ) : (
        <PaCasaButton rail={false} />
      )}
      {!placement.rail
        ? DESTINATIONS.slice(2).map((destination) => (
            <Destination
              key={destination.href}
              {...destination}
              active={isActive(destination.href)}
              rail={false}
              expanded={false}
            />
          ))
        : null}
      </ScrollView>
    </Nav>
  );

  return (
    <SafeArea edges={['top', 'bottom']} style={{ direction: 'ltr' }} className={`min-h-0 flex-1 bg-surface ${placement.rail ? 'flex-row' : ''}`}>
      <SafeArea edges={placement.rail ? ['left'] : ['left', 'right']} style={{ direction: I18nManager.isRTL ? 'rtl' : 'ltr' }} className="min-h-0 min-w-0 flex-1">
        <Header className="h-16 shrink-0 flex-row items-center justify-between gap-3 border-b border-border bg-surface px-4">
          <Link href="/" aria-label={t('a11y.brand', language)}>
            <BrandLockup />
          </Link>
          {Platform.OS === 'web' ? (
            <Nav aria-label={t('a11y.nav.header', language)} className="hidden flex-row items-center gap-1 md:flex">
              {DESTINATIONS.map((destination) => (
                <Link key={destination.href} href={destination.href} aria-current={isActive(destination.href) ? 'page' : undefined}>
                  <View className={`min-h-11 justify-center border-b-2 px-3 ${isActive(destination.href) ? 'border-border-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken'}`}>
                    <Text className={`text-sm font-semibold ${isActive(destination.href) ? 'text-text' : 'text-text-muted'}`}>{t(destination.labelKey, language)}</Text>
                  </View>
                </Link>
              ))}
              <Link href={SECONDARY_DESTINATION.href} aria-current={isActive(SECONDARY_DESTINATION.href) ? 'page' : undefined}>
                <View className={`min-h-11 justify-center border-b-2 px-3 ${isActive(SECONDARY_DESTINATION.href) ? 'border-border-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken'}`}>
                  <Text className={`text-sm font-medium ${isActive(SECONDARY_DESTINATION.href) ? 'text-text' : 'text-text-muted'}`}>{t(SECONDARY_DESTINATION.labelKey, language)}</Text>
                </View>
              </Link>
            </Nav>
          ) : null}
          <View className="flex-row items-center gap-2">
            <LanguageSwitch />
            {Platform.OS === 'web' ? (
              <Pressable
                role="button"
                aria-label={t('a11y.pacasa', language)}
                onPress={openAssistant}
                className="hidden min-h-11 flex-row items-center gap-2 rounded-soft border border-transparent bg-cta px-4 hover:bg-cta-pressed focus-visible:outline-2 focus-visible:outline-focus md:inline-flex"
              >
                <Mic size={18} className="text-on-cta" />
                <Text className="text-sm font-semibold text-on-cta">Pa&apos;Casa</Text>
              </Pressable>
            ) : null}
            <Pressable
              role="button"
              aria-label={t('a11y.menu', language)}
              aria-expanded={menuOpen}
              onPress={() => menuStore.setState({ open: true })}
              className={`h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus ${Platform.OS === 'web' ? 'md:hidden' : ''}`}
            >
              <Menu size={22} className="text-text" />
            </Pressable>
          </View>
        </Header>
        <View className="min-h-0 flex-1">{children}</View>
      </SafeArea>
      {placement.kind !== 'header-only' ? navigation : null}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <SafeArea className="flex-1 bg-surface" edges={['top', 'bottom', 'left', 'right']}>
          <View role="dialog" aria-modal aria-label="Navigation menu" className="mx-auto w-full max-w-4xl flex-1 p-4">
            <View className="min-h-12 flex-row items-center justify-between border-b border-border pb-3">
              <BrandLockup />
              <Pressable role="button" aria-label={t('a11y.menu.close', language)} onPress={closeMenu} className="h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus">
                <X size={22} className="text-text" />
              </Pressable>
            </View>
            <ScrollView className="flex-1" contentContainerClassName="gap-2 py-5">
              <Nav aria-label={t('a11y.nav', language)} className="gap-2">
                <Pressable
                  role="button"
                  aria-label={t('a11y.pacasa', language)}
                  onPress={() => {
                    closeMenu();
                    openAssistant();
                  }}
                  className="min-h-14 w-full flex-row items-center gap-4 rounded-soft border border-transparent bg-cta px-4 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <Mic size={24} className="text-on-cta" />
                  <Text className="text-lg font-semibold text-on-cta">Pa&apos;Casa</Text>
                </Pressable>
                {[...DESTINATIONS, ...WORKFLOW_DESTINATIONS].map((destination) => (
                  <Link key={destination.href} href={destination.href} {...(Platform.OS === 'web' ? { onClick: closeMenu } : { onPress: closeMenu })} aria-current={isActive(destination.href) ? 'page' : undefined}>
                    <View className={`min-h-14 flex-row items-center gap-4 rounded-soft border px-4 ${isActive(destination.href) ? 'border-border-strong bg-surface-sunken' : 'border-border bg-surface-raised'}`}>
                      <destination.icon size={24} className={isActive(destination.href) ? 'text-accent' : 'text-text-muted'} />
                      <Text className="text-lg font-semibold text-text">{t(destination.labelKey, language)}</Text>
                    </View>
                  </Link>
                ))}
              </Nav>
            </ScrollView>
          </View>
        </SafeArea>
      </Modal>
      <PaCasaLiveOverlay />
      <AssistantOverlay />
    </SafeArea>
  );
}

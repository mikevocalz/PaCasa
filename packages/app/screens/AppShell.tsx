'use client';

import { useEffect, type ComponentType, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import { Link } from 'solito/link';
import { usePathname } from 'solito/navigation';
import { brandLogo } from '@acme/assets/brand';
import { navChrome } from '@acme/theme';
import { Image, Modal, SafeArea, useAdaptiveNavigationPlacement, useSafeInsets, useInstanceStore, useStore } from '@acme/ui';
import { ClipboardList, FileText, HelpCircle, Home, ListChecks, Menu, Mic, X } from '@acme/ui/icons';
import { Header, Nav, Pressable, ScrollView, Text, View } from '@acme/ui/tw';
import { useLiveOverlay } from '../session/live-overlay';
import { PaCasaLiveOverlay } from './PaCasaLiveOverlay';

/** The four primary patient workflows; Ayuda stays a secondary link. */
const DESTINATIONS = [
  { href: '/', label: 'Inicio', short: 'Inicio', icon: Home },
  { href: '/native', label: 'Formularios', short: 'Formularios', icon: ClipboardList },
  { href: '/hybrid', label: 'Documentos', short: 'Documentos', icon: FileText },
  { href: '/game', label: 'Revisar', short: 'Revisar', icon: ListChecks },
] as const;

const SECONDARY_DESTINATION = { href: '/immersive', label: 'Ayuda', icon: HelpCircle } as const;

const navSize = (value: string) => Number.parseFloat(value);
const RAIL_WIDTH = navSize(navChrome.rail);
const EXPANDED_RAIL_WIDTH = navSize(navChrome.railExpanded);
const ACTION_SIZE = navSize(navChrome.raised);
const ACTION_RAISE = navSize(navChrome.raise);
const INDICATOR_SIZE = navSize(navChrome.indicator);

function Destination({
  href,
  label,
  short,
  icon: Icon,
  active,
  rail,
  expanded,
}: {
  href: string;
  label: string;
  short: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  rail: boolean;
  expanded: boolean;
}) {
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
// night chrome ships again.
function BrandLockup() {
  return (
    <View className="h-11 flex-row items-center justify-center px-2">
      <Image src={brandLogo} alt="Pa'Casa" width={72} height={38} framed={false} />
    </View>
  );
}

/** The raised signature action: opens Pa'Casa Live over whatever screen is showing. */
function PaCasaButton({ rail }: { rail: boolean }) {
  const pathname = usePathname() ?? '/';
  return (
    <Pressable
      role="button"
      aria-label="Pa'Casa: hablar con la app"
      onPress={() => useLiveOverlay.getState().openLive(pathname, 'hablar')}
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
  const menuStore = useInstanceStore(() => ({ open: false }));
  const menuOpen = useStore(menuStore, (state) => state.open);
  const closeMenu = () => menuStore.setState({ open: false });
  useEffect(() => { menuStore.setState({ open: false }); }, [pathname, menuStore]);
  // Escape dismisses the menu on web; Android back goes through onRequestClose.
  useEffect(() => {
    if (!menuOpen || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  const placement = useAdaptiveNavigationPlacement();
  const insets = useSafeInsets();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const openLive = () => useLiveOverlay.getState().openLive(pathname, 'hablar');
  const railWidth = placement.hardwareWidth || (placement.expanded ? EXPANDED_RAIL_WIDTH : RAIL_WIDTH) + insets.right;
  const navigation = (
    <Nav
      aria-label="Secciones"
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
          <Link href="/" aria-label="Pa&apos;Casa, inicio">
            <BrandLockup />
          </Link>
          {Platform.OS === 'web' ? (
            <Nav aria-label="Header navigation" className="hidden flex-row items-center gap-1 md:flex">
              {DESTINATIONS.map((destination) => (
                <Link key={destination.href} href={destination.href} aria-current={isActive(destination.href) ? 'page' : undefined}>
                  <View className={`min-h-11 justify-center border-b-2 px-3 ${isActive(destination.href) ? 'border-border-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken'}`}>
                    <Text className={`text-sm font-semibold ${isActive(destination.href) ? 'text-text' : 'text-text-muted'}`}>{destination.label}</Text>
                  </View>
                </Link>
              ))}
              <Link href={SECONDARY_DESTINATION.href} aria-current={isActive(SECONDARY_DESTINATION.href) ? 'page' : undefined}>
                <View className={`min-h-11 justify-center border-b-2 px-3 ${isActive(SECONDARY_DESTINATION.href) ? 'border-border-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken'}`}>
                  <Text className={`text-sm font-medium ${isActive(SECONDARY_DESTINATION.href) ? 'text-text' : 'text-text-muted'}`}>{SECONDARY_DESTINATION.label}</Text>
                </View>
              </Link>
            </Nav>
          ) : null}
          <View className="flex-row items-center gap-2">
            {Platform.OS === 'web' ? (
              <Pressable
                role="button"
                aria-label="Pa'Casa: hablar con la app"
                onPress={openLive}
                className="hidden min-h-11 flex-row items-center gap-2 rounded-soft border border-transparent bg-cta px-4 hover:bg-cta-pressed focus-visible:outline-2 focus-visible:outline-focus md:inline-flex"
              >
                <Mic size={18} className="text-on-cta" />
                <Text className="text-sm font-semibold text-on-cta">Pa&apos;Casa</Text>
              </Pressable>
            ) : null}
            <Pressable
              role="button"
              aria-label="Open navigation menu"
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
              <Pressable role="button" aria-label="Close navigation menu" onPress={closeMenu} className="h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus">
                <X size={22} className="text-text" />
              </Pressable>
            </View>
            <ScrollView className="flex-1" contentContainerClassName="gap-2 py-5">
              <Nav aria-label="Mobile navigation" className="gap-2">
                <Pressable
                  role="button"
                  aria-label="Pa'Casa: hablar con la app"
                  onPress={() => {
                    closeMenu();
                    openLive();
                  }}
                  className="min-h-14 w-full flex-row items-center gap-4 rounded-soft border border-transparent bg-cta px-4 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <Mic size={24} className="text-on-cta" />
                  <Text className="text-lg font-semibold text-on-cta">Pa&apos;Casa</Text>
                </Pressable>
                {[...DESTINATIONS, SECONDARY_DESTINATION].map((destination) => (
                  <Link key={destination.href} href={destination.href} {...(Platform.OS === 'web' ? { onClick: closeMenu } : { onPress: closeMenu })} aria-current={isActive(destination.href) ? 'page' : undefined}>
                    <View className={`min-h-14 flex-row items-center gap-4 rounded-soft border px-4 ${isActive(destination.href) ? 'border-border-strong bg-surface-sunken' : 'border-border bg-surface-raised'}`}>
                      <destination.icon size={24} className={isActive(destination.href) ? 'text-accent' : 'text-text-muted'} />
                      <Text className="text-lg font-semibold text-text">{destination.label}</Text>
                    </View>
                  </Link>
                ))}
              </Nav>
            </ScrollView>
          </View>
        </SafeArea>
      </Modal>
      <PaCasaLiveOverlay />
    </SafeArea>
  );
}

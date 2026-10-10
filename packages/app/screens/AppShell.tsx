'use client';

import { useEffect, type ComponentType, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import { Link } from 'solito/link';
import { usePathname } from 'solito/navigation';
import { CameraLab } from '@acme/camera';
import { navChrome } from '@acme/theme';
import { Modal, SafeArea, useAdaptiveNavigationPlacement, useSafeInsets, useInstanceStore, useStore } from '@acme/ui';
import { Box, Gamepad2, Layers, Menu, Navigation, ScanLine, Star, X } from '@acme/ui/icons';
import { Header, Nav, Pressable, ScrollView, Text, View } from '@acme/ui/tw';
import { useCameraLabStore } from '../state';

const DESTINATIONS = [
  { href: '/', label: 'Showcase', short: 'Home', icon: Star },
  { href: '/native', label: 'Native', short: 'Native', icon: Box },
  { href: '/hybrid', label: 'Hybrid', short: 'Hybrid', icon: Layers },
  { href: '/game', label: 'Game', short: 'Game', icon: Gamepad2 },
  { href: '/immersive', label: 'Immersive', short: '3D', icon: Navigation },
] as const;

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
          className={`relative min-h-12 items-center justify-center gap-1 border border-transparent ${rail && expanded ? 'flex-row px-5' : rail ? 'py-2' : 'px-0'} ${active ? 'bg-ink-800/90 shadow-card' : 'hover:border-ink-700 hover:bg-ink-900'}`}
        >
          {active ? (
            <View
              aria-hidden
              style={rail ? { height: INDICATOR_SIZE } : { width: INDICATOR_SIZE }}
              className={rail ? 'absolute bottom-1 right-0 top-1 w-1 bg-royal-400 shadow-glow-royal' : 'absolute top-0 h-1 bg-royal-400 shadow-glow-royal'}
            />
          ) : null}
          <Icon size={rail ? 24 : 21} strokeWidth={active ? 2.5 : 1.75} className={active ? 'text-royal-400' : 'text-silver-400'} />
          <Text
            numberOfLines={1}
            className={`${rail && expanded ? 'flex-1 text-sm' : rail ? 'text-xs' : 'whitespace-nowrap text-xs'} ${active ? 'font-semibold text-silver-50' : 'text-silver-400'}`}
          >
            {rail ? label : short}
          </Text>
        </View>
      </Link>
    </View>
  );
}

function ScanButton({ rail }: { rail: boolean }) {
  const setOpen = useCameraLabStore((state) => state.setOpen);
  return (
    <Pressable
      role="button"
      aria-label="Scan with Camera Lab"
      onPress={() => setOpen(true)}
      style={rail ? undefined : { width: ACTION_SIZE, height: ACTION_SIZE, marginTop: -ACTION_RAISE }}
      className={`items-center justify-center border border-royal-300 bg-royal-500 shadow-glow-royal active:bg-royal-600 focus-visible:outline-2 focus-visible:outline-silver-50 ${rail ? 'min-h-14 w-full gap-1' : 'shrink-0 border-4 border-ink-950'}`}
    >
      <ScanLine size={24} strokeWidth={2.25} className="text-silver-50" />
      <Text className="text-xs font-semibold text-silver-50">Scan</Text>
    </Pressable>
  );
}

const HAS_CAMERA = Platform.OS !== 'web';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const menuStore = useInstanceStore(() => ({ open: false }));
  const menuOpen = useStore(menuStore, (state) => state.open);
  const closeMenu = () => menuStore.setState({ open: false });
  useEffect(() => { menuStore.setState({ open: false }); }, [pathname, menuStore]);
  const placement = useAdaptiveNavigationPlacement();
  const insets = useSafeInsets();
  const open = useCameraLabStore((state) => state.open);
  const setOpen = useCameraLabStore((state) => state.setOpen);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const railWidth = placement.hardwareWidth || (placement.expanded ? EXPANDED_RAIL_WIDTH : RAIL_WIDTH) + insets.right;
  const navigation = (
    <Nav
      aria-label="Demos"
      style={placement.rail ? { width: railWidth, paddingRight: placement.hardwareWidth ? 0 : insets.right, flexShrink: 0 } : { height: 72, flexShrink: 0 }}
      className={placement.rail ? 'h-full border-l border-ink-700 bg-ink-950/95 shadow-overlay' : 'flex-row items-center border-t border-ink-700 bg-ink-950/95 px-1 pb-2 shadow-overlay'}
    >
      <ScrollView
        horizontal={!placement.rail}
        scrollEnabled={placement.rail}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName={placement.rail ? 'grow items-stretch justify-center gap-2 px-2 py-4' : 'flex-1 flex-row items-center'}
      >
      {(HAS_CAMERA && !placement.rail ? DESTINATIONS.slice(0, 3) : DESTINATIONS).map((destination) => (
        <Destination
          key={destination.href}
          {...destination}
          active={isActive(destination.href)}
          rail={placement.rail}
          expanded={placement.expanded}
        />
      ))}
      {HAS_CAMERA ? (
        placement.rail ? (
          <View className="mt-3 w-full">
            <ScanButton rail />
          </View>
        ) : (
          <ScanButton rail={false} />
        )
      ) : null}
      {HAS_CAMERA && !placement.rail
        ? DESTINATIONS.slice(3).map((destination) => (
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
    <SafeArea edges={['top', 'bottom']} style={{ direction: 'ltr' }} className={`min-h-0 flex-1 bg-ink-950 ${placement.rail ? 'flex-row' : ''}`}>
      <SafeArea edges={placement.rail ? ['left'] : ['left', 'right']} style={{ direction: I18nManager.isRTL ? 'rtl' : 'ltr' }} className="min-h-0 min-w-0 flex-1">
        <Header className="h-16 shrink-0 flex-row items-center justify-between gap-3 border-b border-ink-800 bg-ink-950 px-4">
          <Link href="/" aria-label="Pa&apos;Casa home">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center border border-royal-400 bg-royal-500">
                <Text className="font-display text-lg text-silver-50">P</Text>
              </View>
              <Text className="font-display text-lg text-silver-50">Pa&apos;Casa</Text>
            </View>
          </Link>
          {Platform.OS === 'web' ? (
            <Nav aria-label="Header navigation" className="hidden flex-row items-center gap-1 md:flex">
              {DESTINATIONS.map((destination) => (
                <Link key={destination.href} href={destination.href} aria-current={isActive(destination.href) ? 'page' : undefined}>
                  <View className={`min-h-11 justify-center border-b-2 px-3 ${isActive(destination.href) ? 'border-royal-400 bg-royal-500/10' : 'border-transparent hover:bg-ink-800'}`}>
                    <Text className={`text-sm font-semibold ${isActive(destination.href) ? 'text-silver-50' : 'text-silver-400'}`}>{destination.label}</Text>
                  </View>
                </Link>
              ))}
            </Nav>
          ) : null}
          <Pressable
            role="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onPress={() => menuStore.setState({ open: true })}
            className={`h-11 w-11 items-center justify-center border border-ink-600 bg-ink-900 ${Platform.OS === 'web' ? 'md:hidden' : ''}`}
          >
            <Menu size={22} className="text-silver-50" />
          </Pressable>
        </Header>
        <View className="min-h-0 flex-1">{children}</View>
      </SafeArea>
      {placement.kind !== 'header-only' ? navigation : null}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <SafeArea className="flex-1 bg-ink-950/95" edges={['top', 'bottom', 'left', 'right']}>
          <View role="dialog" aria-modal aria-label="Navigation menu" className="mx-auto w-full max-w-4xl flex-1 p-4">
            <View className="min-h-12 flex-row items-center justify-between border-b border-ink-700 pb-3">
              <Text className="font-display text-xl text-silver-50">Pa&apos;Casa</Text>
              <Pressable role="button" aria-label="Close navigation menu" onPress={closeMenu} className="h-11 w-11 items-center justify-center border border-ink-600 bg-ink-900">
                <X size={22} className="text-silver-50" />
              </Pressable>
            </View>
            <ScrollView className="flex-1" contentContainerClassName="gap-2 py-5">
              <Nav aria-label="Mobile navigation" className="gap-2">
                {DESTINATIONS.map((destination) => (
                  <Link key={destination.href} href={destination.href} {...(Platform.OS === 'web' ? { onClick: closeMenu } : { onPress: closeMenu })} aria-current={isActive(destination.href) ? 'page' : undefined}>
                    <View className={`min-h-14 flex-row items-center gap-4 border px-4 ${isActive(destination.href) ? 'border-royal-400 bg-royal-500/20' : 'border-ink-700 bg-ink-900'}`}>
                      <destination.icon size={24} className="text-royal-300" />
                      <Text className="text-lg font-semibold text-silver-50">{destination.label}</Text>
                    </View>
                  </Link>
                ))}
              </Nav>
            </ScrollView>
          </View>
        </SafeArea>
      </Modal>
      {HAS_CAMERA ? <CameraLab open={open} onClose={() => setOpen(false)} /> : null}
    </SafeArea>
  );
}

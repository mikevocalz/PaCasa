'use client';

import { Link } from 'solito/link';
import { useLayoutSize } from '@acme/ui';
import { ArrowRight } from '@acme/ui/icons';
import { ScrollView, Text, View } from '@acme/ui/tw';
import { RevealTarget, ShowcaseReveal } from './ShowcaseReveal';
import { SHOWCASE_DEMOS, type ShowcaseDemo } from './showcase-demos';

export function ShowcaseScreen({ demos = SHOWCASE_DEMOS }: { demos?: readonly ShowcaseDemo[] }) {
  const { size, onLayout } = useLayoutSize();
  const columns = size.width >= 640 ? 2 : 1;
  return (
    <ShowcaseReveal>
      <ScrollView
        className="flex-1 bg-ink-950"
        contentContainerClassName="relative mx-auto w-full max-w-4xl gap-14 overflow-hidden px-4 py-12 md:px-6 md:py-20"
      >
        <View aria-hidden className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-royal-500/15" />
        <View aria-hidden className="absolute right-40 top-36 h-56 w-56 rounded-full bg-carolina-400/10" />
        <View className="gap-8">
          <View className="min-w-0 max-w-4xl gap-6">
            <RevealTarget target="headline">
              <View className="gap-5">
                <Text className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-300">Pa&apos;Casa</Text>
                <Text role="heading" aria-level={1} className="font-display text-5xl leading-[1.02] text-silver-50 md:text-7xl">
                  Premium interfaces for every dimension.
                </Text>
              </View>
            </RevealTarget>
            <RevealTarget target="intro">
              <Text className="max-w-3xl text-lg leading-8 text-silver-300 md:text-xl md:leading-9">
                One production-minded system for native controls, authored motion, real-time graphics and spatial computing—built with Expo and Next.js.
              </Text>
            </RevealTarget>
          </View>
          <View className="gap-2 border-l-2 border-royal-500 bg-ink-900/80 px-5 py-4 shadow-card">
            <Text className="font-display text-3xl text-silver-50">05</Text>
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-silver-400">Connected surfaces</Text>
          </View>
        </View>

        <RevealTarget target="demos">
          <View role="list" onLayout={onLayout} className="flex-row flex-wrap gap-4">
            {demos.map((demo, index) => (
              <View role="listitem" key={demo.href} style={{ width: index === 0 || columns === 1 ? '100%' : (size.width - 16) / 2 }}>
                <Link href={demo.href}>
                  <View className="group min-h-56 overflow-hidden border border-ink-700 bg-ink-900/90 p-6 shadow-card transition-colors hover:border-royal-500 hover:bg-ink-800 md:p-8">
                    <View className="flex-1 gap-6">
                      <View className="flex-row items-start justify-between gap-4">
                        <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-royal-300">0{index + 1} · {demo.layout}</Text>
                        <View className="h-10 w-10 items-center justify-center border border-ink-600 bg-ink-950 group-hover:border-royal-400">
                          <ArrowRight size={20} className="text-silver-200" />
                        </View>
                      </View>
                      <View className="gap-3">
                        <Text className="font-display text-3xl leading-tight text-silver-50 md:text-4xl">{demo.title}</Text>
                        <Text className="max-w-2xl text-base leading-7 text-silver-300">{demo.line}</Text>
                      </View>
                    </View>
                    <View aria-hidden className="mt-7 h-1 w-16 bg-royal-500 group-hover:w-28" />
                  </View>
                </Link>
              </View>
            ))}
          </View>
        </RevealTarget>
      </ScrollView>
    </ShowcaseReveal>
  );
}

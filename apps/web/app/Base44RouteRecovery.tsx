'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Base44 serves index.html for deep links; load the requested route's static payload. */
export function Base44RouteRecovery() {
  const router = useRouter();
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const route = pathname.replace(/\/$/, '');
    if (['/mi-plan', '/citas', '/apoyo', '/lab', '/native', '/hybrid', '/game', '/immersive'].includes(route)) {
      router.replace(`${route}/${search}${hash}`, { scroll: false });
    }
  }, [router]);
  return null;
}

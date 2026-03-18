'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlatformConnection } from '@/types';

export function usePlatform() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchConnections() {
      const { data } = await supabase
        .from('platform_connections')
        .select('*');
      setConnections((data || []) as PlatformConnection[]);
      setLoading(false);
    }
    fetchConnections();
  }, [supabase]);

  const isConnected = (platform: string) =>
    connections.some((c) => c.platform === platform);

  return { connections, loading, isConnected };
}

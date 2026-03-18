'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Activity } from '@/types';
import { FILTER_TO_PLATFORM } from '@/lib/utils/constants';

export function useFeed(filter: string = '전체') {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();
  const PAGE_SIZE = 20;

  const fetchActivities = useCallback(async (cursor?: string) => {
    let query = supabase
      .from('activities')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const platforms = FILTER_TO_PLATFORM[filter];
    if (platforms && platforms.length > 0) {
      query = query.in('platform', platforms);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Feed fetch error:', error);
      setLoading(false);
      return;
    }

    const items = (data || []) as Activity[];
    if (cursor) {
      setActivities((prev) => [...prev, ...items]);
    } else {
      setActivities(items);
    }
    setHasMore(items.length === PAGE_SIZE);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    setLoading(true);
    fetchActivities();
  }, [fetchActivities]);

  const loadMore = () => {
    if (activities.length > 0) {
      fetchActivities(activities[activities.length - 1].created_at);
    }
  };

  return { activities, loading, hasMore, loadMore };
}

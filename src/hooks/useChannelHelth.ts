import { useEffect, useState } from "react";

export interface Channel {
  name: string;
  url: string;
  logo?: string;
}

export function useChannelHealth(channels: Channel[], timeout = 5000) {
  const [aliveChannels, setAliveChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkChannel(url: string): Promise<boolean> {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, { method: "HEAD", signal: controller.signal });
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(id);
      }
    }

    async function run() {
      setLoading(true);
      const results = await Promise.all(
        channels.map(async (c) => ({
          ...c,
          alive: await checkChannel(c.url),
        }))
      );
      if (!cancelled) {
        setAliveChannels(results.filter((c) => c.alive));
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [channels, timeout]);

  return { aliveChannels, loading };
}
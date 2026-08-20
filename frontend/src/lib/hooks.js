import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";

/** Shared fetcher with an in-memory cache, keyed by endpoint+params. */
const cache = new Map();

export function useApi(path, params) {
  const key = `${path}?${JSON.stringify(params || {})}`;
  const [data, setData] = useState(cache.get(key) ?? null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    let cancelled = false;
    setLoading(!cache.has(key));
    api
      .get(path, { params })
      .then((r) => {
        cache.set(key, r.data);
        if (!cancelled) {
          setData(r.data);
          setErr(null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, err, loading };
}

// Domain hooks — must start with "use" to satisfy rules-of-hooks.
export const useProfile = () => useApi(endpoints.profile);
export const useExperience = () => useApi(endpoints.experience);
export const useSkills = () => useApi(endpoints.skills);
export const useProjects = (kind) => useApi(endpoints.projects, kind ? { kind } : undefined);
export const useResume = () => useApi(endpoints.resume);

import { useGetSiteContent, getGetSiteContentQueryKey } from '@workspace/api-client-react';

export function useSiteContent() {
  const q = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey(), refetchInterval: 10000, refetchOnWindowFocus: true, refetchOnMount: 'always' } });
  const texts = q.data?.story.texts ?? {};
  return {
    isLoading: q.isLoading, isError: q.isError, refetch: q.refetch, loaded: !!q.data,
    t: (key: string) => texts[key] ?? '',
    partners: [...(q.data?.partners ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    initiatives: [...(q.data?.initiatives ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

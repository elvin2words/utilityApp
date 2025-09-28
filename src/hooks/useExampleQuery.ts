import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type Item = { id: number; title: string; body: string };

export const EXAMPLE_MOCK: Item[] = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: `Mock title ${i + 1}`,
  body: 'This is mock body text for offline mode.',
}));

const fetchItems = async (): Promise<Item[]> => {
  const res = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=10');
  return res.data as Item[];
};

export const useExampleQuery = () =>
  useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

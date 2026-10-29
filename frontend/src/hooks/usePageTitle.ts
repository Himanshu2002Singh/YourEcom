import { useEffect } from 'react';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | YourEcom` : 'YourEcom | Medical Supplies Made Simple';
  }, [title]);
}

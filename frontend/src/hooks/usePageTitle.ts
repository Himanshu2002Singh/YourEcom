import { useEffect } from 'react';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | YourEcom` : 'YourEcom | Disposable Syringes and Medical Disposables';
  }, [title]);
}

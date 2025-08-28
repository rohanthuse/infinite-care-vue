import { Workbox } from 'workbox-window';

let wb: Workbox | undefined;

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js');

    wb.addEventListener('controlling', () => {
      // Service worker is controlling the page
      console.log('Service worker is controlling the page');
    });

    wb.addEventListener('waiting', () => {
      // New service worker is waiting to take control
      console.log('New service worker is waiting');
      
      // Show update prompt to user
      const shouldUpdate = confirm('New version available! Click OK to update.');
      if (shouldUpdate) {
        wb?.messageSkipWaiting();
      }
    });

    wb.register().catch(console.error);
  }
};

export const getSW = () => wb;
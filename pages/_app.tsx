import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BottomNav from '@/components/BottomNav';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const currentPath = router.pathname;
  
  // Hide BottomNav on landing and login pages
  const showBottomNav = currentPath !== '/' && currentPath !== '/login';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>QuickRepp - End of Day Report</title>
        <link rel="icon" href="/logos.png" />
        <link rel="apple-touch-icon" href="/logos.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
      {showBottomNav && <BottomNav />}
    </>
  );
}


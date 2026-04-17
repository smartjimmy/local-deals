import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* Open Graph / social sharing meta */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Local Deals" />
        <meta property="og:title" content="Local Deals — Happy Hours & Specials Near You" />
        <meta property="og:description" content="Discover the best happy hour deals, food specials, and local restaurant offers in the Bay Area." />
        <meta property="og:url" content="https://local-deals-xi.vercel.app" />
        <meta property="og:image" content="https://local-deals-xi.vercel.app/og-image.png?v=2" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Local Deals — Happy Hours & Specials Near You" />
        <meta name="twitter:description" content="Discover the best happy hour deals, food specials, and local restaurant offers in the Bay Area." />
        <meta name="twitter:image" content="https://local-deals-xi.vercel.app/og-image.png?v=2" />

        {/* Apple Smart Banner & PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Local Deals" />
        <meta name="theme-color" content="#E1306C" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}
/* Fix tab bar clipping on mobile Safari and PWA standalone mode.
   React Native Web sets inline height:49px + padding:0 on the tab bar
   container, which gets clipped by Safari's bottom chrome / home indicator.
   :has() targets the parent container; !important overrides inline styles. */
div:has(> [role="tablist"]) {
  height: auto !important;
  min-height: 56px !important;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)) !important;
}
[role="tablist"] {
  padding-bottom: 4px !important;
}`;

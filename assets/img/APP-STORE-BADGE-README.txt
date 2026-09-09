app-store-badge.svg
-------------------
Apple's official "Download on the App Store" badge (black, en-US), fetched from
Apple's App Store Marketing Tools and self-hosted so nothing loads from Apple at
runtime:

  https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us

The artwork is used UNMODIFIED, per Apple's App Store marketing guidelines:
no recolouring, no filters, no rotation, no added effects. Only its display size
changes, and it scales proportionally (see .appstore-badge in css/base.css:
48px tall, above Apple's 40px minimum, with clear space around it).

Apple, the Apple logo and the App Store badge are trademarks of Apple Inc.

To swap the white variant in (better contrast on light backgrounds), replace
this file with .../download-on-the-app-store/white/en-us — no CSS change needed.
Other locales: swap the trailing /en-us for the locale you want.

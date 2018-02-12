garoon-sync
====
[![Build Status](https://travis-ci.org/mtgto/garoon-sync.svg?branch=master)](https://travis-ci.org/mtgto/garoon-sync)
![App Icon](img/icon.png)

Garoon-Sync is a macOS / Windows GUI Application to sync your Cybozu Garoon schedule to Google Calendar.

## Feature
- Sync Garoon schedules to Google Calendar.
  - Support for normal, repeat temprarary and banner schedules.

## Screenshot
### Tutorial
![Tutorial window](img/tutorial.png)

### Menu icon
![Menu icon](img/menu.jpg)

## Todo
- [ ] Sync deleted schedules.
- [ ] Optimize for update request of Google Calendar API to send only difference.
- [ ] Config window (customize sync interval)
- [ ] Remind by System notification
- [ ] Auto Update
- [ ] Crash reporter

## Build
```console
$ npm install --global-style

# for native node modules. see https://electron.atom.io/docs/tutorial/using-native-node-modules
$ npm run rebuild

# If error occurred such as `no <openssl/rsa.h>` on macOS (For Homebrew user):
$ brew install openssl
$ LDFLAGS=-L/usr/local/opt/openssl/lib CPPFLAGS=-I/usr/local/opt/openssl/include npm run rebuild

# see how to generate client id and secret: https://developers.google.com/google-apps/calendar/quickstart/nodejs
$ GOOGLE_CLIENT_ID=XXXX GOOGLE_CLIENT_SECRET=YYYY npm run build

# (optional) If default garoon server exists for your app: (GAROON_EVENT_PAGE_URL must not have query string.)
$ GAROON_URL=http://example.com/ GAROON_EVENT_PAGE_URL=http://example.com/grn/schedule/view.csp \
GOOGLE_CLIENT_ID=XXXX GOOGLE_CLIENT_SECRET=YYYY npm run build
```

## Project structure
All TypeScript files (`*.ts`, `*.tsx`) are compiled by using webpack.

```
src
├── app
│   └── js
│       ├── main
│       │   └── index.ts
│       └── renderer
│           ├── app.tsx
│           ├── components
│           ├── containers
│           ├── modules
│           └── tutorial.tsx
└── tutorial.html
```

- `src/app/js`
  - All JavaScript/TypeScript files are saved in.
- `src/app/js/main`
  - Scripts for Electron's main process.
  - All scripts are bundled to a file by webpack.

## Related
- [ガルーン同期](https://play.google.com/store/apps/details?id=com.forrep.calendar.sync&hl=ja)
  - An android app for sync garoon with google calendar.
- [cybozu/garoon-google](https://github.com/cybozu/garoon-google)
  - Java CUI application for sync garoon with google calendar.

## Thanks
- App icon is created by [ドカベンメーカー](http://arkw.net/data/dokaben/) using [新ドカベンフォント](http://newdokabenfont.blog.jp/).

## License
This software is released under the MIT License, see LICENSE.

import type { CapacitorConfig } from '@capacitor/cli';

const isLocal = process.env.CAP_ENV === 'local';

const config: CapacitorConfig = {
  appId: 'com.pillab.astropillar',
  appName: 'AstroPillar',
  webDir: 'out',
  // 테스트용: 라이브 사이트 로드 (품질 확인 목적)
  // 스토어 제출 전 번들 방식으로 전환 예정
  ...(isLocal ? {} : {
    server: {
      url: 'https://astropillar.com',
      cleartext: false,
    },
  }),
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;

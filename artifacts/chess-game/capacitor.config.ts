import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royalchessclub.app',
  appName: 'Royal Chess Club',
  webDir: 'dist/public',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  plugins: {
    AdMob: {
      // Android AdMob App ID
      appId: 'ca-app-pub-4647188052127146~5480668756',
    },
  },
};

export default config;

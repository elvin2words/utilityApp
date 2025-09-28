import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.API_BASE_URL,
    openWeatherKey: process.env.OPENWEATHER_API_KEY,
    google: {
      expoClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
      androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    },
    appleClientId: process.env.APPLE_CLIENT_ID,
    facebookAppId: process.env.FACEBOOK_APP_ID,
    env: process.env.NODE_ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID, // required by EAS
    },
  },
  ios: {
    ...config.ios,
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
});

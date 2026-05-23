import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://103.150.227.223:2388';
export const BASE_URL = 'http://103.150.227.223:2356';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let isRefreshing = false;
let refreshSubscribers = [];

/**
 * =========================
 * TOKEN HELPERS
 * =========================
 */

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(
      ACCESS_TOKEN_KEY
    );
  } catch (error) {
    console.log(
      'Get access token error:',
      error
    );
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(
      REFRESH_TOKEN_KEY
    );
  } catch (error) {
    console.log(
      'Get refresh token error:',
      error
    );
    return null;
  }
};

export const saveTokens = async (
  accessToken,
  refreshToken
) => {
  try {

    const data = [];

    if (accessToken) {
      data.push([
        ACCESS_TOKEN_KEY,
        accessToken,
      ]);
    }

    if (refreshToken) {
      data.push([
        REFRESH_TOKEN_KEY,
        refreshToken,
      ]);
    }

    if (data.length > 0) {
      await AsyncStorage.multiSet(data);
    }

  } catch (error) {
    console.log(
      'Save token error:',
      error
    );
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
    ]);
  } catch (error) {
    console.log(
      'Clear token error:',
      error
    );
  }
};

/**
 * =========================
 * REFRESH QUEUE
 * =========================
 */

const subscribeTokenRefresh = callback => {
  refreshSubscribers.push(callback);
};

const onRefreshed = token => {
  refreshSubscribers.forEach(callback =>
    callback(token)
  );

  refreshSubscribers = [];
};

/**
 * =========================
 * REFRESH TOKEN
 * =========================
 */

export const refreshAccessToken = async (
  navigation = null
) => {

  try {

    /**
     * Jika sedang refresh,
     * tunggu refresh selesai
     */

    if (isRefreshing) {

      return new Promise(resolve => {

        subscribeTokenRefresh(token => {
          resolve(token);
        });

      });
    }

    isRefreshing = true;

    const refreshToken =
      await getRefreshToken();

    if (!refreshToken) {
      throw new Error(
        'No refresh token available'
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch (e) {
      throw new Error(
        'Invalid JSON response'
      );
    }

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.message ||
        'Refresh failed'
      );
    }

    const newAccessToken =
      data.data.access_token;

    const newRefreshToken =
      data.data.refresh_token ||
      refreshToken;

    await saveTokens(
      newAccessToken,
      newRefreshToken
    );

    onRefreshed(newAccessToken);

    return newAccessToken;

  } catch (error) {

    console.log(
      'Refresh token error:',
      error
    );

    await clearTokens();

    if (navigation) {

      navigation.reset({
        index: 0,
        routes: [
          { name: 'Login' },
        ],
      });
    }

    return null;

  } finally {

    isRefreshing = false;
  }
};

/**
 * =========================
 * API REQUEST
 * =========================
 */

export const apiRequest = async (
  endpoint,
  options = {},
  navigation = null
) => {

  const makeRequest = async (
    accessToken
  ) => {

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers: {
          'Content-Type':
            'application/json',
          Authorization:
            `Bearer ${accessToken}`,
          ...(options.headers || {}),
        },
      }
    );

    return response;
  };

  try {

    let token =
      await getAccessToken();

    if (!token) {
      throw new Error(
        'No access token'
      );
    }

    let response =
      await makeRequest(token);

    /**
     * ACCESS TOKEN EXPIRED
     */

    if (response.status === 401) {

      console.log(
        'Access token expired, refreshing...'
      );

      const newToken =
        await refreshAccessToken(
          navigation
        );

      if (!newToken) {
        throw new Error(
          'Unable to refresh token'
        );
      }

      response =
        await makeRequest(newToken);
    }

    return response;

  } catch (error) {

    console.log(
      'API Request Error:',
      error
    );

    throw error;
  }
};
import axios from 'axios';

const publicRequest = axios.create();
delete publicRequest.defaults.headers.common['Authorization'];
publicRequest.interceptors.request.use((config) => {
  delete config.headers['Authorization'];
  return config;
});

export const checkBlacklist = async (hostname) => {
  try {
    const query = new URLSearchParams({ hostname }).toString();
    const [blacklistRes, abuseipdbRes] = await Promise.allSettled([
      publicRequest.get(`/api/blacklist/quick-check/?${query}`, {
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
      }),
      publicRequest.get(`/api/tools/abuseipdb/?${query}`, {
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
      }),
    ]);

    if (blacklistRes.status === 'rejected') {
      throw blacklistRes.reason;
    }

    const result = blacklistRes.value.data;
    result.abuseipdb = abuseipdbRes.status === 'fulfilled'
      ? abuseipdbRes.value.data
      : null;

    return result;
  } catch (error) {
    handleRequestError(error, 'Error checking blacklist');
  }
};

// True when the backend could not be reached at all (server not running,
// or the dev proxy could not connect), as opposed to a real error message.
const isBackendOffline = (error) => {
  if (!error.response) return Boolean(error.request);
  const { status, data } = error.response;
  const hasMessage = data && typeof data === 'object' && (data.detail || data.error);
  return status >= 500 && !hasMessage;
};

const handleRequestError = (error, customErrorMessage) => {
  if (isBackendOffline(error)) {
    const offlineError = new Error('The live backend is offline.');
    offlineError.offline = true;
    throw offlineError;
  }
  if (error.response) {
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      `HTTP error! status: ${error.response.status}`;
    console.error(detail);
    throw new Error(detail);
  } else if (error.request) {
    console.error('No response received');
    throw new Error('No response received from backend.');
  } else {
    console.error(customErrorMessage || 'Error setting up the request', error.message);
    throw new Error(error.message || customErrorMessage || 'Error setting up the request');
  }
};

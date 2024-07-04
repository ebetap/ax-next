import axios from 'axios';
import NodeCache from 'node-cache';

class AxiosService {
  /**
   * @param {object} config Axios configuration object
   */
  constructor(config = {}) {
    const defaultConfig = {
      baseURL: 'https://api.example.com',
      timeout: 10000,
      headers: { 'X-Custom-Header': 'foobar' },
      retry: false,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 100,
      cacheCheckPeriod: 120,
      globalErrorHandling: true,
      performanceMonitoring: true,
      requestCancellation: true,
      refreshTokenURL: 'https://api.example.com/refresh-token',
      tokenRefreshEnabled: true,
      tokenRefreshThreshold: 300, // in seconds
      ...config,
    };

    this.customAxios = axios.create({
      baseURL: defaultConfig.baseURL,
      timeout: defaultConfig.timeout,
      headers: defaultConfig.headers,
      ...config,
    });

    this.cache = defaultConfig.cacheEnabled ? new NodeCache({ stdTTL: defaultConfig.cacheTTL, checkperiod: defaultConfig.cacheCheckPeriod }) : null;
    this.retry = defaultConfig.retry;
    this.retryDelay = defaultConfig.retryDelay;
    this.globalErrorHandling = defaultConfig.globalErrorHandling;
    this.performanceMonitoring = defaultConfig.performanceMonitoring;
    this.requestCancellation = defaultConfig.requestCancellation;
    this.refreshTokenURL = defaultConfig.refreshTokenURL;
    this.tokenRefreshEnabled = defaultConfig.tokenRefreshEnabled;
    this.tokenRefreshThreshold = defaultConfig.tokenRefreshThreshold;

    if (this.globalErrorHandling) {
      this.setupGlobalErrorHandling();
    }

    if (this.performanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    if (this.requestCancellation) {
      this.setupRequestCancellation();
    }
  }

  setupGlobalErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    window.addEventListener('error', (event) => {
      console.error('Unhandled error occurred:', event.error);
    });
  }

  setupPerformanceMonitoring() {
    this.customAxios.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: new Date() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.customAxios.interceptors.response.use(
      (response) => {
        const metadata = response.config.metadata || {};
        metadata.endTime = new Date();
        metadata.duration = metadata.endTime - metadata.startTime;
        console.log(`Request duration: ${metadata.duration}ms`);
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  setupRequestCancellation() {
    this.pendingRequests = new Map();
    this.customAxios.interceptors.request.use(
      (config) => {
        const cancelToken = axios.CancelToken.source();
        config.cancelToken = cancelToken.token;
        if (config.cancelPrevious !== false) {
          this.cancelPendingRequests(config);
        }
        this.trackRequest(config, cancelToken);
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async refreshToken() {
    try {
      const tokenResponse = await axios.post(this.refreshTokenURL, {
        refreshToken: 'your-refresh-token',
      });
      this.token = tokenResponse.data.token;
      this.tokenExpiration = new Date(new Date().getTime() + tokenResponse.data.expiresIn * 1000);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return Promise.reject(error);
    }
  }

  async getToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.token;
  }

  isTokenExpired() {
    return !this.tokenExpiration || new Date() >= this.tokenExpiration;
  }

  cancelPendingRequests(config) {
    const requestId = this.getRequestId(config);
    if (this.pendingRequests.has(requestId)) {
      const { cancelTokenSource } = this.pendingRequests.get(requestId);
      cancelTokenSource.cancel('Request canceled by user');
      this.pendingRequests.delete(requestId);
    }
  }

  trackRequest(config, cancelTokenSource) {
    const requestId = this.getRequestId(config);
    this.pendingRequests.set(requestId, { cancelTokenSource });
  }

  getRequestId(config) {
    return config.method.toUpperCase() + config.url + JSON.stringify(config.params || {});
  }

  async get(url, params = {}, config = {}) {
    const cacheKey = `${url}_${JSON.stringify(params)}`;
    const cachedResponse = this.cache ? this.cache.get(cacheKey) : null;

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await this.customAxios.get(url, { ...config, params });
      if (this.cache) {
        this.cache.set(cacheKey, response.data);
      }
      return this.handleSuccess(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.customAxios.post(url, data, config);
      return this.handleSuccess(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.customAxios.put(url, data, config);
      return this.handleSuccess(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.customAxios.delete(url, config);
      return this.handleSuccess(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  handleSuccess(response) {
    return response.data;
  }

  handleError(error) {
    if (error.response) {
      if (error.response.status === 401 && this.tokenRefreshEnabled) {
        console.error('Unauthorized, attempting to refresh token');
        return this.refreshToken().then(() => {
          // Retry the failed request
          const originalRequest = error.config;
          return this.customAxios.request(originalRequest);
        }).catch((refreshError) => {
          console.error('Failed to refresh token:', refreshError);
          return Promise.reject(refreshError);
        });
      } else if (error.response.status === 404) {
        console.error('Resource not found:', error.response.config.url);
      } else {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }

  static createInstance(config = {}) {
    return new AxiosService(config);
  }
}

export default AxiosService;

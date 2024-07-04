## Overview

`AxiosService` is a utility class designed to encapsulate Axios HTTP requests with added features such as caching, request cancellation, token management, error handling, and performance monitoring. It aims to provide a robust and flexible HTTP service for modern JavaScript applications.

## Features

1. **Initialization and Configuration**
   - Configures an Axios instance with default or custom settings including base URL, headers, timeout, caching, retry logic, and token management.

2. **Global Error Handling**
   - Listens for unhandled promise rejections and general errors in the `window` context, logging errors to the console.

3. **Performance Monitoring**
   - Intercepts requests to log their start and end times, calculating request durations for performance monitoring.

4. **Request Cancellation**
   - Intercepts requests to enable cancellation using Axios cancel tokens.
   - Tracks ongoing requests to manage and cancel duplicate requests if required.

5. **Token Management**
   - Manages authentication tokens, automatically refreshing expired tokens using a provided refresh token URL.
   - Checks token expiration and refreshes tokens as needed to maintain API access.

6. **HTTP Methods**
   - Provides wrapper methods for common Axios HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with added functionalities such as caching responses and uniform error handling.

7. **Error Handling**
   - Centralized error handling for Axios requests, including automatic retry on token refresh (`401 Unauthorized` error).

8. **Instance Creation**
   - Static method `createInstance()` allows creating instances of `AxiosService` with custom configurations.

## Usage Example

```javascript
import AxiosService from './AxiosService';

// Create an instance of AxiosService with custom configurations
const axiosInstance = AxiosService.createInstance({
  baseURL: 'https://api.example.com',
  headers: {
    'X-Custom-Header': 'foobar',
  },
  cacheEnabled: true,
  retry: true,
  tokenRefreshEnabled: true,
});

// Example GET request
axiosInstance.get('/data', { params: { key: 'value' } })
  .then(data => {
    console.log('Response:', data);
  })
  .catch(error => {
    console.error('Request failed:', error);
  });
```

## Methods

### Constructor

#### `constructor(config = {})`

- Initializes the `AxiosService` instance with default and custom configuration options.
- Configures Axios instance, caching, retry logic, token management, and other features based on provided settings.

### Instance Methods

#### `async refreshToken()`

- Attempts to refresh the authentication token using a specified refresh token URL.
- Updates `token` and `tokenExpiration` upon successful token refresh.

#### `async getToken()`

- Retrieves the current authentication token.
- Refreshes the token if expired or not available.

#### `isTokenExpired()`

- Checks if the current authentication token is expired.

#### `async get(url, params = {}, config = {})`

- Performs a GET request to the specified URL with optional parameters and configuration.
- Implements caching of responses if enabled.

#### `async post(url, data, config = {})`

- Performs a POST request to the specified URL with data and optional configuration.

#### `async put(url, data, config = {})`

- Performs a PUT request to the specified URL with data and optional configuration.

#### `async delete(url, config = {})`

- Performs a DELETE request to the specified URL with optional configuration.

#### `handleSuccess(response)`

- Handles successful HTTP responses, extracting and returning response data.

#### `handleError(error)`

- Centralized error handling for Axios requests.
- Automatically retries requests upon token refresh if `401 Unauthorized` error occurs.
- Logs specific error details including status codes and response data.

### Static Method

#### `static createInstance(config = {})`

- Creates a new instance of `AxiosService` with custom configuration options.
- Returns the initialized instance ready for HTTP requests.

## Error Handling

- Handles various HTTP errors including `401 Unauthorized` for automatic token refresh.
- Logs detailed error information for debugging and monitoring purposes.

## Security Considerations

- Secure handling of authentication tokens and sensitive data such as refresh tokens.
- Usage of secure storage or environment variables for sensitive configurations.

## Performance Monitoring

- Logs request durations to monitor API performance and response times.

## Request Cancellation

- Supports cancellation of ongoing requests to prevent redundant API calls.
- Manages Axios cancel tokens to handle request cancellation efficiently.

## Dependencies

- Requires `axios` for HTTP requests and `node-cache` for caching (optional).

## Example Use Cases

- Building robust API clients for frontend applications.
- Integrating with RESTful APIs that require token-based authentication.
- Managing and monitoring API performance and error handling in JavaScript applications.

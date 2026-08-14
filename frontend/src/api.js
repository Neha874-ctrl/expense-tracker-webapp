const API_BASE_URL = 'http://localhost:5000';

export async function apiFetch(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Essential for sending and receiving session cookies
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('Fetch Error:', error);
    return {
      ok: false,
      status: 0,
      data: { message: `Network or server error: ${error.message}` },
    };
  }
}

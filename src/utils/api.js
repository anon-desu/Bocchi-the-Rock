import { userStore } from '../store/user';

// 【修改】增加了 export，这样 LoginView 也能引用它，不用写两遍
export const API_BASE_URL = ''; 

/**
 * 刷新 Token 的独立逻辑
 * 防止并发请求导致多次刷新，增加了一个简单的锁机制
 */
let isRefreshing = false;
let refreshPromise = null;

async function refreshToken() {
    const store = userStore; 
    const currentRefreshToken = store.refreshToken;

    if (!currentRefreshToken) {
        store.logout();
        throw new Error('No refresh token available.');
    }

    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: currentRefreshToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Session expired.');
            }

            store.updateAccessToken(data.accessToken);
            return data.accessToken;

        } catch (error) {
            console.error('Token refresh failed:', error);
            store.logout();
            throw error;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export const fetchWithAuth = async (url, options = {}) => {
    const store = userStore;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    let token = store.accessToken;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    let response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
        try {
            console.log('Access token expired, attempting to refresh...');
            const newAccessToken = await refreshToken();
            
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(fullUrl, { ...options, headers });

        } catch (refreshError) {
            throw refreshError;
        }
    }

    return response;
};

export const apiLogout = async () => {
    const store = userStore;
    const refreshToken = store.refreshToken;
    const accessToken = store.accessToken;

    try {
        if (refreshToken) {
            await fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : undefined
                },
                body: JSON.stringify({ refreshToken })
            });
        }
    } catch (e) {
        console.warn('Backend logout failed, forcing local logout:', e);
    } finally {
        store.logout();
    }
};

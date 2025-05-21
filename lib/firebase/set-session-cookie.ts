// Helper functions for setting session cookies

/**
 * Sets a cookie with the given name, value, and expiration days
 */
export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
};

/**
 * Gets a cookie by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

/**
 * Removes a cookie by name
 */
export const removeCookie = (name: string) => {
  setCookie(name, "", -1);
};

/**
 * Sets session cookies for vendor authentication
 */
export const setVendorSessionCookies = (uid: string, isTestAccount: boolean = false) => {
  if (!uid) {
    console.error("Cannot set session cookies: No UID provided");
    return;
  }
  
  console.log(`Setting vendor session cookies for UID: ${uid}, isTest: ${isTestAccount}`);
  
  // Set a session cookie that the middleware can check
  setCookie('session', uid, 7);
  
  // Set a flag for test accounts in development mode
  if (isTestAccount && process.env.NODE_ENV === 'development') {
    setCookie('testMode', 'true', 7);
  } else {
    // Ensure testMode is cleared if not a test account
    removeCookie('testMode');
  }
  
  // Set a timestamp for when the session was created
  setCookie('sessionCreated', new Date().toISOString(), 7);
};

/**
 * Clears all vendor session cookies
 */
export const clearVendorSessionCookies = () => {
  console.log("Clearing all vendor session cookies");
  removeCookie('session');
  removeCookie('testMode');
  removeCookie('sessionCreated');
  removeCookie('firebaseToken');
}; 
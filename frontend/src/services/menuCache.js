const safeSessionStorage = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  return window.sessionStorage;
};

export const readSessionStorageJson = (key, fallback = null) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    return fallback;
  }
};

export const writeSessionStorageJson = (key, value) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
};

export const removeSessionStorageKey = (key) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

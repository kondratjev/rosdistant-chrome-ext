const getFromChromeStorage = async <T>(keys: string[]) => {
  return chrome.storage.sync.get(keys) as T;
};

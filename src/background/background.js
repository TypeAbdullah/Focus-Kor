function normalizeDomain(input) {
  if (!input) return "";
  let val = input.trim().toLowerCase();
  val = val.replace(/^https?:\/\//, "");
  val = val.replace(/^www\./, "");
  val = val.split("/")[0].split("?")[0].split("#")[0];
  return val;
}

function isUrlAllowed(urlStr, allowedSites) {
  if (!urlStr) return true;
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    return true;
  }
  const extensionPrefix = chrome.runtime.getURL("");
  if (urlStr.startsWith(extensionPrefix)) {
    return true;
  }
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return true;
    if (!Array.isArray(allowedSites) || allowedSites.length === 0) {
      return false;
    }
    return allowedSites.some(site => {
      const cleanSite = normalizeDomain(site);
      if (!cleanSite) return false;
      return host === cleanSite || host.endsWith("." + cleanSite);
    });
  } catch {
    return true;
  }
}

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.local.set({ focusActive: false });
});

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["allowedSites"]);
  const updates = { focusActive: false };
  if (!Array.isArray(data.allowedSites)) {
    updates.allowedSites = [];
  }
  await chrome.storage.local.set(updates);
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const data = await chrome.storage.local.get(["focusActive", "allowedSites"]);
  if (!data.focusActive) return;
  const allowedSites = data.allowedSites || [];
  if (!isUrlAllowed(details.url, allowedSites)) {
    const blockedUrl = chrome.runtime.getURL("src/blocked/blocked.html");
    chrome.tabs.update(details.tabId, { url: blockedUrl });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const urlToCheck = changeInfo.url || tab.url;
  if (!urlToCheck) return;
  const data = await chrome.storage.local.get(["focusActive", "allowedSites"]);
  if (!data.focusActive) return;
  const allowedSites = data.allowedSites || [];
  if (!isUrlAllowed(urlToCheck, allowedSites)) {
    const blockedUrl = chrome.runtime.getURL("src/blocked/blocked.html");
    chrome.tabs.update(tabId, { url: blockedUrl });
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;
  if (changes.focusActive && changes.focusActive.newValue === true) {
    const data = await chrome.storage.local.get(["allowedSites"]);
    const allowedSites = data.allowedSites || [];
    const tabs = await chrome.tabs.query({});
    const blockedUrl = chrome.runtime.getURL("src/blocked/blocked.html");
    for (const tab of tabs) {
      if (tab.id && tab.url && !isUrlAllowed(tab.url, allowedSites)) {
        chrome.tabs.update(tab.id, { url: blockedUrl });
      }
    }
  }
});


function normalizeDomain(input) {
  if (!input) return "";
  let val = input.trim().toLowerCase();
  val = val.replace(/^https?:\/\//, "");
  val = val.replace(/^www\./, "");
  val = val.split("/")[0].split("?")[0].split("#")[0];
  return val;
}

document.addEventListener("DOMContentLoaded", async () => {
  const modeToggle = document.getElementById("modeToggle");
  const modeLabel = document.getElementById("modeLabel");
  const siteInput = document.getElementById("siteInput");
  const addBtn = document.getElementById("addBtn");
  const addCurrentBtn = document.getElementById("addCurrentBtn");
  const sitesContainer = document.getElementById("sitesContainer");
  const listCount = document.getElementById("listCount");
  const emptyState = document.getElementById("emptyState");

  let state = {
    focusActive: false,
    allowedSites: []
  };

  async function loadState() {
    const data = await chrome.storage.local.get(["focusActive", "allowedSites"]);
    state.focusActive = Boolean(data.focusActive);
    state.allowedSites = Array.isArray(data.allowedSites) ? data.allowedSites : [];
    updateModeUI();
    renderSites();
  }

  function updateModeUI() {
    if (state.focusActive) {
      modeToggle.className = "mode-toggle on";
      modeLabel.textContent = "ON";
    } else {
      modeToggle.className = "mode-toggle off";
      modeLabel.textContent = "OFF";
    }
  }

  function renderSites() {
    listCount.textContent = state.allowedSites.length;
    sitesContainer.innerHTML = "";

    if (state.allowedSites.length === 0) {
      emptyState.textContent = "ADD A WEBSITE FIRST THING TO START";
      sitesContainer.appendChild(emptyState);
      emptyState.style.display = "block";
      return;
    }

    state.allowedSites.forEach(site => {
      const item = document.createElement("div");
      item.className = "site-item";

      const name = document.createElement("span");
      name.className = "site-name";
      name.textContent = site;

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn-remove";
      removeBtn.textContent = "X";
      removeBtn.addEventListener("click", () => removeSite(site));

      item.appendChild(name);
      item.appendChild(removeBtn);
      sitesContainer.appendChild(item);
    });
  }

  async function addSite(domain) {
    const clean = normalizeDomain(domain);
    if (!clean) return;
    if (state.allowedSites.includes(clean)) return;

    state.allowedSites.push(clean);
    await chrome.storage.local.set({ allowedSites: state.allowedSites });
    renderSites();
    siteInput.value = "";
  }

  async function removeSite(domain) {
    state.allowedSites = state.allowedSites.filter(s => s !== domain);
    const updates = { allowedSites: state.allowedSites };
    if (state.allowedSites.length === 0) {
      state.focusActive = false;
      updates.focusActive = false;
      updateModeUI();
    }
    await chrome.storage.local.set(updates);
    renderSites();
  }

  modeToggle.addEventListener("click", async () => {
    if (!state.focusActive && state.allowedSites.length === 0) {
      emptyState.textContent = "ADD A WEBSITE FIRST THING TO START";
      siteInput.focus();
      return;
    }
    state.focusActive = !state.focusActive;
    await chrome.storage.local.set({ focusActive: state.focusActive });
    updateModeUI();
  });

  addBtn.addEventListener("click", () => {
    addSite(siteInput.value);
  });

  siteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addSite(siteInput.value);
    }
  });

  addCurrentBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const clean = normalizeDomain(tab.url);
        if (clean && !clean.includes("chrome-extension://") && !clean.includes("chrome://")) {
          addSite(clean);
        }
      }
    } catch {}
  });

  await loadState();
});

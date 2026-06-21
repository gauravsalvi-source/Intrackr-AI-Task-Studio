(() => {
const API_BASE = "https://intrackr-ai-task-studio-1.onrender.com";

function isContextValid() {
  try {
    return !!(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

const root = document.createElement("div");
root.innerHTML = `
  <aside id="intrackr-ai-sidebar" aria-label="Intrackr AI Task Builder">
    <header id="intrackr-ai-header">
      <span>Create New Task</span>
      <div class="header-actions">
        <button id="intrackr-ai-settings" type="button" title="Settings" aria-label="Settings">
          <svg id="intrackr-ai-settings-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <button id="intrackr-ai-theme" type="button" title="Toggle dark mode" aria-label="Toggle dark mode">
          <svg id="intrackr-ai-theme-icon" class="moon" aria-hidden="true" viewBox="0 0 24 24">
            <path class="moon-shape" d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 7 7 0 1 0 20.5 15.5Z"></path>
            <circle class="sun-shape" cx="12" cy="12" r="4"></circle>
            <path class="sun-shape sun-rays" d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path>
          </svg>
        </button>
        <button id="intrackr-ai-minimize" type="button" title="Minimize" aria-label="Minimize">−</button>
        <button id="intrackr-ai-close" type="button" title="Close" aria-label="Close">×</button>
      </div>
    </header>

    <div id="intrackr-ai-settings-panel" style="display: none;">
      <div class="settings-content">
        <label for="intrackr-ai-openai-key-select">OpenAI API Key (per install)</label>
        <select id="intrackr-ai-openai-key-select" style="width: 100%; margin-bottom: 4px;">
          <option value="">-- Select API Key --</option>
          <option value="gsk_placeholder_key_1">Key 1 (Placeholder 1)</option>
          <option value="gsk_placeholder_key_2">Key 2 (Placeholder 2)</option>
          <option value="gsk_placeholder_key_3">Key 3 (Placeholder 3)</option>
          <option value="custom">Custom Key...</option>
        </select>
        <div id="intrackr-ai-custom-key-container" class="settings-input-group" style="display: none; margin-bottom: 4px;">
          <input id="intrackr-ai-openai-key" type="password" placeholder="Enter sk-proj-... / gsk_..." />
        </div>
        <div class="settings-input-group" style="justify-content: flex-end;">
          <button id="intrackr-ai-save-settings" type="button" class="primary">Save</button>
          <button id="intrackr-ai-clear-settings" type="button">Clear</button>
        </div>
        <p id="intrackr-ai-settings-status"></p>
      </div>
    </div>

    <section id="intrackr-ai-body">
      <label for="intrackr-ai-input">Issue summary</label>
      <textarea id="intrackr-ai-input" placeholder="Example: Shopify export fails when product title has emoji"></textarea>

      <label>Screenshot / Image (Optional)</label>
      <div id="intrackr-ai-image-container" class="image-upload-container">
        <input type="file" id="intrackr-ai-image-input" accept="image/*" style="display: none;" multiple />
        <div id="intrackr-ai-upload-placeholder" class="upload-placeholder">
          <svg class="upload-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <div class="upload-options" style="display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: auto;">
            <div style="display: flex; gap: 4px; justify-content: center; width: 100%;">
              <button id="intrackr-ai-btn-capture" type="button" style="height: 26px; padding: 0 6px; font-size: 11px; margin-bottom: 2px; pointer-events: auto;" title="Capture webpage viewport">📸 Page Viewport</button>
              <button id="intrackr-ai-btn-capture-screen" type="button" style="height: 26px; padding: 0 6px; font-size: 11px; margin-bottom: 2px; pointer-events: auto;" title="Capture full screen or specific window (includes DevTools)">🖥️ Screen/DevTools</button>
            </div>
            <span>or click/drag to upload</span>
          </div>
        </div>
        <div id="intrackr-ai-images-preview-grid" class="images-preview-grid" style="display: none;"></div>
      </div>

      <label for="intrackr-ai-project">Project *</label>
      <select id="intrackr-ai-project" title="Select Project"><option value="">Loading projects...</option></select>

      <div class="toolbar">
        <select id="intrackr-ai-assignee" title="Assignee"><option value="">Assignee</option></select>
        <select id="intrackr-ai-qa-assignee" title="QA Assignee"><option value="">QA Assignee</option></select>
      </div>

      <div class="toolbar">
        <select id="intrackr-ai-priority" title="Priority">
          <option value="P1 - Critical">P1 - Critical</option>
          <option value="P2 - High">P2 - High</option>
          <option value="P3 - Medium">P3 - Medium</option>
          <option value="P4 - Low">P4 - Low</option>
        </select>
        <select id="intrackr-ai-type" title="Task type">
          <option value="Feature">Feature</option>
          <option value="Enhancement">Enhancement</option>
          <option value="Bug">Bug</option>
          <option value="Refactor">Refactor</option>
          <option value="Tech Debt">Tech Debt</option>
          <option value="UI/UX">UI/UX</option>
          <option value="Accessibility">Accessibility</option>
          <option value="Documentation">Documentation</option>
          <option value="Testing/QA">Testing/QA</option>
        </select>
      </div>

      <button id="intrackr-ai-generate" class="primary" type="button">Generate Developer Task</button>

      <label for="intrackr-ai-title">Title *</label>
      <input id="intrackr-ai-title" type="text" placeholder="Enter task title..." />

      <label for="intrackr-ai-output">Description</label>
      <textarea id="intrackr-ai-output" placeholder="The detailed task will appear here."></textarea>

      <button id="intrackr-ai-link-subtask" type="button" class="link-subtask-btn">Add as Sub-task</button>

      <div id="intrackr-ai-parent-link" class="parent-link-banner" hidden>
        <span id="intrackr-ai-parent-link-text"></span>
        <button id="intrackr-ai-parent-link-clear" type="button" title="Remove parent link" aria-label="Remove parent link">×</button>
      </div>

      <div class="footer-actions">
        <button id="intrackr-ai-insert" type="button">Fill Intrackr Form</button>
        <button id="intrackr-ai-save-direct" type="button" class="primary">Save to InTrackr</button>
        <button id="intrackr-ai-copy" type="button">Copy</button>
        <button id="intrackr-ai-reset" type="button">Reset</button>
      </div>

      <p id="intrackr-ai-status" role="status"></p>
    </section>

    <div class="intrackr-ai-credit">Powered by <span>Gaurav</span></div>

    <span class="resize-handle resize-n" data-resize="n"></span>
    <span class="resize-handle resize-e" data-resize="e"></span>
    <span class="resize-handle resize-s" data-resize="s"></span>
    <span class="resize-handle resize-w" data-resize="w"></span>
    <span class="resize-handle resize-ne" data-resize="ne"></span>
    <span class="resize-handle resize-se" data-resize="se"></span>
    <span class="resize-handle resize-sw" data-resize="sw"></span>
    <span class="resize-handle resize-nw" data-resize="nw"></span>
  </aside>

  <button id="intrackr-ai-launcher" type="button" title="Open AI Task Builder" hidden>AI</button>
`;

document.body.appendChild(root);

let generatedTask = null;
let selectedImages = [];
let selectedParentTask = null;
let isSavingToIntrackr = false;
let minimized = false;
let savedSidebarStyle = { width: "", height: "" };

const sidebar = document.getElementById("intrackr-ai-sidebar");
const header = document.getElementById("intrackr-ai-header");
const launcher = document.getElementById("intrackr-ai-launcher");
const input = document.getElementById("intrackr-ai-input");
const projectInput = document.getElementById("intrackr-ai-project");
const assigneeInput = document.getElementById("intrackr-ai-assignee");
const qaAssigneeInput = document.getElementById("intrackr-ai-qa-assignee");
const titleInput = document.getElementById("intrackr-ai-title");
const minimizeButton = document.getElementById("intrackr-ai-minimize");
const output = document.getElementById("intrackr-ai-output");
const status = document.getElementById("intrackr-ai-status");
const generateButton = document.getElementById("intrackr-ai-generate");

const imageContainer = document.getElementById("intrackr-ai-image-container");
const imageInput = document.getElementById("intrackr-ai-image-input");
const uploadPlaceholder = document.getElementById("intrackr-ai-upload-placeholder");
const previewGrid = document.getElementById("intrackr-ai-images-preview-grid");

const saveDirectBtn = document.getElementById("intrackr-ai-save-direct");
const insertBtn = document.getElementById("intrackr-ai-insert");
const linkSubtaskBtn = document.getElementById("intrackr-ai-link-subtask");
const parentLinkBanner = document.getElementById("intrackr-ai-parent-link");
const parentLinkText = document.getElementById("intrackr-ai-parent-link-text");
const parentLinkClearBtn = document.getElementById("intrackr-ai-parent-link-clear");
const captureBtn = document.getElementById("intrackr-ai-btn-capture");
const captureScreenBtn = document.getElementById("intrackr-ai-btn-capture-screen");

const settingsBtn = document.getElementById("intrackr-ai-settings");
const settingsPanel = document.getElementById("intrackr-ai-settings-panel");
const openaiKeyInput = document.getElementById("intrackr-ai-openai-key");
const openaiKeySelect = document.getElementById("intrackr-ai-openai-key-select");
const customKeyContainer = document.getElementById("intrackr-ai-custom-key-container");
const saveSettingsBtn = document.getElementById("intrackr-ai-save-settings");
const clearSettingsBtn = document.getElementById("intrackr-ai-clear-settings");
const settingsStatus = document.getElementById("intrackr-ai-settings-status");


const isOnCreateTaskPage = window.location.href.startsWith("https://intrackr.thalia-apps.com/tasks/create") || (window.location.href.includes("/tasks/") && window.location.href.includes("/edit"));

// Initial state based on current page
if (isOnCreateTaskPage) {
  saveDirectBtn.style.display = "none";
  insertBtn.style.display = "flex";
} else {
  // Hide by default on non-InTrackr tabs
  sidebar.hidden = true;
  launcher.hidden = true;
  saveDirectBtn.style.display = "flex";
  insertBtn.style.display = "none";
}

// Fetch InTrackr projects, users, and QA assignees for dropdowns on load
fetchDropdownData();

// Load saved OpenAI API key if any
if (isContextValid()) {
  chrome.storage.local.get(["intrackr_openai_api_key"], (result) => {
    const savedKey = result.intrackr_openai_api_key || "";
    if (savedKey) {
      const presetKeys = [
        "gsk_placeholder_key_1",
        "gsk_placeholder_key_2",
        "gsk_placeholder_key_3"
      ];
      if (presetKeys.includes(savedKey)) {
        openaiKeySelect.value = savedKey;
        customKeyContainer.style.display = "none";
      } else {
        openaiKeySelect.value = "custom";
        openaiKeyInput.value = savedKey;
        customKeyContainer.style.display = "block";
      }
      updateSettingsStatus(true);
    } else {
      openaiKeySelect.value = "";
      openaiKeyInput.value = "";
      customKeyContainer.style.display = "none";
      updateSettingsStatus(false);
    }
  });
}

function updateSettingsStatus(hasKey) {
  if (hasKey) {
    settingsStatus.textContent = "API Key is saved & active.";
    settingsStatus.className = "active";
  } else {
    settingsStatus.textContent = "No custom key saved. Using backend default.";
    settingsStatus.className = "inactive";
  }
}

// Listen for message from background script to toggle sidebar or capture screenshot
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ ok: true });
    return;
  }

  if (request.action === "toggleSidebar") {
    sidebar.hidden = !sidebar.hidden;
    launcher.hidden = !sidebar.hidden;
    if (!sidebar.hidden) {
      setSidebarMinimized(false);
    }
  } else if (request.action === "openCapturedScreenshot" && request.dataUrl) {
    openAnnotationEditor(request.dataUrl);
  } else if (request.action === "startScreenshotCapture") {
    autoCaptureScreenshot();
  }
});

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = isError ? "error" : "";
}

const STATIC_PROJECTS = [
  {"id": "1", "name": "Shopify"},
  {"id": "2", "name": "CSV Box"},
  {"id": "3", "name": "Spreadr-WIX"},
  {"id": "4", "name": "Fyle Box"},
  {"id": "5", "name": "E-commerce Stores"},
  {"id": "7", "name": "Support"},
  {"id": "8", "name": "Miscellaneous / General Tasks"},
  {"id": "9", "name": "InTrackr"},
  {"id": "10", "name": "Spreadr-Shopify"},
  {"id": "11", "name": "Connectr-Shopify"},
  {"id": "12", "name": "The Watchlyst-Shopify"},
  {"id": "13", "name": "Flo-Shopify"},
  {"id": "14", "name": "Neo-Shopify"},
  {"id": "15", "name": "Exporter-Shopify"},
  {"id": "16", "name": "Prime-Shopify"},
  {"id": "17", "name": "Dual-Shopify"},
  {"id": "18", "name": "Duplicate SKU Sync-Shopify"},
  {"id": "19", "name": "Sleek-Shopify"},
  {"id": "20", "name": "Clever-Shopify"},
  {"id": "21", "name": "Shipr-Shopify"},
  {"id": "22", "name": "Smart-Shopify"},
  {"id": "23", "name": "Robo-Shopify"},
  {"id": "24", "name": "Pro-Shopify"},
  {"id": "25", "name": "Outlink-Shopify"},
  {"id": "26", "name": "Linkr-Shopify"},
  {"id": "27", "name": "Spreadr-BigCommerce"},
  {"id": "28", "name": "Spreadr-WooCommerce"},
  {"id": "29", "name": "Supr Badge-BigCommerce"},
  {"id": "30", "name": "RoadMap"},
  {"id": "31", "name": "Reorder - Shopify"},
  {"id": "32", "name": "WIX Price Editor"},
  {"id": "33", "name": "Bolt-Shopify"}
];

const STATIC_USERS = [
  {"id": "19", "name": "Aniket Rane"},
  {"id": "27", "name": "Ankit Kothari"},
  {"id": "7", "name": "Ankit Mane"},
  {"id": "32", "name": "Ankit Vishwakarma"},
  {"id": "10", "name": "Bhakti Patil"},
  {"id": "26", "name": "Gaurav Salvi"},
  {"id": "14", "name": "Ishwar Asolkar"},
  {"id": "30", "name": "Juhee"},
  {"id": "25", "name": "Lalit Mendadkar"},
  {"id": "12", "name": "Mohammed Sunasara"},
  {"id": "11", "name": "Nehal Wagnak"},
  {"id": "15", "name": "Nikita Yadav"},
  {"id": "4", "name": "Pawan More"},
  {"id": "24", "name": "Prathamesh Gaonkar"},
  {"id": "16", "name": "Riddhi Sawant"},
  {"id": "28", "name": "Rupali Maru"},
  {"id": "9", "name": "Rushabh Kothari"},
  {"id": "18", "name": "Samiran Waghmare"},
  {"id": "22", "name": "Sangeeta Patel"},
  {"id": "23", "name": "Sayali Patil"},
  {"id": "13", "name": "Shivam Sharma"},
  {"id": "20", "name": "Sumit Yewale"},
  {"id": "31", "name": "Sweta"},
  {"id": "8", "name": "Tejas Sangoi"}
];

function saveDraft() {
  if (!isContextValid()) return;
  const draft = {
    summary: input.value,
    title: titleInput.value,
    description: output.value,
    images: selectedImages,
    project: projectInput.value,
    assignee: assigneeInput ? assigneeInput.value : "",
    qaAssignee: qaAssigneeInput ? qaAssigneeInput.value : "",
    priority: document.getElementById("intrackr-ai-priority").value,
    type: document.getElementById("intrackr-ai-type").value
  };
  chrome.storage.local.set({ intrackr_ai_task_draft: draft });
}

function loadDraft() {
  if (!isContextValid()) return;
  chrome.storage.local.get(["intrackr_ai_task_draft"], (result) => {
    const draft = result.intrackr_ai_task_draft;
    if (!draft) return;
    
    input.value = draft.summary || "";
    titleInput.value = draft.title || "";
    output.value = draft.description || "";
    selectedImages = draft.images || [];
    
    if (draft.project && projectInput) projectInput.value = draft.project;
    if (draft.assignee && assigneeInput) assigneeInput.value = draft.assignee;
    if (draft.qaAssignee && qaAssigneeInput) qaAssigneeInput.value = draft.qaAssignee;
    
    const priorityEl = document.getElementById("intrackr-ai-priority");
    if (priorityEl && draft.priority) priorityEl.value = draft.priority;
    
    const typeEl = document.getElementById("intrackr-ai-type");
    if (typeEl && draft.type) typeEl.value = draft.type;
    
    renderPreviews();
  });
}

function clearDraft() {
  if (!isContextValid()) return;
  chrome.storage.local.remove("intrackr_ai_task_draft");
}

function cleanName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim();
}

function fetchDropdownData() {
  const projectSelect = document.getElementById("intrackr-ai-project");
  const assigneeSelect = document.getElementById("intrackr-ai-assignee");
  const qaAssigneeSelect = document.getElementById("intrackr-ai-qa-assignee");

  const prevProj = projectSelect ? projectSelect.value : "";
  const prevAssignee = assigneeSelect ? assigneeSelect.value : "";
  const prevQa = qaAssigneeSelect ? qaAssigneeSelect.value : "";

  if (projectSelect) {
    projectSelect.innerHTML = "";
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = "Select a project *";
    projectSelect.appendChild(defOpt);
  }

  if (assigneeSelect) {
    assigneeSelect.innerHTML = "";
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = "Assignee";
    assigneeSelect.appendChild(defOpt);
  }

  if (qaAssigneeSelect) {
    qaAssigneeSelect.innerHTML = "";
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = "QA Assignee";
    qaAssigneeSelect.appendChild(defOpt);
  }

  if (!isContextValid()) {
    if (projectSelect) {
      STATIC_PROJECTS.forEach(p => {
        if (![...projectSelect.options].some(o => o.value == p.id)) {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          projectSelect.appendChild(opt);
        }
      });
      if (prevProj && [...projectSelect.options].some(o => o.value == prevProj)) {
        projectSelect.value = prevProj;
      }
    }
    if (assigneeSelect) {
      STATIC_USERS.forEach(u => {
        if (![...assigneeSelect.options].some(o => o.value == u.id)) {
          const opt = document.createElement("option");
          opt.value = u.id;
          opt.textContent = cleanName(u.name);
          assigneeSelect.appendChild(opt);
        }
      });
      if (prevAssignee && [...assigneeSelect.options].some(o => o.value == prevAssignee)) {
        assigneeSelect.value = prevAssignee;
      }
    }
    if (qaAssigneeSelect) {
      STATIC_USERS.forEach(u => {
        if (![...qaAssigneeSelect.options].some(o => o.value == u.id)) {
          const opt = document.createElement("option");
          opt.value = u.id;
          opt.textContent = cleanName(u.name);
          qaAssigneeSelect.appendChild(opt);
        }
      });
      if (prevQa && [...qaAssigneeSelect.options].some(o => o.value == prevQa)) {
        qaAssigneeSelect.value = prevQa;
      }
      loadDraft();
    }
    return;
  }

  chrome.runtime.sendMessage({ action: "getProjects" }, (response) => {
    // Populate projects
    if (projectSelect) {
      if (response && response.success && response.projects && response.projects.length > 0) {
        response.projects.forEach(p => {
          if (![...projectSelect.options].some(o => o.value == p.id)) {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            projectSelect.appendChild(opt);
          }
        });
      } else {
        STATIC_PROJECTS.forEach(p => {
          if (![...projectSelect.options].some(o => o.value == p.id)) {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            projectSelect.appendChild(opt);
          }
        });
      }
      if (prevProj && [...projectSelect.options].some(o => o.value == prevProj)) {
        projectSelect.value = prevProj;
      }
    }

    // Populate assignees
    if (assigneeSelect) {
      if (response && response.success && response.users && response.users.length > 0) {
        response.users.forEach(u => {
          if (![...assigneeSelect.options].some(o => o.value == u.id)) {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = cleanName(u.name);
            assigneeSelect.appendChild(opt);
          }
        });
      } else {
        STATIC_USERS.forEach(u => {
          if (![...assigneeSelect.options].some(o => o.value == u.id)) {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = cleanName(u.name);
            assigneeSelect.appendChild(opt);
          }
        });
      }
      if (prevAssignee && [...assigneeSelect.options].some(o => o.value == prevAssignee)) {
        assigneeSelect.value = prevAssignee;
      }
    }

    // Populate QA assignees
    if (qaAssigneeSelect) {
      if (response && response.success && response.qaAssignees && response.qaAssignees.length > 0) {
        response.qaAssignees.forEach(q => {
          if (![...qaAssigneeSelect.options].some(o => o.value == q.id)) {
            const opt = document.createElement("option");
            opt.value = q.id;
            opt.textContent = cleanName(q.name);
            qaAssigneeSelect.appendChild(opt);
          }
        });
      } else {
        STATIC_USERS.forEach(u => {
          if (![...qaAssigneeSelect.options].some(o => o.value == u.id)) {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = cleanName(u.name);
            qaAssigneeSelect.appendChild(opt);
          }
        });
      }
      if (prevQa && [...qaAssigneeSelect.options].some(o => o.value == prevQa)) {
        qaAssigneeSelect.value = prevQa;
      }
      
      // Load shared draft storage once dropdowns are populated
      loadDraft();
    }
  });
}

async function captureScreenshot() {
  return new Promise((resolve, reject) => {
    if (!isContextValid()) {
      reject(new Error("Extension context invalidated. Please reload the webpage."));
      return;
    }
    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else if (response && response.dataUrl) {
        resolve(response.dataUrl);
      } else {
        reject(new Error("Failed to capture screenshot"));
      }
    });
  });
}

async function autoCaptureScreenshot() {
  setStatus("Capturing page screenshot...");
  
  // Hide sidebar temporarily for clean capture
  const prevDisplay = sidebar.style.display;
  sidebar.style.setProperty("display", "none", "important");
  if (launcher) launcher.style.setProperty("display", "none", "important");
  
  setTimeout(async () => {
    try {
      const dataUrl = await captureScreenshot();
      // Restore sidebar
      sidebar.style.display = prevDisplay;
      if (launcher) launcher.style.display = "";
      setStatus("Screenshot captured. Double-click/drag to draw annotations.");
      openAnnotationEditor(dataUrl);
    } catch (e) {
      sidebar.style.display = prevDisplay;
      if (launcher) launcher.style.display = "";
      setStatus("Failed to capture screenshot: " + e.message, true);
    }
  }, 150);
}

async function captureDesktopScreen() {
  return new Promise((resolve, reject) => {
    if (!isContextValid()) {
      reject(new Error("Extension context invalidated. Please reload the webpage."));
      return;
    }
    chrome.runtime.sendMessage({ action: "chooseDesktopMedia" }, async (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response || !response.streamId) {
        reject(new Error("Screen/DevTools capture cancelled or failed."));
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: response.streamId,
              maxWidth: 4000,
              maxHeight: 4000
            }
          }
        });
        
        const video = document.createElement('video');
        video.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(video);
        
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          
          let hasCaptured = false;
          let fallbackTimeout = null;
          
          const captureFrame = () => {
            if (hasCaptured) return;
            
            // Wait until the stream has initialized to a reasonable resolution
            if (video.videoWidth > 640 || fallbackTimeout === null) {
              hasCaptured = true;
              if (fallbackTimeout) clearTimeout(fallbackTimeout);
              
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const dataUrl = canvas.toDataURL('image/png');
              
              // Clean up
              stream.getTracks().forEach(track => track.stop());
              video.remove();
              
              resolve(dataUrl);
            } else {
              // Wait for resize event when Chrome sets the high-res stream
              video.onresize = () => {
                captureFrame();
              };
            }
          };
          
          // Fallback to capture whatever resolution is negotiated after 800ms
          fallbackTimeout = setTimeout(() => {
            fallbackTimeout = null;
            captureFrame();
          }, 800);
          
          setTimeout(captureFrame, 150);
        };
        video.onerror = (e) => {
          reject(new Error("Video playback error during capture"));
        };
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function autoCaptureDesktopScreen() {
  setStatus("Prompting for screen/window capture...");
  
  // Hide sidebar temporarily for clean capture
  const prevDisplay = sidebar.style.display;
  sidebar.style.setProperty("display", "none", "important");
  if (launcher) launcher.style.setProperty("display", "none", "important");
  
  setTimeout(async () => {
    try {
      const dataUrl = await captureDesktopScreen();
      // Restore sidebar
      sidebar.style.display = prevDisplay;
      if (launcher) launcher.style.display = "";
      setStatus("Screen captured. Double-click/drag to draw annotations.");
      openAnnotationEditor(dataUrl);
    } catch (e) {
      sidebar.style.display = prevDisplay;
      if (launcher) launcher.style.display = "";
      setStatus("Failed to capture screen: " + e.message, true);
    }
  }, 150);
}

function drawArrow(ctx, fromx, fromy, tox, toy, scale = 1) {
  const headlen = 15 * scale;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);
  
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 4 * scale;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();
}

function openAnnotationEditor(imgDataUrl) {
  // Remove existing overlay if any
  const old = document.getElementById("intrackr-anno-overlay");
  if (old) old.remove();
  
  const overlay = document.createElement("div");
  overlay.id = "intrackr-anno-overlay";
  overlay.innerHTML = `
    <div class="anno-container">
      <div class="anno-toolbar">
        <span class="anno-title">📸 Annotate Screenshot</span>
        <div class="anno-tools">
          <button id="anno-tool-brush" class="anno-btn active">✏️ Pen</button>
          <button id="anno-tool-rect" class="anno-btn">⬜ Rectangle</button>
          <button id="anno-tool-arrow" class="anno-btn">➡️ Arrow</button>
          <button id="anno-tool-crop" class="anno-btn">✂️ Crop</button>
          <button id="anno-tool-clear" class="anno-btn clear">Clear All</button>
        </div>
        <div class="anno-actions">
          <button id="anno-act-cancel" class="anno-btn cancel">Cancel</button>
          <button id="anno-act-save" class="anno-btn save">Save to Sidebar</button>
        </div>
      </div>
      <div class="anno-workspace">
        <canvas id="intrackr-anno-canvas"></canvas>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const canvas = document.getElementById("intrackr-anno-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  
  let drawing = false;
  let startX = 0;
  let startY = 0;
  let activeTool = "brush"; // brush, rect, arrow, crop
  
  let origW = 0;
  let origH = 0;
  let w = 0;
  let h = 0;
  let scaleFactor = 1;
  let baseLineWidth = 4;
  let savedState = null;
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  function initCanvas() {
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.7;
    origW = img.width;
    origH = img.height;
    
    w = origW;
    h = origH;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
    }
    
    canvas.width = origW;
    canvas.height = origH;
    
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    
    ctx.drawImage(img, 0, 0, origW, origH);
    
    scaleFactor = origW / w;
    baseLineWidth = 4 * scaleFactor;
    
    savedState = ctx.getImageData(0, 0, origW, origH);
  }
  
  img.onload = () => {
    initCanvas();
  };
  img.src = imgDataUrl;
  
  const toolButtons = {
    brush: document.getElementById("anno-tool-brush"),
    rect: document.getElementById("anno-tool-rect"),
    arrow: document.getElementById("anno-tool-arrow"),
    crop: document.getElementById("anno-tool-crop")
  };
  
  Object.keys(toolButtons).forEach(t => {
    toolButtons[t].addEventListener("click", () => {
      Object.values(toolButtons).forEach(b => b.classList.remove("active"));
      toolButtons[t].classList.add("active");
      activeTool = t;
    });
  });
  
  document.getElementById("anno-tool-clear").addEventListener("click", () => {
    ctx.drawImage(img, 0, 0, origW, origH);
    savedState = ctx.getImageData(0, 0, origW, origH);
  });
  
  document.getElementById("anno-act-cancel").addEventListener("click", () => {
    overlay.remove();
    sidebar.hidden = false;
    launcher.hidden = true;
    setSidebarMinimized(false);
  });
  
  document.getElementById("anno-act-save").addEventListener("click", () => {
    const annotatedBase64 = exportCanvasToScreenshotDataUrl(canvas, canvas.width, canvas.height);
    selectedImages.push(annotatedBase64);
    renderPreviews();
    overlay.remove();
    sidebar.hidden = false;
    launcher.hidden = true;
    setSidebarMinimized(false);
    setStatus("Annotated screenshot added successfully.");
    saveDraft();
  });
  
  // Helper to get correctly scaled canvas coordinates
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  // Drawing event listeners
  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    
    savedState = ctx.getImageData(0, 0, origW, origH);
    
    if (activeTool === "brush") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = baseLineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  });
  
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const pos = getMousePos(e);
    const currX = pos.x;
    const currY = pos.y;
    
    if (activeTool === "brush") {
      ctx.lineTo(currX, currY);
      ctx.stroke();
    } else {
      ctx.putImageData(savedState, 0, 0);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = baseLineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (activeTool === "rect") {
        ctx.strokeRect(startX, startY, currX - startX, currY - startY);
      } else if (activeTool === "arrow") {
        drawArrow(ctx, startX, startY, currX, currY, scaleFactor);
      } else if (activeTool === "crop") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5 * scaleFactor;
        ctx.setLineDash([4 * scaleFactor, 4 * scaleFactor]);
        ctx.strokeRect(startX, startY, currX - startX, currY - startY);
        
        ctx.strokeStyle = "#000000";
        ctx.lineDashOffset = 4 * scaleFactor;
        ctx.strokeRect(startX, startY, currX - startX, currY - startY);
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
    }
  });
  
  canvas.addEventListener("mouseup", (e) => {
    if (!drawing) return;
    drawing = false;
    
    const pos = getMousePos(e);
    const currX = pos.x;
    const currY = pos.y;
    
    if (activeTool === "crop") {
      const x = Math.min(startX, currX);
      const y = Math.min(startY, currY);
      const cropW = Math.abs(currX - startX);
      const cropH = Math.abs(currY - startY);
      
      if (cropW > 20 && cropH > 20) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cropW;
        tempCanvas.height = cropH;
        const tempCtx = tempCanvas.getContext("2d");
        configureHighQualityCanvasContext(tempCtx);
        
        tempCtx.drawImage(canvas, x, y, cropW, cropH, 0, 0, cropW, cropH);
        
        const croppedDataUrl = tempCanvas.toDataURL("image/png");
        
        activeTool = "brush";
        Object.keys(toolButtons).forEach(t => {
          if (t === "brush") toolButtons[t].classList.add("active");
          else toolButtons[t].classList.remove("active");
        });
        
        img.src = croppedDataUrl;
      } else {
        ctx.putImageData(savedState, 0, 0);
      }
    } else {
      savedState = ctx.getImageData(0, 0, origW, origH);
    }
  });
  
  canvas.addEventListener("mouseleave", () => {
    if (drawing) {
      drawing = false;
      if (activeTool === "crop") {
        ctx.putImageData(savedState, 0, 0);
      } else {
        savedState = ctx.getImageData(0, 0, origW, origH);
      }
    }
  });
}

async function saveTaskToInTrackr() {
  if (isSavingToIntrackr) return;

  const title = titleInput.value.trim();
  const description = output.value.trim();
  const projectSelect = document.getElementById("intrackr-ai-project");
  const projectId = projectSelect ? projectSelect.value : "";
  const assigneeSelect = document.getElementById("intrackr-ai-assignee");
  const assigneeId = assigneeSelect ? assigneeSelect.value : "";
  const qaAssigneeSelect = document.getElementById("intrackr-ai-qa-assignee");
  const qaAssigneeId = qaAssigneeSelect ? qaAssigneeSelect.value : "";
  
  const priorityMap = {
    "P1 - Critical": "p1",
    "P2 - High": "p2",
    "P3 - Medium": "p3",
    "P4 - Low": "p4"
  };
  const rawPriority = document.getElementById("intrackr-ai-priority").value;
  const priority = priorityMap[rawPriority] || "p3";
  const type = document.getElementById("intrackr-ai-type").value;

  if (!title) {
    setStatus("Please enter or generate a task title first.", true);
    titleInput.focus();
    return;
  }

  if (!projectId) {
    setStatus("Please select a project.", true);
    if (projectSelect) projectSelect.focus();
    return;
  }

  setStatus("Saving task to InTrackr...");
  isSavingToIntrackr = true;
  saveDirectBtn.disabled = true;

  const payload = {
    title,
    description: description || title,
    project_id: projectId,
    priority,
    status: "todo",
    type,
    images: selectedImages,
    user_id: assigneeId,
    assignee_id: assigneeId,
    assigned_to: assigneeId,
    qa_assignee_id: qaAssigneeId,
    qa_user_id: qaAssigneeId
  };

  const parentId = resolveParentTaskId();
  if (parentId) {
    payload.parent_task_id = parentId;
  }

  if (!isContextValid()) {
    setStatus("Extension context invalidated. Please reload the webpage to save to InTrackr.", true);
    isSavingToIntrackr = false;
    saveDirectBtn.disabled = false;
    return;
  }

  chrome.runtime.sendMessage({ action: "createTaskInTrackr", payload }, (response) => {
    isSavingToIntrackr = false;
    saveDirectBtn.disabled = false;
    if (response && response.success) {
      const parentMsg = response.subtask && parentId
        ? ` Added as sub-task of #${getStoredParentTask()?.displayId || parentId}.`
        : "";
      setStatus("Task saved directly to InTrackr successfully!" + parentMsg);
      clearDraft();
    } else {
      setStatus(response && response.error ? response.error : "Failed to save task to InTrackr.", true);
    }
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function getLabelClass(label) {
  const normalized = String(label).toLowerCase();
  if (normalized.includes("bug")) return "label-bug";
  if (normalized.includes("enhancement") || normalized.includes("feature")) return "label-enhancement";
  return "label-default";
}

const PARENT_TASK_STORAGE_KEY = "intrackrAiSelectedParentTask";

function persistSelectedParentTask(task) {
  try {
    if (task) {
      sessionStorage.setItem(PARENT_TASK_STORAGE_KEY, JSON.stringify(task));
    } else {
      sessionStorage.removeItem(PARENT_TASK_STORAGE_KEY);
    }
  } catch (e) {
    // ignore storage errors
  }
}

function getStoredParentTask() {
  if (selectedParentTask?.id || selectedParentTask?.displayId) {
    return selectedParentTask;
  }
  try {
    const raw = sessionStorage.getItem(PARENT_TASK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function resolveParentTaskId(task = null) {
  const source = task || getStoredParentTask();
  if (!source) return "";
  const id = source.id ?? source.displayId ?? source.task_id ?? source.number;
  return String(id || "").replace(/^#/, "").trim();
}

function updateParentLinkBanner() {
  if (!parentLinkBanner || !parentLinkText) return;

  if (selectedParentTask) {
    parentLinkText.textContent = `Sub-task of #${selectedParentTask.displayId || selectedParentTask.id} ${selectedParentTask.title}`;
    parentLinkBanner.hidden = false;
  } else {
    parentLinkBanner.hidden = true;
    parentLinkText.textContent = "";
  }
}

function setSelectedParentTask(task) {
  selectedParentTask = task;
  persistSelectedParentTask(task);
  updateParentLinkBanner();
}

(function restoreParentFromStorage() {
  const stored = getStoredParentTask();
  if (stored) {
    selectedParentTask = stored;
    updateParentLinkBanner();
  }
})();

function lookupTaskById(taskId) {
  return new Promise((resolve, reject) => {
    if (!isContextValid()) {
      reject(new Error("Extension context invalidated. Reload the page and try again."));
      return;
    }

    chrome.runtime.sendMessage({ action: "lookupTaskById", taskId }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.success && response.task) {
        resolve(response.task);
      } else {
        reject(new Error(response?.error || "Task not found."));
      }
    });
  });
}

function renderParentTaskList(container, tasks, selectedId, onSelect) {
  container.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtask-picker-empty";
    empty.textContent = "Look up a task by its number to select a parent.";
    container.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "subtask-picker-item" + (selectedId === task.id ? " selected" : "");
    item.dataset.taskId = task.id;

    const main = document.createElement("div");
    main.className = "subtask-picker-item-main";

    const titleLine = document.createElement("div");
    titleLine.className = "subtask-picker-title";
    titleLine.textContent = `#${task.displayId || task.id} ${task.title}`;

    const metaLine = document.createElement("div");
    metaLine.className = "subtask-picker-meta";

    const metaParts = [];
    if (task.status) metaParts.push(task.status);
    if (task.assignee) metaParts.push(task.assignee);

    metaParts.forEach((part, index) => {
      if (index > 0) {
        const dot = document.createElement("span");
        dot.className = "subtask-picker-dot";
        dot.textContent = "•";
        metaLine.appendChild(dot);
      }
      const span = document.createElement("span");
      span.textContent = part;
      metaLine.appendChild(span);
    });

    if (task.labels && task.labels.length > 0) {
      task.labels.forEach(label => {
        const dot = document.createElement("span");
        dot.className = "subtask-picker-dot";
        dot.textContent = "•";
        metaLine.appendChild(dot);

        const pill = document.createElement("span");
        pill.className = `subtask-picker-label ${getLabelClass(label)}`;
        pill.textContent = label;
        metaLine.appendChild(pill);
      });
    }

    main.appendChild(titleLine);
    main.appendChild(metaLine);

    const time = document.createElement("span");
    time.className = "subtask-picker-time";
    time.textContent = formatRelativeTime(task.updatedAt);

    item.appendChild(main);
    item.appendChild(time);
    item.addEventListener("click", () => onSelect(task));
    container.appendChild(item);
  });
}

function openParentTaskPickerModal() {
  const old = document.getElementById("intrackr-subtask-picker-overlay");
  if (old) old.remove();

  let pickedTask = selectedParentTask;

  const overlay = document.createElement("div");
  overlay.id = "intrackr-subtask-picker-overlay";
  overlay.innerHTML = `
    <div class="subtask-picker-modal" role="dialog" aria-modal="true" aria-labelledby="subtask-picker-title">
      <div class="subtask-picker-header">
        <h2 id="subtask-picker-title">Add as sub-task to another task</h2>
        <button type="button" class="subtask-picker-close" aria-label="Close">×</button>
      </div>
      <div class="subtask-picker-manual">
        <span>Enter parent task #</span>
        <input type="text" class="subtask-picker-manual-id" placeholder="e.g. 2473" inputmode="numeric" />
        <button type="button" class="subtask-picker-manual-btn">Look up</button>
      </div>
      <div class="subtask-picker-list"></div>
      <div class="subtask-picker-actions">
        <button type="button" class="subtask-picker-confirm" disabled>Confirm</button>
      </div>
      <p class="subtask-picker-status" role="status"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector(".subtask-picker-close");
  const confirmBtn = overlay.querySelector(".subtask-picker-confirm");
  const manualIdInput = overlay.querySelector(".subtask-picker-manual-id");
  const manualIdBtn = overlay.querySelector(".subtask-picker-manual-btn");
  const listEl = overlay.querySelector(".subtask-picker-list");
  const pickerStatus = overlay.querySelector(".subtask-picker-status");

  function closeModal() {
    overlay.remove();
  }

  function updateConfirmState() {
    confirmBtn.disabled = !pickedTask;
  }

  function selectTask(task) {
    pickedTask = task;
    renderParentTaskList(listEl, [task], pickedTask?.id, selectTask);
    updateConfirmState();
  }

  async function applyManualTaskId() {
    const raw = manualIdInput.value.trim().replace(/^#/, "");
    if (!raw) {
      pickerStatus.textContent = "Enter a task number (e.g. 2473).";
      pickerStatus.className = "subtask-picker-status error";
      return;
    }

    if (!/^\d+$/.test(raw)) {
      pickerStatus.textContent = "Enter a numeric task ID (e.g. 2473).";
      pickerStatus.className = "subtask-picker-status error";
      return;
    }

    pickerStatus.textContent = `Looking up task #${raw}...`;
    pickerStatus.className = "subtask-picker-status";

    try {
      const task = await lookupTaskById(raw);
      selectTask(task);
      pickerStatus.textContent = `Found: #${task.displayId || task.id} ${task.title}. Click Confirm to add as sub-task.`;
      pickerStatus.className = "subtask-picker-status";
    } catch (error) {
      pickedTask = null;
      listEl.innerHTML = "";
      updateConfirmState();
      pickerStatus.textContent = error.message;
      pickerStatus.className = "subtask-picker-status error";
    }
  }

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  confirmBtn.addEventListener("click", () => {
    if (!pickedTask) return;
    setSelectedParentTask(pickedTask);
    setStatus(`Will add as sub-task of #${pickedTask.displayId || pickedTask.id}. Save to create.`);
    closeModal();
  });

  manualIdBtn.addEventListener("click", applyManualTaskId);
  manualIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyManualTaskId();
  });

  if (pickedTask) {
    manualIdInput.value = String(pickedTask.displayId || pickedTask.id);
    renderParentTaskList(listEl, [pickedTask], pickedTask.id, selectTask);
  }

  updateConfirmState();
  manualIdInput.focus();
}

function cleanListItem(item) {
  return String(item)
    .replace(/^\s*(?:\d+(?:\.\d+)*[\s.)-]*|[-*+•])\s*/, "")
    .trim();
}

function taskToText(task) {
  if (!task) return "";

  const steps = (task.steps || []).map(cleanListItem);

  const sections = [
    task.description || "",
    "",
    "Steps to Reproduce / Context:",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Expected Result:",
    task.expectedResult || "",
    "",
    "Actual Result:",
    task.actualResult || ""
  ];

  return sections.join("\n").trim();
}

async function generateTask() {
  const prompt = input.value.trim();

  if (!prompt && selectedImages.length === 0) {
    setStatus("Add a short issue description or upload an image first.", true);
    input.focus();
    return;
  }

  setStatus("Generating task...");
  generateButton.disabled = true;

  try {
    const customKey = await new Promise((resolve) => {
      if (isContextValid()) {
        chrome.storage.local.get(["intrackr_openai_api_key"], (result) => {
          resolve(result.intrackr_openai_api_key || "");
        });
      } else {
        resolve("");
      }
    });

    const headers = {
      "Content-Type": "application/json"
    };
    if (customKey) {
      headers["x-openai-api-key"] = customKey;
    }

    const response = await fetch(`${API_BASE}/create-task`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        priority: document.getElementById("intrackr-ai-priority").value,
        type: document.getElementById("intrackr-ai-type").value,
        project: projectInput.value.trim(),
        pageUrl: window.location.href,
        images: selectedImages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to create task");
    }

    generatedTask = data.task;
    titleInput.value = generatedTask.title || "";
    output.value = taskToText(generatedTask);
    setStatus("Task ready. Review it, then fill the form.");
    saveDraft();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    generateButton.disabled = false;
  }
}

function visible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function belongsToSidebar(element) {
  return Boolean(element.closest("#intrackr-ai-sidebar, #intrackr-ai-launcher"));
}

function getFieldLabel(field) {
  const labels = [];
  const id = field.getAttribute("id");
  const name = field.getAttribute("name");
  const placeholder = field.getAttribute("placeholder");
  const ariaLabel = field.getAttribute("aria-label");

  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) labels.push(label.textContent);
  }

  const wrapperLabel = field.closest("label");
  if (wrapperLabel) labels.push(wrapperLabel.textContent);

  let parent = field.parentElement;
  for (let depth = 0; parent && depth < 3; depth += 1) {
    const labelLike = parent.querySelector("label, .label, [class*='label'], [class*='Label']");
    if (labelLike) labels.push(labelLike.textContent);
    parent = parent.parentElement;
  }

  labels.push(id, name, placeholder, ariaLabel);
  return labels.filter(Boolean).join(" ").toLowerCase();
}

function createDraftKey() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTipTapDescriptionDoc(text, imageUrls = []) {
  const content = [];
  const blocks = String(text || "").trim().split(/\n{2,}/).filter(Boolean);

  blocks.forEach(block => {
    const lines = block.split("\n");
    const paragraphContent = [];

    lines.forEach((line, index) => {
      if (index > 0) paragraphContent.push({ type: "hardBreak" });
      const labelMatch = line.match(/^([^:\n]+:)(.*)$/);
      if (labelMatch && /^(Steps to Reproduce|Expected Result|Actual Result)/i.test(labelMatch[1])) {
        paragraphContent.push({ type: "text", text: labelMatch[1], marks: [{ type: "bold" }] });
        if (labelMatch[2]) paragraphContent.push({ type: "text", text: labelMatch[2] });
      } else {
        paragraphContent.push({ type: "text", text: line });
      }
    });

    content.push({
      type: "paragraph",
      content: paragraphContent.length ? paragraphContent : [{ type: "text", text: block }]
    });
  });

  if (imageUrls.length) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: "Screenshots:", marks: [{ type: "bold" }] }]
    });
    imageUrls.forEach(url => {
      content.push({
        type: "image",
        attrs: { src: url, alt: "Screenshot", title: "Screenshot" }
      });
    });
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function buildTipTapDescriptionPayload(text, imageUrls = []) {
  if (!imageUrls.length) return String(text || "");
  return JSON.stringify(buildTipTapDescriptionDoc(text, imageUrls));
}

function tipTapDocToHtml(doc) {
  if (!doc?.content) return "";

  return doc.content.map(node => {
    if (node.type === "paragraph") {
      const inner = (node.content || []).map(child => {
        if (child.type === "hardBreak") return "<br>";
        if (child.type !== "text") return "";
        const text = escapeHtml(child.text || "");
        return child.marks?.some(mark => mark.type === "bold") ? `<strong>${text}</strong>` : text;
      }).join("");
      return `<p>${inner}</p>`;
    }

    if (node.type === "image") {
      const src = escapeHtml(node.attrs?.src || "");
      const alt = escapeHtml(node.attrs?.alt || "Screenshot");
      return `<p><img src="${src}" alt="${alt}"></p>`;
    }

    return "";
  }).join("");
}

function syncDescriptionHiddenField(editor, payload) {
  const form = editor?.closest("form") || document.querySelector("form");
  const hidden = form?.querySelector('input[name="description"]')
    || document.querySelector('input[name="description"]');
  if (hidden) {
    hidden.value = payload;
  }
}

function syncDraftKeyField(draftKey) {
  if (!draftKey) return;
  const form = document.querySelector("form");
  const draftField = form?.querySelector('input[name="draft_key"]')
    || document.querySelector('input[name="draft_key"]');
  if (draftField) {
    draftField.value = draftKey;
  }
}

function dispatchDescriptionFieldEvents(field) {
  field.dispatchEvent(new Event("beforeinput", { bubbles: true }));
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
}

function setDescriptionFieldValue(field, text, imageUrls = []) {
  if (!field) return;

  if (!imageUrls.length) {
    setFieldValue(field, text);
    return;
  }

  const doc = buildTipTapDescriptionDoc(text, imageUrls);
  const payload = JSON.stringify(doc);
  const html = tipTapDocToHtml(doc);

  field.focus();

  if (field.isContentEditable || field.classList?.contains("ProseMirror")) {
    field.innerHTML = html;
    syncDescriptionHiddenField(field, payload);
    dispatchDescriptionFieldEvents(field);
    return;
  }

  const prototype = Object.getPrototypeOf(field);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(field, payload);
  } else {
    field.value = payload;
  }
  dispatchDescriptionFieldEvents(field);
}

function setFieldValue(field, value) {
  field.focus();

  if (field.tagName === "SELECT") {
    const normalizedValue = String(value).trim().toLowerCase();
    const matchingOption = [...field.options].find(option => {
      const optionText = option.textContent.trim().toLowerCase();
      const optionValue = option.value.trim().toLowerCase();
      return optionText === normalizedValue ||
        optionValue === normalizedValue ||
        optionText.includes(normalizedValue) ||
        normalizedValue.includes(optionText);
    });

    if (matchingOption) {
      field.value = matchingOption.value;
    }
  } else if (field.isContentEditable) {
    field.innerHTML = "";
    const paragraphs = String(value).split(/\n{2,}/).filter(Boolean);

    for (const paragraph of paragraphs.length ? paragraphs : [""]) {
      const paragraphElement = document.createElement("p");
      paragraphElement.textContent = paragraph;
      field.appendChild(paragraphElement);
    }
  } else {
    const prototype = Object.getPrototypeOf(field);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor?.set) {
      descriptor.set.call(field, value);
    } else {
      field.value = value;
    }
  }

  field.dispatchEvent(new Event("beforeinput", { bubbles: true }));
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
}

function textMatchesLabel(text, pattern) {
  return pattern.test(String(text).replace(/\*/g, "").trim().toLowerCase());
}

function getPageFields() {
  return [...document.querySelectorAll([
    "input:not([type='hidden'])",
    "textarea",
    "select",
    "[contenteditable='true']",
    "[role='textbox']",
    "[role='combobox']",
    ".ProseMirror"
  ].join(", "))]
    .filter(field => visible(field) && !belongsToSidebar(field));
}

function findFieldAfterLabel(labelPattern, fieldSelector) {
  const labels = [...document.querySelectorAll("label, .label, [class*='label'], [class*='Label']")]
    .filter(label => visible(label) && !belongsToSidebar(label));
  const label = labels.find(item => textMatchesLabel(item.textContent, labelPattern));

  if (!label) return null;

  const container = label.closest("div, section, form, article") || label.parentElement || document.body;
  const scopedField = [...container.querySelectorAll(fieldSelector)]
    .find(field => visible(field) && !belongsToSidebar(field));

  if (scopedField) return scopedField;

  const allFields = getPageFields();
  return allFields.find(field => {
    const labelRect = label.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    return fieldRect.top >= labelRect.bottom - 4;
  });
}

// Find fields using common labels
function findField(patterns) {
  const fields = getPageFields();

  return fields.find(field => {
    const label = getFieldLabel(field);
    return patterns.some(pattern => pattern.test(label));
  });
}

function findLargestTextarea() {
  return [...document.querySelectorAll("textarea, [contenteditable='true'], [role='textbox']")]
    .filter(field => visible(field) && !belongsToSidebar(field))
    .sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return (bRect.width * bRect.height) - (aRect.width * aRect.height);
    })[0];
}

function findFirstVisibleInput() {
  return [...document.querySelectorAll("input:not([type='hidden'])")]
    .filter(field => visible(field) && !belongsToSidebar(field))[0];
}

function findTaskCategoryOption(category) {
  const normalizedCategory = String(category).trim().toLowerCase();
  if (!normalizedCategory) return null;

  let textNodes = [];
  try {
    textNodes = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, strong, b, div, button, a, label"));
  } catch (e) {
    console.warn("Intrackr: Query selector for text nodes failed", e);
  }
  const filteredTextNodes = textNodes.filter(element => visible(element) && !belongsToSidebar(element));

  const titleElement = filteredTextNodes.find(element => {
    const text = element.textContent.trim().replace(/\s+/g, " ").toLowerCase();
    return text === normalizedCategory;
  });

  if (titleElement) {
    let clickable = null;
    try {
      clickable = titleElement.closest('button, label, [role="button"], [tabindex]');
    } catch (e) {
      console.warn("Intrackr: closest clickable query failed", e);
    }
    if (clickable) return clickable;

    const card = [...getAncestors(titleElement)].find(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 160 && rect.width <= 420 && rect.height >= 60 && rect.height <= 180;
    });

    return card || titleElement;
  }

  let cards = [];
  try {
    cards = Array.from(document.querySelectorAll('button, label, [role="button"], [tabindex], article, section, div'));
  } catch (e) {
    console.warn("Intrackr: Query selector for cards failed", e);
  }
  const filteredCards = cards.filter(element => visible(element) && !belongsToSidebar(element));

  return filteredCards.find(element => {
    const text = element.textContent.trim().replace(/\s+/g, " ").toLowerCase();
    const rect = element.getBoundingClientRect();
    return text.startsWith(normalizedCategory) && rect.width >= 120 && rect.height >= 60;
  });
}

function getAncestors(element) {
  const ancestors = [];
  let current = element.parentElement;

  while (current && current !== document.body) {
    ancestors.push(current);
    current = current.parentElement;
  }

  return ancestors;
}

function selectTaskCategory(category) {
  const option = findTaskCategoryOption(category);
  if (!option) return false;

  option.scrollIntoView({ block: "center", inline: "nearest" });
  const rect = option.getBoundingClientRect();
  const eventInit = {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    view: window
  };

  option.dispatchEvent(new PointerEvent("pointerdown", eventInit));
  option.dispatchEvent(new MouseEvent("mousedown", eventInit));
  option.dispatchEvent(new PointerEvent("pointerup", eventInit));
  option.dispatchEvent(new MouseEvent("mouseup", eventInit));
  option.dispatchEvent(new MouseEvent("click", eventInit));
  option.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function renderPreviews() {
  if (!previewGrid) return;
  previewGrid.innerHTML = "";
  
  if (selectedImages.length === 0) {
    previewGrid.style.display = "none";
    uploadPlaceholder.hidden = false;
  } else {
    previewGrid.style.display = "flex";
  }

  selectedImages.forEach((imgBase64, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    
    const img = document.createElement("img");
    img.src = imgBase64;
    img.alt = `Preview ${index + 1}`;
    
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove image";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedImages.splice(index, 1);
      renderPreviews();
      setStatus(`Image ${index + 1} removed.`);
      saveDraft();
    });
    
    item.appendChild(img);
    item.appendChild(removeBtn);
    previewGrid.appendChild(item);
  });
}

function findPageFileInput() {
  const pageFileInputs = [...document.querySelectorAll("input[type='file']")]
    .filter(field => !belongsToSidebar(field));
    
  if (pageFileInputs.length === 0) return null;
  if (pageFileInputs.length === 1) return pageFileInputs[0];
  
  return pageFileInputs.find(field => {
    const label = getFieldLabel(field);
    return /image|screenshot|file|attachment|upload/i.test(label);
  }) || pageFileInputs[0];
}

function setFileInputFiles(inputField, base64Strings) {
  const dataTransfer = new DataTransfer();
  
  base64Strings.forEach((base64, index) => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const filename = `image_${index + 1}.${mime.split('/')[1]}`;
    const file = new File([u8arr], filename, { type: mime });
    dataTransfer.items.add(file);
  });
  
  inputField.files = dataTransfer.files;
  inputField.dispatchEvent(new Event("change", { bubbles: true }));
}

async function uploadImage(imgBase64, draftKey = null) {
  const arr = imgBase64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  
  const xsrfCookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
  const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.split('=')[1]) : '';
  
  const formData = new FormData();
  formData.append("image", blob, getScreenshotFilenamePrefix(imgBase64));
  formData.append("draft_key", draftKey || createDraftKey());
  
  const response = await fetch("https://intrackr.thalia-apps.com/tasks/description-images", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "X-Inertia": "true",
      "X-Requested-With": "XMLHttpRequest",
      "X-XSRF-TOKEN": xsrfToken
    },
    body: formData,
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    url: data.url || data.path || data.src || "",
    html: data.html || data.tag || null
  };
}

async function fillIntrackrForm() {
  if (!generatedTask && output.value.trim()) {
    generatedTask = {
      title: input.value.trim() || "AI generated task",
      description: output.value.trim(),
      priority: document.getElementById("intrackr-ai-priority").value,
      project: projectInput.value.trim(),
      type: document.getElementById("intrackr-ai-type").value,
      steps: [],
      acceptanceCriteria: []
    };
  }

  if (!generatedTask) {
    setStatus("Generate a task first.", true);
    return;
  }

  const titleField = findFieldAfterLabel(/^title$/, "input:not([type='hidden']), textarea, [contenteditable='true'], [role='textbox']") ||
    findField([/title/, /task name/, /\bname\b/, /subject/]) ||
    findFirstVisibleInput();
  const descriptionField = findFieldAfterLabel(/^description$/, "textarea, [contenteditable='true'], [role='textbox'], .ProseMirror") ||
    findField([/description/, /details/, /summary/, /issue/]) ||
    findLargestTextarea();
  const projectField = findFieldAfterLabel(/^project$/, "select, input:not([type='hidden']), [role='combobox']") ||
    findField([/project/]);
  const priorityField = findFieldAfterLabel(/^priority$/, "select, input:not([type='hidden']), [role='combobox']") ||
    findField([/priority/]);
  const typeField = findField([/\btype\b/, /category/]);

  const assigneeField = findFieldAfterLabel(/assignee|assign to/i, "select, input:not([type='hidden']), [role='combobox']") ||
    findField([/assignee/, /assign to/, /assign_id/, /user_id/]);
  const qaAssigneeField = findFieldAfterLabel(/qa assignee|qa/i, "select, input:not([type='hidden']), [role='combobox']") ||
    findField([/qa assignee/, /qa_assignee/, /qa_user/, /qa_id/]);

  const titleValue = titleInput.value.trim() || generatedTask.title || "";
  const descriptionValue = output.value.trim() || taskToText(generatedTask);
  const projectValue = projectInput.value.trim();
  const priorityValue = document.getElementById("intrackr-ai-priority").value;
  const typeValue = document.getElementById("intrackr-ai-type").value;

  const assigneeSelect = document.getElementById("intrackr-ai-assignee");
  const assigneeOption = assigneeSelect && assigneeSelect.selectedIndex >= 0 ? assigneeSelect.options[assigneeSelect.selectedIndex] : null;
  const assigneeName = assigneeOption && assigneeOption.value ? assigneeOption.textContent : "";

  const qaAssigneeSelect = document.getElementById("intrackr-ai-qa-assignee");
  const qaAssigneeOption = qaAssigneeSelect && qaAssigneeSelect.selectedIndex >= 0 ? qaAssigneeSelect.options[qaAssigneeSelect.selectedIndex] : null;
  const qaAssigneeName = qaAssigneeOption && qaAssigneeOption.value ? qaAssigneeOption.textContent : "";

  const selectedCategory = selectTaskCategory(typeValue);

  const insertBtn = document.getElementById("intrackr-ai-insert");
  let fileStatusMsg = "";
  let uploadedUrls = [];
  let uploadDraftKey = null;

  if (selectedImages.length > 0) {
    insertBtn.disabled = true;
    setStatus("Uploading screenshot(s) to InTrackr...");
    uploadDraftKey = createDraftKey();
    try {
      for (const img of selectedImages) {
        try {
          const uploaded = await uploadImage(img, uploadDraftKey);
          if (uploaded?.url) {
            uploadedUrls.push(uploaded.url);
          }
        } catch (e) {
          console.error("Failed to upload image:", e);
        }
      }

      if (uploadedUrls.length > 0) {
        fileStatusMsg = ` and embedded ${uploadedUrls.length} screenshot(s)`;
      }
    } catch (err) {
      console.error("Image upload flow failed:", err);
      fileStatusMsg = " (failed to upload images)";
    }
    insertBtn.disabled = false;
    setStatus("");
  }

  if (titleField) setFieldValue(titleField, titleValue);
  if (descriptionField) setDescriptionFieldValue(descriptionField, descriptionValue, uploadedUrls);
  if (uploadDraftKey) syncDraftKeyField(uploadDraftKey);
  if (projectField && projectValue) setFieldValue(projectField, projectValue);
  if (priorityField) setFieldValue(priorityField, priorityValue);
  if (typeField) setFieldValue(typeField, typeValue || generatedTask.type || "");
  if (assigneeField && assigneeName) setFieldValue(assigneeField, assigneeName);
  if (qaAssigneeField && qaAssigneeName) setFieldValue(qaAssigneeField, qaAssigneeName);

  if (selectedImages.length > 0) {
    const fileField = findPageFileInput();
    if (fileField) {
      try {
        setFileInputFiles(fileField, selectedImages);
      } catch (e) {
        console.error("Failed to populate file input:", e);
      }
    }
  }

  if (!titleField && !descriptionField) {
    setStatus("Could not detect the Intrackr fields. The task is still available to copy." + fileStatusMsg, true);
    return;
  }

  if (projectField && !projectValue) {
    setStatus("Filled title and description. Add a project in the AI panel or choose it in Intrackr." + fileStatusMsg, true);
    return;
  }

  setStatus((selectedCategory
    ? "Filled the visible Intrackr fields and selected the task category."
    : "Filled the visible Intrackr fields. Select the task category if it was not highlighted.") + fileStatusMsg);
}

document.getElementById("intrackr-ai-generate").addEventListener("click", generateTask);
document.getElementById("intrackr-ai-insert").addEventListener("click", fillIntrackrForm);
document.getElementById("intrackr-ai-save-direct").addEventListener("click", saveTaskToInTrackr);
linkSubtaskBtn.addEventListener("click", () => {
  if (!titleInput.value.trim() && !output.value.trim()) {
    setStatus("Generate or enter a task first before adding as sub-task.", true);
    return;
  }
  openParentTaskPickerModal();
});
parentLinkClearBtn.addEventListener("click", () => {
  setSelectedParentTask(null);
  setStatus("Parent task removed.");
});
settingsBtn.addEventListener("click", () => {
  const isVisible = settingsPanel.style.display !== "none";
  settingsPanel.style.display = isVisible ? "none" : "block";
  settingsBtn.classList.toggle("active", !isVisible);
});

openaiKeySelect.addEventListener("change", () => {
  if (openaiKeySelect.value === "custom") {
    customKeyContainer.style.display = "block";
    openaiKeyInput.focus();
  } else {
    customKeyContainer.style.display = "none";
  }
});

saveSettingsBtn.addEventListener("click", () => {
  let key = "";
  if (openaiKeySelect.value === "custom") {
    key = openaiKeyInput.value.trim();
    if (!key) {
      settingsStatus.textContent = "Please enter a custom key before saving.";
      settingsStatus.className = "error";
      return;
    }
  } else {
    key = openaiKeySelect.value;
    if (!key) {
      settingsStatus.textContent = "Please select or enter an API key before saving.";
      settingsStatus.className = "error";
      return;
    }
  }
  if (isContextValid()) {
    chrome.storage.local.set({ intrackr_openai_api_key: key }, () => {
      updateSettingsStatus(true);
      settingsStatus.textContent = "Key saved successfully!";
      settingsStatus.className = "success";
      setTimeout(() => {
        settingsPanel.style.display = "none";
        settingsBtn.classList.remove("active");
      }, 1000);
    });
  }
});

clearSettingsBtn.addEventListener("click", () => {
  if (isContextValid()) {
    chrome.storage.local.remove("intrackr_openai_api_key", () => {
      openaiKeySelect.value = "";
      openaiKeyInput.value = "";
      customKeyContainer.style.display = "none";
      updateSettingsStatus(false);
      settingsStatus.textContent = "Key cleared.";
      settingsStatus.className = "error";
    });
  }
});

document.getElementById("intrackr-ai-theme").addEventListener("click", () => {
  const isDark = sidebar.classList.toggle("dark");
  const themeButton = document.getElementById("intrackr-ai-theme");
  document.getElementById("intrackr-ai-theme-icon").className.baseVal = isDark ? "sun" : "moon";
  themeButton.title = isDark ? "Toggle light mode" : "Toggle dark mode";
  themeButton.setAttribute("aria-label", themeButton.title);
});
document.getElementById("intrackr-ai-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.value);
  setStatus("Copied.");
});
document.getElementById("intrackr-ai-reset").addEventListener("click", () => {
  input.value = "";
  projectInput.value = "";
  if (assigneeInput) assigneeInput.value = "";
  if (qaAssigneeInput) qaAssigneeInput.value = "";
  titleInput.value = "";
  output.value = "";
  generatedTask = null;
  selectedImages = [];
  setSelectedParentTask(null);
  imageInput.value = "";
  if (previewGrid) {
    previewGrid.innerHTML = "";
    previewGrid.style.display = "none";
  }
  uploadPlaceholder.hidden = false;
  setStatus("");
  clearDraft();
});
document.getElementById("intrackr-ai-close").addEventListener("click", () => {
  sidebar.hidden = true;
  launcher.hidden = false;
});

function setSidebarMinimized(value) {
  minimized = value;
  document.getElementById("intrackr-ai-body").hidden = minimized;
  sidebar.classList.toggle("minimized", minimized);
  minimizeButton.title = minimized ? "Restore" : "Minimize";
  minimizeButton.setAttribute("aria-label", minimized ? "Restore" : "Minimize");

  if (minimized) {
    savedSidebarStyle.width = sidebar.style.width || "";
    savedSidebarStyle.height = sidebar.style.height || "";
    sidebar.style.width = "";
    sidebar.style.height = "";
  } else {
    sidebar.style.width = savedSidebarStyle.width;
    sidebar.style.height = savedSidebarStyle.height;
  }
}

launcher.addEventListener("click", () => {
  sidebar.hidden = false;
  launcher.hidden = true;
  setSidebarMinimized(false);
});
minimizeButton.addEventListener("click", () => {
  setSidebarMinimized(!minimized);
});

let dragging = false;
let offsetX = 0;
let offsetY = 0;
let resizing = false;
let resizeDirection = "";
let resizeStart = null;

header.addEventListener("mousedown", event => {
  if (event.target.closest("button")) return;
  dragging = true;
  const rect = sidebar.getBoundingClientRect();
  offsetX = event.clientX - rect.left;
  offsetY = event.clientY - rect.top;
});

document.addEventListener("mousemove", event => {
  if (!dragging) return;
  sidebar.style.left = `${event.clientX - offsetX}px`;
  sidebar.style.top = `${event.clientY - offsetY}px`;
  sidebar.style.right = "auto";
  sidebar.style.bottom = "auto";
});

document.addEventListener("mouseup", () => {
  dragging = false;
  resizing = false;
  resizeDirection = "";
});

document.querySelectorAll(".resize-handle").forEach(handle => {
  handle.addEventListener("mousedown", event => {
    event.preventDefault();
    event.stopPropagation();

    const rect = sidebar.getBoundingClientRect();
    resizing = true;
    resizeDirection = handle.dataset.resize;
    resizeStart = {
      x: event.clientX,
      y: event.clientY,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  });
});

document.addEventListener("mousemove", event => {
  if (!resizing || !resizeStart) return;

  const minWidth = 360;
  const minHeight = 460;
  const maxWidth = window.innerWidth - 24;
  const maxHeight = window.innerHeight - 24;
  const deltaX = event.clientX - resizeStart.x;
  const deltaY = event.clientY - resizeStart.y;
  let nextLeft = resizeStart.left;
  let nextTop = resizeStart.top;
  let nextWidth = resizeStart.width;
  let nextHeight = resizeStart.height;

  if (resizeDirection.includes("e")) {
    nextWidth = resizeStart.width + deltaX;
  }

  if (resizeDirection.includes("s")) {
    nextHeight = resizeStart.height + deltaY;
  }

  if (resizeDirection.includes("w")) {
    nextWidth = resizeStart.width - deltaX;
    nextLeft = resizeStart.left + deltaX;
  }

  if (resizeDirection.includes("n")) {
    nextHeight = resizeStart.height - deltaY;
    nextTop = resizeStart.top + deltaY;
  }

  nextWidth = Math.min(Math.max(nextWidth, minWidth), maxWidth);
  nextHeight = Math.min(Math.max(nextHeight, minHeight), maxHeight);

  if (resizeDirection.includes("w")) {
    nextLeft = resizeStart.left + resizeStart.width - nextWidth;
  }

  if (resizeDirection.includes("n")) {
    nextTop = resizeStart.top + resizeStart.height - nextHeight;
  }

  sidebar.style.left = `${Math.max(12, nextLeft)}px`;
  sidebar.style.top = `${Math.max(12, nextTop)}px`;
  sidebar.style.width = `${nextWidth}px`;
  sidebar.style.height = `${nextHeight}px`;
  sidebar.style.right = "auto";
  sidebar.style.bottom = "auto";
});

// Image quality settings for screenshots embedded in InTrackr tasks
const SCREENSHOT_MAX_DIMENSION = 2560;
const SCREENSHOT_JPEG_QUALITY = 0.92;
const SCREENSHOT_PREFER_PNG = true;

function scaleScreenshotDimensions(width, height, maxDim = SCREENSHOT_MAX_DIMENSION) {
  let targetW = width;
  let targetH = height;

  if (targetW <= maxDim && targetH <= maxDim) {
    return { width: targetW, height: targetH };
  }

  if (targetW > targetH) {
    targetH = Math.round((targetH * maxDim) / targetW);
    targetW = maxDim;
  } else {
    targetW = Math.round((targetW * maxDim) / targetH);
    targetH = maxDim;
  }

  return { width: targetW, height: targetH };
}

function configureHighQualityCanvasContext(ctx) {
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
}

function exportCanvasToScreenshotDataUrl(sourceCanvas, sourceWidth, sourceHeight, options = {}) {
  const maxDim = options.maxDim ?? SCREENSHOT_MAX_DIMENSION;
  const preferPng = options.preferPng ?? SCREENSHOT_PREFER_PNG;
  const jpegQuality = options.jpegQuality ?? SCREENSHOT_JPEG_QUALITY;
  const { width: targetW, height: targetH } = scaleScreenshotDimensions(sourceWidth, sourceHeight, maxDim);

  if (targetW === sourceWidth && targetH === sourceHeight) {
    return preferPng
      ? sourceCanvas.toDataURL("image/png")
      : sourceCanvas.toDataURL("image/jpeg", jpegQuality);
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  const tempCtx = tempCanvas.getContext("2d");
  configureHighQualityCanvasContext(tempCtx);
  tempCtx.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetW, targetH);

  return preferPng
    ? tempCanvas.toDataURL("image/png")
    : tempCanvas.toDataURL("image/jpeg", jpegQuality);
}

function exportImageToScreenshotDataUrl(img, options = {}) {
  const { width: targetW, height: targetH } = scaleScreenshotDimensions(img.width, img.height, options.maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  configureHighQualityCanvasContext(ctx);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const preferPng = options.preferPng ?? SCREENSHOT_PREFER_PNG;
  const jpegQuality = options.jpegQuality ?? SCREENSHOT_JPEG_QUALITY;
  return preferPng
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", jpegQuality);
}

function getScreenshotFilenamePrefix(dataUrl, index = 1) {
  const mime = String(dataUrl || "").split(",")[0].match(/:(.*?);/)?.[1] || "image/png";
  const ext = mime.split("/")[1] || "png";
  return `screenshot_${index}.${ext}`;
}

// Image Resizing and Import Helpers
function processAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        resolve(exportImageToScreenshotDataUrl(img));
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function handleImageFiles(files) {
  if (!files || files.length === 0) return;

  setStatus("Processing image(s)...");
  let importCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const resizedBase64 = await processAndResizeImage(file);
      selectedImages.push(resizedBase64);
      importCount++;
    } catch (error) {
      console.error(error);
      errorCount++;
    }
  }

  renderPreviews();
  saveDraft();

  if (errorCount > 0) {
    setStatus(`Imported ${importCount} image(s). Failed to import ${errorCount} file(s).`, true);
  } else {
    setStatus(`Imported ${importCount} image(s) successfully.`);
  }
}

// Image Interaction Event Listeners
imageContainer.addEventListener("click", event => {
  if (event.target.closest(".remove-btn, #intrackr-ai-btn-capture, #intrackr-ai-btn-capture-screen")) return;
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  if (imageInput.files && imageInput.files.length > 0) {
    handleImageFiles(imageInput.files);
  }
});

imageContainer.addEventListener("dragover", event => {
  event.preventDefault();
  imageContainer.classList.add("drag-over");
});

imageContainer.addEventListener("dragleave", () => {
  imageContainer.classList.remove("drag-over");
});

imageContainer.addEventListener("drop", event => {
  event.preventDefault();
  imageContainer.classList.remove("drag-over");
  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    handleImageFiles(event.dataTransfer.files);
  }
});

sidebar.addEventListener("paste", event => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  const files = [];
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    }
  }
  if (files.length > 0) {
    event.preventDefault();
    handleImageFiles(files);
  }
});

document.getElementById("intrackr-ai-btn-capture").addEventListener("click", (e) => {
  e.stopPropagation();
  autoCaptureScreenshot();
});

document.getElementById("intrackr-ai-btn-capture-screen").addEventListener("click", (e) => {
  e.stopPropagation();
  autoCaptureDesktopScreen();
});

  // Shared state event listeners
  input.addEventListener("input", saveDraft);
  titleInput.addEventListener("input", saveDraft);
  output.addEventListener("input", saveDraft);
  projectInput.addEventListener("change", saveDraft);
  if (assigneeInput) assigneeInput.addEventListener("change", saveDraft);
  if (qaAssigneeInput) qaAssigneeInput.addEventListener("change", saveDraft);
  
  const priorityEl = document.getElementById("intrackr-ai-priority");
  if (priorityEl) priorityEl.addEventListener("change", saveDraft);
  
  const typeEl = document.getElementById("intrackr-ai-type");
  if (typeEl) typeEl.addEventListener("change", saveDraft);
  
  // Listen for draft synchronization from other tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.intrackr_ai_task_draft) {
      const newDraft = changes.intrackr_ai_task_draft.newValue;
      if (newDraft) {
        if (document.activeElement !== input) input.value = newDraft.summary || "";
        if (document.activeElement !== titleInput) titleInput.value = newDraft.title || "";
        if (document.activeElement !== output) output.value = newDraft.description || "";
        
        selectedImages = newDraft.images || [];
        
        if (document.activeElement !== projectInput && newDraft.project && projectInput) projectInput.value = newDraft.project;
        if (document.activeElement !== assigneeInput && newDraft.assignee && assigneeInput) assigneeInput.value = newDraft.assignee;
        if (document.activeElement !== qaAssigneeInput && newDraft.qaAssignee && qaAssigneeInput) qaAssigneeInput.value = newDraft.qaAssignee;
        
        if (document.activeElement !== priorityEl && priorityEl && newDraft.priority) priorityEl.value = newDraft.priority;
        if (document.activeElement !== typeEl && typeEl && newDraft.type) typeEl.value = newDraft.type;
        
        renderPreviews();
      } else {
        // Draft was cleared (reset clicked in another tab)
        if (document.activeElement !== input) input.value = "";
        if (document.activeElement !== titleInput) titleInput.value = "";
        if (document.activeElement !== output) output.value = "";
        selectedImages = [];
        renderPreviews();
      }
    }
  });

})();

(() => {
const API_BASE = "https://intrackr-ai-task-builder.onrender.com";

const root = document.createElement("div");
root.innerHTML = `
  <aside id="intrackr-ai-sidebar" aria-label="Intrackr AI Task Builder">
    <header id="intrackr-ai-header">
      <span>Create New Task</span>
      <div class="header-actions">
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
          <div class="upload-options" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <button id="intrackr-ai-btn-capture" type="button" style="height: 26px; padding: 0 8px; font-size: 11px; margin-bottom: 2px;">📸 Capture Screenshot</button>
            <span>or click/drag to upload</span>
          </div>
        </div>
        <div id="intrackr-ai-images-preview-grid" class="images-preview-grid" style="display: none;"></div>
      </div>

      <label for="intrackr-ai-project">Project *</label>
      <select id="intrackr-ai-project" title="Select Project"><option value="">Loading projects...</option></select>

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

      <div class="footer-actions">
        <button id="intrackr-ai-insert" type="button">Fill Intrackr Form</button>
        <button id="intrackr-ai-save-direct" type="button" class="primary">Save to InTrackr</button>
        <button id="intrackr-ai-copy" type="button">Copy</button>
        <button id="intrackr-ai-reset" type="button">Reset</button>
      </div>

      <p id="intrackr-ai-status" role="status"></p>
    </section>

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
let minimized = false;
let savedSidebarStyle = { width: "", height: "" };

const sidebar = document.getElementById("intrackr-ai-sidebar");
const header = document.getElementById("intrackr-ai-header");
const launcher = document.getElementById("intrackr-ai-launcher");
const input = document.getElementById("intrackr-ai-input");
const projectInput = document.getElementById("intrackr-ai-project");
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
const captureBtn = document.getElementById("intrackr-ai-btn-capture");

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

// Fetch InTrackr projects for project dropdown on load
fetchProjectsDropdown();

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

function fetchProjectsDropdown() {
  const select = document.getElementById("intrackr-ai-project");
  if (!select) return;
  
  const prevVal = select.value;
  select.innerHTML = "";
  
  const defOpt = document.createElement("option");
  defOpt.value = "";
  defOpt.textContent = "Select a project *";
  select.appendChild(defOpt);
  
  // Try loading real projects scraped from InTrackr backend first
  chrome.runtime.sendMessage({ action: "getProjects" }, (response) => {
    if (response && response.success && response.projects && response.projects.length > 0) {
      response.projects.forEach(p => {
        if (![...select.options].some(o => o.value == p.id)) {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          select.appendChild(opt);
        }
      });
    } else {
      // Fallback to static project list if scraping fails
      STATIC_PROJECTS.forEach(p => {
        if (![...select.options].some(o => o.value == p.id)) {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          select.appendChild(opt);
        }
      });
    }
    
    if (prevVal && [...select.options].some(o => o.value == prevVal)) {
      select.value = prevVal;
    }
  });
}

async function captureScreenshot() {
  return new Promise((resolve, reject) => {
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

function drawArrow(ctx, fromx, fromy, tox, toy) {
  const headlen = 15;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);
  
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 4;
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
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgDataUrl;
  img.onload = () => {
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.7;
    let w = img.width;
    let h = img.height;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
    }
    
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    
    let drawing = false;
    let startX = 0;
    let startY = 0;
    let activeTool = "brush"; // brush, rect, arrow
    
    // Save state for undo/restores
    let savedState = ctx.getImageData(0, 0, w, h);
    
    const toolButtons = {
      brush: document.getElementById("anno-tool-brush"),
      rect: document.getElementById("anno-tool-rect"),
      arrow: document.getElementById("anno-tool-arrow")
    };
    
    Object.keys(toolButtons).forEach(t => {
      toolButtons[t].addEventListener("click", () => {
        Object.values(toolButtons).forEach(b => b.classList.remove("active"));
        toolButtons[t].classList.add("active");
        activeTool = t;
      });
    });
    
    document.getElementById("anno-tool-clear").addEventListener("click", () => {
      ctx.drawImage(img, 0, 0, w, h);
      savedState = ctx.getImageData(0, 0, w, h);
    });
    
    document.getElementById("anno-act-cancel").addEventListener("click", () => {
      overlay.remove();
      sidebar.hidden = false;
      launcher.hidden = true;
      setSidebarMinimized(false);
    });
    
    document.getElementById("anno-act-save").addEventListener("click", () => {
      const annotatedBase64 = canvas.toDataURL("image/jpeg", 0.85);
      selectedImages.push(annotatedBase64);
      renderPreviews();
      uploadPlaceholder.hidden = true;
      overlay.remove();
      sidebar.hidden = false;
      launcher.hidden = true;
      setSidebarMinimized(false);
      setStatus("Annotated screenshot added successfully.");
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
      
      // Cache canvas state before drawing active shape
      savedState = ctx.getImageData(0, 0, w, h);
      
      if (activeTool === "brush") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
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
        // Restore cached state for live preview of rect / arrow shape
        ctx.putImageData(savedState, 0, 0);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (activeTool === "rect") {
          ctx.strokeRect(startX, startY, currX - startX, currY - startY);
        } else if (activeTool === "arrow") {
          drawArrow(ctx, startX, startY, currX, currY);
        }
      }
    });
    
    canvas.addEventListener("mouseup", () => {
      if (!drawing) return;
      drawing = false;
      // Commit the drawing to cached state
      savedState = ctx.getImageData(0, 0, w, h);
    });
    
    canvas.addEventListener("mouseleave", () => {
      if (drawing) {
        drawing = false;
        savedState = ctx.getImageData(0, 0, w, h);
      }
    });
  };
}

async function saveTaskToInTrackr() {
  const title = titleInput.value.trim();
  const description = output.value.trim();
  const projectSelect = document.getElementById("intrackr-ai-project");
  const projectId = projectSelect ? projectSelect.value : "";
  
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
  saveDirectBtn.disabled = true;

  const payload = {
    title,
    description: description || title,
    project_id: projectId,
    priority,
    status: "todo",
    type,
    images: selectedImages
  };

  chrome.runtime.sendMessage({ action: "createTaskInTrackr", payload }, (response) => {
    saveDirectBtn.disabled = false;
    if (response && response.success) {
      setStatus("Task saved directly to InTrackr successfully!");
    } else {
      setStatus(response && response.error ? response.error : "Failed to save task to InTrackr.", true);
    }
  });
}

function cleanListItem(item) {
  return String(item)
    .replace(/^\s*(?:\d+(?:\.\d+)*[\s.)-]*|[-*+•])\s*/, "")
    .trim();
}

function taskToText(task) {
  if (!task) return "";

  const steps = (task.steps || []).map(cleanListItem);

  return [
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
  ].join("\n").trim();
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
    const response = await fetch(`${API_BASE}/create-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

async function uploadImage(imgBase64) {
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
  formData.append("image", blob, `screenshot_${Date.now()}.png`);
  
  const draftKey = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
  formData.append("draft_key", draftKey);
  
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
  return data.url;
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
  const titleValue = titleInput.value.trim() || generatedTask.title || "";
  const descriptionValue = output.value.trim() || taskToText(generatedTask);
  const projectValue = projectInput.value.trim();
  const priorityValue = document.getElementById("intrackr-ai-priority").value;
  const typeValue = document.getElementById("intrackr-ai-type").value;
  const selectedCategory = selectTaskCategory(typeValue);

  let finalDescription = descriptionValue;
  const insertBtn = document.getElementById("intrackr-ai-insert");
  let fileStatusMsg = "";

  if (selectedImages.length > 0) {
    insertBtn.disabled = true;
    setStatus("Uploading screenshot(s) to InTrackr...");
    try {
      const uploadedUrls = [];
      for (const img of selectedImages) {
        try {
          const url = await uploadImage(img);
          uploadedUrls.push(url);
        } catch (e) {
          console.error("Failed to upload image:", e);
        }
      }

      if (uploadedUrls.length > 0) {
        finalDescription += "\n\nScreenshots:\n" + uploadedUrls.map(url => "- " + url).join("\n");
        fileStatusMsg = ` and uploaded ${uploadedUrls.length} image(s)`;
      }
    } catch (err) {
      console.error("Image upload flow failed:", err);
      fileStatusMsg = " (failed to upload images)";
    }
    insertBtn.disabled = false;
    setStatus("");
  }

  if (titleField) setFieldValue(titleField, titleValue);
  if (descriptionField) setFieldValue(descriptionField, finalDescription);
  if (projectField && projectValue) setFieldValue(projectField, projectValue);
  if (priorityField) setFieldValue(priorityField, priorityValue);
  if (typeField) setFieldValue(typeField, typeValue || generatedTask.type || "");

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
  titleInput.value = "";
  output.value = "";
  generatedTask = null;
  selectedImages = [];
  imageInput.value = "";
  if (previewGrid) {
    previewGrid.innerHTML = "";
    previewGrid.style.display = "none";
  }
  uploadPlaceholder.hidden = false;
  setStatus("");
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
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
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

  if (errorCount > 0) {
    setStatus(`Imported ${importCount} image(s). Failed to import ${errorCount} file(s).`, true);
  } else {
    setStatus(`Imported ${importCount} image(s) successfully.`);
  }
}

// Image Interaction Event Listeners
imageContainer.addEventListener("click", event => {
  if (event.target.closest(".remove-btn, #intrackr-ai-btn-capture")) return;
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

})();

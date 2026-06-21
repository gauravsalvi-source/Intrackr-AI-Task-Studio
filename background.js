// background.js for Intrackr AI Task Builder Extension

const backendUrl = "https://intrackr-ai-task-studio-1.onrender.com";
let isCreatingTaskInTrackr = false;

function normalizeSearchTask(task) {
  if (!task || typeof task !== "object") return null;

  if (task.task && typeof task.task === "object") {
    return normalizeSearchTask(task.task);
  }

  if (task.attributes && typeof task.attributes === "object") {
    return normalizeSearchTask({ id: task.id, ...task.attributes });
  }

  const id = task.id ?? task.task_id ?? task.taskId ?? task.number ?? task.task_number;
  const displayId = task.number ?? task.task_number ?? task.display_id ?? task.serial_number ?? id;
  if (id == null && displayId == null) return null;

  const assignee = task.assignee
    || task.assignee_name
    || task.assigned_to_name
    || task.assigned_to
    || task.assignedTo
    || task.user
    || (Array.isArray(task.assignees) && task.assignees[0])
    || null;

  const assigneeName = typeof assignee === "string"
    ? assignee
    : (assignee?.name || assignee?.full_name || assignee?.fullName || "");

  const rawStatus = task.status_label || task.statusLabel || task.status_name || task.statusName || task.status;
  const status = typeof rawStatus === "object"
    ? (rawStatus?.name || rawStatus?.label || rawStatus?.title || "")
    : (rawStatus || "");

  const labels = task.labels || task.tags || task.types || (task.type ? [task.type] : []) || [];
  const labelList = Array.isArray(labels)
    ? labels.map(l => (typeof l === "string" ? l : (l?.name || l?.title || ""))).filter(Boolean)
    : (typeof labels === "string" ? [labels] : []);

  const title = task.title || task.name || task.task_title || task.label || task.full_title || "";
  const resolvedId = id ?? displayId;

  return {
    id: String(resolvedId),
    displayId: String(displayId ?? resolvedId),
    title: title || `Task #${displayId ?? resolvedId}`,
    status,
    assignee: assigneeName,
    labels: labelList,
    updatedAt: task.updated_at || task.updatedAt || task.created_at || task.createdAt || null
  };
}

function looksLikeTask(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.attributes) return looksLikeTask({ id: value.id, ...value.attributes });
  const taskId = value.id ?? value.task_id ?? value.number ?? value.task_number;
  return taskId != null;
}

function deepExtractTasks(node, results = [], seen = new Set(), depth = 0) {
  if (!node || depth > 8) return results;

  if (Array.isArray(node)) {
    if (node.length > 0 && node.length <= 500 && node.filter(looksLikeTask).length >= Math.max(1, Math.floor(node.length * 0.6))) {
      node.forEach((task) => {
        const normalized = normalizeSearchTask(task);
        if (!normalized || seen.has(normalized.id)) return;
        seen.add(normalized.id);
        results.push(normalized);
      });
      return results;
    }
    node.forEach(item => deepExtractTasks(item, results, seen, depth + 1));
    return results;
  }

  if (typeof node === "object") {
    if (Array.isArray(node.data)) deepExtractTasks(node.data, results, seen, depth + 1);
    Object.values(node).forEach(value => deepExtractTasks(value, results, seen, depth + 1));
  }

  return results;
}

function decodeInertiaPage(htmlOrJson) {
  if (typeof htmlOrJson !== "string") return htmlOrJson;

  const dataPageMatch = htmlOrJson.match(/data-page="([^"]+)"/);
  if (!dataPageMatch) {
    try {
      return JSON.parse(htmlOrJson);
    } catch (e) {
      return null;
    }
  }

  const decodedJson = dataPageMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'");
  return JSON.parse(decodedJson);
}

function extractTaskFromShowPage(pageData, expectedId) {
  if (!pageData) return null;

  const props = pageData.props || pageData;
  const directCandidates = [props.task, props.taskData, props.item, props.currentTask];

  for (const candidate of directCandidates) {
    const normalized = normalizeSearchTask(candidate);
    if (normalized) return normalized;
  }

  const tasks = deepExtractTasks(props);
  if (expectedId) {
    const match = tasks.find(task =>
      String(task.id) === String(expectedId) || String(task.displayId) === String(expectedId)
    );
    if (match) return match;
  }

  return tasks.length === 1 ? tasks[0] : null;
}

async function fetchTaskById(taskId, xsrfToken) {
  const id = String(taskId).replace(/^#/, "").trim();
  if (!/^\d+$/.test(id)) return null;

  const url = `https://intrackr.thalia-apps.com/tasks/${id}`;
  const headerSets = [
    {
      Accept: "application/json",
      "X-Inertia": "true",
      "X-Requested-With": "XMLHttpRequest",
      "X-XSRF-TOKEN": xsrfToken
    },
    {
      Accept: "text/html,application/xhtml+xml",
      "X-XSRF-TOKEN": xsrfToken
    }
  ];

  for (const headers of headerSets) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include"
      });
      const text = await response.text();

      if (response.status === 404 || /sign in to intrackr/i.test(text)) {
        return null;
      }

      const pageData = decodeInertiaPage(text);
      const task = extractTaskFromShowPage(pageData, id);
      if (task) return task;
    } catch (e) {
      // try next header set
    }
  }

  return null;
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

function isSuccessfulHttpResponse(response) {
  return response.ok ||
    response.type === "opaqueredirect" ||
    response.status === 302 ||
    response.status === 303 ||
    response.status === 0;
}

async function buildTaskFormData(payload, xsrfToken) {
  const draftKey = payload.images?.length ? createDraftKey() : null;

  const uploadImageBackground = async (imgBase64, sharedDraftKey) => {
    const arr = imgBase64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const ext = mime.split('/')[1] || 'png';

    const uploadFormData = new FormData();
    uploadFormData.append("image", blob, `screenshot_${Date.now()}.${ext}`);
    uploadFormData.append("draft_key", sharedDraftKey);

    const uploadRes = await fetch("https://intrackr.thalia-apps.com/tasks/description-images", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Inertia": "true",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": xsrfToken
      },
      body: uploadFormData,
      credentials: "include"
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}`);
    }

    const data = await uploadRes.json();
    return {
      url: data.url || data.path || data.src || "",
      html: data.html || data.tag || null
    };
  };

  const uploadedImages = [];
  if (payload.images && payload.images.length > 0 && draftKey) {
    for (const img of payload.images) {
      try {
        const uploaded = await uploadImageBackground(img, draftKey);
        if (uploaded?.url) {
          uploadedImages.push(uploaded);
        }
      } catch (e) {
        console.error("Failed to upload image in background:", e);
      }
    }
  }

  const imageUrls = uploadedImages.map(item => item.url).filter(Boolean);
  let finalDescription = payload.description || "";
  if (imageUrls.length) {
    finalDescription = buildTipTapDescriptionPayload(finalDescription, imageUrls);
  }

  const formData = new FormData();
  formData.append("title", payload.title || "");
  formData.append("description", finalDescription);
  if (draftKey && imageUrls.length) {
    formData.append("draft_key", draftKey);
  }
  if (payload.project_id) {
    formData.append("project_id", payload.project_id);
  }
  if (payload.user_id) {
    formData.append("user_id", payload.user_id);
  }
  if (payload.assignee_id) {
    formData.append("assignee_id", payload.assignee_id);
  }
  if (payload.assigned_to) {
    formData.append("assigned_to", payload.assigned_to);
  }
  if (payload.qa_assignee_id) {
    formData.append("qa_assignee_id", payload.qa_assignee_id);
  }
  if (payload.qa_user_id) {
    formData.append("qa_user_id", payload.qa_user_id);
  }
  formData.append("type", payload.type || "Bug");
  formData.append("priority", payload.priority || "p3");
  formData.append("status", payload.status || "todo");

  const labelMap = {
    "Feature": 1,
    "Enhancement": 2,
    "Bug": 3,
    "Refactor": 4,
    "Tech Debt": 5,
    "UI/UX": 6,
    "Accessibility": 7,
    "Documentation": 8,
    "Testing/QA": 9
  };
  const labelId = labelMap[payload.type || "Bug"] || 3;
  formData.append("labels[]", String(labelId));
  formData.append("label_ids[]", String(labelId));

  const parentId = String(payload.parent_task_id || payload.parent_id || "").replace(/^#/, "").trim();
  if (/^\d+$/.test(parentId)) {
    formData.append("parent_task_id", parentId);
  }

  if (payload.images && payload.images.length > 0) {
    payload.images.forEach((imgBase64, index) => {
      try {
        if (!imgBase64 || typeof imgBase64 !== "string") return;
        const arr = imgBase64.split(',');
        if (arr.length < 2) return;
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const ext = mime.split('/')[1] || 'png';
        formData.append("images[]", blob, `screenshot_${index + 1}.${ext}`);
      } catch (e) {
        console.error("Failed to append image blob to request:", e);
      }
    });
  }

  return { formData, parentId };
}

async function postTaskCreate(url, formData, xsrfToken) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-Inertia": "true",
      "X-Requested-With": "XMLHttpRequest",
      "X-XSRF-TOKEN": xsrfToken
    },
    body: formData,
    credentials: "include",
    redirect: "manual"
  });

  if (isSuccessfulHttpResponse(response)) {
    return { success: true, response };
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { message: text };
  }

  return {
    success: false,
    error: data.errors
      ? Object.values(data.errors).flat().join(", ")
      : (data.error || data.message || `Request failed (${response.status}).`)
  };
}

async function createTaskInTrackrWithToken(payload, xsrfToken) {
  const { formData, parentId } = await buildTaskFormData(payload, xsrfToken);
  const isSubtask = /^\d+$/.test(parentId);

  if (isSubtask) {
    const subtaskResult = await postTaskCreate(
      `https://intrackr.thalia-apps.com/tasks/${parentId}/subtasks`,
      formData,
      xsrfToken
    );
    if (subtaskResult.success) {
      return { success: true, subtask: true };
    }

    const fallbackResult = await postTaskCreate(
      "https://intrackr.thalia-apps.com/tasks",
      formData,
      xsrfToken
    );
    if (fallbackResult.success) {
      return { success: true, subtask: true };
    }

    return { success: false, error: subtaskResult.error || fallbackResult.error };
  }

  const result = await postTaskCreate(
    "https://intrackr.thalia-apps.com/tasks",
    formData,
    xsrfToken
  );
  return result.success ? { success: true } : { success: false, error: result.error };
}

function captureActiveTab(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!dataUrl) {
        reject(new Error("Chrome returned an empty screenshot."));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
  } catch (error) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["sidebar.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    // Add a small delay to allow the content script to load and register its listener
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function startCaptureFromAction(tab) {
  if (!tab?.id) return;

  if (tab.url && !/^https?:\/\//i.test(tab.url)) {
    console.log("Screenshot capture is only available on regular http/https pages.");
    return;
  }

  try {
    await ensureContentScript(tab.id);
    chrome.tabs.sendMessage(tab.id, { action: "startScreenshotCapture" }).catch((err) => {
      console.log("Failed to send screenshot capture start message:", err);
    });
  } catch (error) {
    console.log("Failed to start screenshot capture.", error);
  }
}

// Listen for action click to start screenshot capture
chrome.action.onClicked.addListener((tab) => {
  startCaptureFromAction(tab);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    const windowId = sender.tab?.windowId;

    captureActiveTab(windowId)
      .then(dataUrl => sendResponse({ dataUrl }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === "chooseDesktopMedia") {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], sender.tab, (streamId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ streamId });
      }
    });
    return true;
  }

  if (request.action === "getProjects") {
    fetch("https://intrackr.thalia-apps.com/tasks/create", {
      method: "GET",
      headers: {
        "Accept": "text/html"
      },
      credentials: "include"
    })
    .then(response => response.text())
    .then(html => {
      // Try parsing through Inertia data-page attribute
      const dataPageMatch = html.match(/data-page="([^"]+)"/);
      if (dataPageMatch) {
        try {
          // Decode HTML entities
          const decodedJson = dataPageMatch[1]
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");
          const pageData = JSON.parse(decodedJson);

          // Dump props to local/configured server
          fetch(`${backendUrl}/dump-props`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData.props || {})
          }).catch(err => {
            console.warn("Failed to dump props (this is normal if the backend is offline or doesn't support dump-props):", err.message);
          });

          const projects = pageData.props?.projects || [];
          const users = pageData.props?.users || [];
          const qaAssignees = pageData.props?.qaAssigneeOptions || [];
          if (projects.length > 0 || users.length > 0 || qaAssignees.length > 0) {
            sendResponse({
              success: true,
              projects: projects.map(p => ({ id: p.id, name: p.name || p.title })),
              users: users.map(u => ({ id: u.id, name: u.name })),
              qaAssignees: qaAssignees.map(q => ({ id: q.id, name: q.name }))
            });
            return;
          }
        } catch(e) {
          console.error("Failed parsing Inertia props:", e);
        }
      }
      sendResponse({ success: false, error: "Failed to parse projects from InTrackr." });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === "lookupTaskById") {
    try {
      if (!chrome.cookies) {
        sendResponse({ success: false, error: "chrome.cookies API is undefined." });
        return true;
      }

      chrome.cookies.get({ url: "https://intrackr.thalia-apps.com", name: "XSRF-TOKEN" }, async (cookie) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: "Cookies read error: " + chrome.runtime.lastError.message });
          return;
        }

        const xsrfToken = cookie ? decodeURIComponent(cookie.value) : "";
        const taskId = String(request.taskId || "").replace(/^#/, "").trim();

        if (!xsrfToken) {
          sendResponse({
            success: false,
            error: "Not logged into InTrackr. Open intrackr.thalia-apps.com, sign in, then try again."
          });
          return;
        }

        if (!/^\d+$/.test(taskId)) {
          sendResponse({ success: false, error: "Enter a valid task number (e.g. 2473)." });
          return;
        }

        try {
          const task = await fetchTaskById(taskId, xsrfToken);
          if (task) {
            sendResponse({ success: true, task });
          } else {
            sendResponse({ success: false, error: `Task #${taskId} not found. Check the number and try again.` });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (request.action === "createTaskInTrackr") {
    if (isCreatingTaskInTrackr) {
      sendResponse({ success: false, error: "Task creation already in progress." });
      return true;
    }
    isCreatingTaskInTrackr = true;

    try {
      if (!chrome.cookies) {
        isCreatingTaskInTrackr = false;
        sendResponse({ success: false, error: "chrome.cookies API is undefined. Make sure 'cookies' permission is enabled in manifest.json." });
        return true;
      }

      chrome.cookies.get({ url: "https://intrackr.thalia-apps.com", name: "XSRF-TOKEN" }, async (cookie) => {
        try {
          if (chrome.runtime.lastError) {
            isCreatingTaskInTrackr = false;
            sendResponse({ success: false, error: "Cookies read error: " + chrome.runtime.lastError.message });
            return;
          }

          const xsrfToken = cookie ? decodeURIComponent(cookie.value) : "";
          if (!xsrfToken) {
            isCreatingTaskInTrackr = false;
            sendResponse({
              success: false,
              error: "Not logged into InTrackr. Open intrackr.thalia-apps.com, sign in, then try again."
            });
            return;
          }

          const result = await createTaskInTrackrWithToken(request.payload || {}, xsrfToken);
          isCreatingTaskInTrackr = false;
          sendResponse(result);
        } catch (innerErr) {
          isCreatingTaskInTrackr = false;
          sendResponse({ success: false, error: "Cookies callback error: " + innerErr.message });
        }
      });
    } catch (outerErr) {
      isCreatingTaskInTrackr = false;
      sendResponse({ success: false, error: "Outer handler error: " + outerErr.message });
    }
    return true;
  }
});

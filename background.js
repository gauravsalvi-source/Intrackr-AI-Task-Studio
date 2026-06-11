// background.js for Intrackr AI Task Builder Extension

const backendUrl = "https://intrackr-ai-task-builder.onrender.com";

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
          if (projects.length > 0) {
            sendResponse({
              success: true,
              projects: projects.map(p => ({ id: p.id, name: p.name || p.title }))
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

  if (request.action === "createTaskInTrackr") {
    try {
      if (!chrome.cookies) {
        sendResponse({ success: false, error: "chrome.cookies API is undefined. Make sure 'cookies' permission is enabled in manifest.json." });
        return true;
      }

      // Retrieve CSRF token from cookie
      chrome.cookies.get({ url: "https://intrackr.thalia-apps.com", name: "XSRF-TOKEN" }, async (cookie) => {
        try {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: "Cookies read error: " + chrome.runtime.lastError.message });
            return;
          }

          const xsrfToken = cookie ? decodeURIComponent(cookie.value) : "";
          const payload = request.payload;

          const uploadImageBackground = async (imgBase64) => {
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
            const draftKey = (typeof crypto !== 'undefined' && crypto.randomUUID) 
              ? crypto.randomUUID() 
              : Math.random().toString(36).substring(2) + Date.now().toString(36);
            uploadFormData.append("draft_key", draftKey);

            const uploadRes = await fetch("https://intrackr.thalia-apps.com/tasks/description-images", {
              method: "POST",
              headers: {
                "Accept": "application/json",
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
            return data.url;
          };

          const uploadedUrls = [];
          if (payload.images && payload.images.length > 0) {
            for (const img of payload.images) {
              try {
                const url = await uploadImageBackground(img);
                uploadedUrls.push(url);
              } catch (e) {
                console.error("Failed to upload image in background:", e);
              }
            }
          }

          let finalDescription = payload.description || "";
          if (uploadedUrls.length > 0) {
            finalDescription += "\n\nScreenshots:\n" + uploadedUrls.map(url => "- " + url).join("\n");
          }

          const formData = new FormData();
          formData.append("title", payload.title || "");
          formData.append("description", finalDescription);
          if (payload.project_id) {
            formData.append("project_id", payload.project_id);
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

          fetch("https://intrackr.thalia-apps.com/tasks", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "X-Inertia": "true",
              "X-Requested-With": "XMLHttpRequest",
              "X-XSRF-TOKEN": xsrfToken
            },
            body: formData,
            credentials: "include",
            redirect: "manual" // Prevent CORS issues on inertia redirection
          })
          .then(async (response) => {
            if (response.ok || response.type === "opaqueredirect" || response.status === 302 || response.status === 303 || response.status === 0) {
              sendResponse({ success: true });
            } else {
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                data = { message: text };
              }
              sendResponse({
                success: false,
                error: data.errors
                  ? Object.values(data.errors).flat().join(", ")
                  : (data.error || data.message || "Failed to create task in InTrackr")
              });
            }
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });

        } catch (innerErr) {
          sendResponse({ success: false, error: "Cookies callback error: " + innerErr.message });
        }
      });

    } catch (outerErr) {
      sendResponse({ success: false, error: "Outer handler error: " + outerErr.message });
    }
    return true; // Keep channel open
  }
});

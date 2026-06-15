const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile();
clearDeadLocalProxy();

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const AI_PROVIDER = process.env.GROQ_API_KEY ? "groq" : "openai";
const MODEL = AI_PROVIDER === "groq"
  ? process.env.GROQ_MODEL || "llama-3.1-8b-instant"
  : process.env.OPENAI_MODEL || "gpt-4.1-mini";

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function clearDeadLocalProxy() {
  const proxyVars = [
    "ALL_PROXY",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "GIT_HTTP_PROXY",
    "GIT_HTTPS_PROXY",
    "all_proxy",
    "http_proxy",
    "https_proxy",
    "git_http_proxy",
    "git_https_proxy"
  ];

  for (const key of proxyVars) {
    delete process.env[key];
  }
}

function parseJsonFromText(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

// Clean prefixes from lists (e.g. "1. Step" -> "Step")
function cleanListItem(item) {
  return String(item)
    .replace(/^\s*(?:\d+(?:\.\d+)*[\s.)-]*|[-*+•])\s*/, "")
    .trim();
}

function normalizeTask(task, fallback) {
  return {
    title: String(task.title || fallback.prompt || "Imported Image Issue").trim(),
    type: String(task.type || fallback.type || "Bug").trim(),
    priority: String(task.priority || fallback.priority || "Medium").trim(),
    description: String(task.description || "").trim(),
    steps: Array.isArray(task.steps) ? task.steps.map(cleanListItem) : [],
    expectedResult: String(task.expectedResult || "").trim(),
    actualResult: String(task.actualResult || "").trim()
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 10 * 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON request body."));
      }
    });

    req.on("error", reject);
  });
}

async function createTask(req, res) {
  try {
    const { prompt, priority = "Medium", type = "Bug", pageUrl = "", image = "", images = [], consoleLogs = [] } = await readJsonBody(req);

    if (AI_PROVIDER === "openai" && !process.env.OPENAI_API_KEY) {
      return sendJson(res, 500, {
        error: "OPENAI_API_KEY is missing. Add it to .env and restart the backend."
      });
    }

    const hasPrompt = prompt && typeof prompt === "string" && prompt.trim();
    const isShort = hasPrompt && /^short\s*-\s*/i.test(prompt.trim());
    const cleanPrompt = isShort ? prompt.trim().replace(/^short\s*-\s*/i, "") : (hasPrompt ? prompt.trim() : "");
    const allImages = [...(Array.isArray(images) ? images : []), image].filter(Boolean);

    if (!cleanPrompt && allImages.length === 0) {
      return sendJson(res, 400, {
        error: "Either a short issue description or a screenshot/image is required."
      });
    }

    let activeModel = MODEL;
    if (allImages.length > 0) {
      if (AI_PROVIDER === "groq") {
        activeModel = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
      } else {
        activeModel = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
      }
    }

    let systemPrompt;
    if (isShort) {
      systemPrompt = [
        "You create clear developer tasks for Intrackr.",
        "Turn the issue description or uploaded image into a very concise task, keeping all sections as brief as possible instead of a lengthy procedure.",
        "Be specific and practical.",
        "Return only valid JSON with these keys:",
        "title, type, priority, description, steps, expectedResult, actualResult.",
        "Ensure every field (description, steps, expectedResult, actualResult) is populated but kept extremely short, brief, and concise. For example, limit 'steps' to at most 1-2 very short items, and keep other fields to a single brief sentence.",
        "If console logs, warnings, or exceptions are provided in the prompt, analyze them and incorporate critical errors, error messages, or stack traces into the actualResult to assist developer debugging."
      ].join(" ");
    } else {
      systemPrompt = [
        "You create clear developer tasks for Intrackr.",
        "Turn a short issue description or an uploaded image with highlights/issues into a detailed, actionable task.",
        "Be specific, practical, and avoid inventing app facts that were not provided.",
        "Return only valid JSON with these keys:",
        "title, type, priority, description, steps, expectedResult, actualResult.",
        "steps must be an array of strings. Do not include step numbers or bullet symbol prefixes in the individual array elements of steps (e.g. write 'Log in' instead of '1. Log in' or '- Log in').",
        "If console logs, warnings, or exceptions are provided in the prompt, analyze them and incorporate critical errors, error messages, or stack traces into the actualResult to assist developer debugging."
      ].join(" ");
    }

    let userPromptText = "";
    if (cleanPrompt) {
      userPromptText += `Short issue description:\n${cleanPrompt}\n\n`;
    } else {
      userPromptText += `Short issue description: [No text description provided. Identify and read the issue from the provided image/screenshot.]\n\n`;
    }

    userPromptText += `Requested task type: ${type}
Requested priority: ${priority}
Source page: ${pageUrl}

Write it for developers who need to understand, reproduce, fix, and verify the issue.
`;

    if (consoleLogs && consoleLogs.length > 0) {
      userPromptText += "\nCaptured Browser Console Logs / Errors:\n";
      consoleLogs.forEach(log => {
        userPromptText += `[${log.type.toUpperCase()}] [${log.timestamp}] ${log.message}\n`;
      });
      userPromptText += "\nUse these logs and exceptions to populate the technical details of the issue, such as exact error messages, failure locations, and any stack trace info under 'actualResult'.\n";
    }

    if (allImages.length > 0) {
      userPromptText += "\nUse the provided screenshots/images as visual context to make the task description complete and detailed.";
      userPromptText += "\nIMPORTANT: Check if there are any highlighted areas, colored boxes/borders (e.g. red outlines), circles, arrows, or annotations pointing to or marking the issue in the images.";
      userPromptText += "\nIf such highlights are present, analyze the content inside or immediately around the highlighted region to read text, understand the problem, and provide a precise, detailed task description and reproduction steps based on the visual evidence within the highlights.";
    }

    let userContent;
    if (allImages.length > 0) {
      if (AI_PROVIDER === "groq") {
        userContent = [
          {
            type: "text",
            text: userPromptText
          },
          {
            type: "image_url",
            image_url: {
              url: allImages[0]
            }
          }
        ];
      } else {
        userContent = [
          {
            type: "text",
            text: userPromptText
          },
          ...allImages.map(img => ({
            type: "image_url",
            image_url: {
              url: img
            }
          }))
        ];
      }
    } else {
      userContent = userPromptText;
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userContent
      }
    ];

    const response = await fetch(AI_PROVIDER === "groq" ? GROQ_API_URL : OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_PROVIDER === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(AI_PROVIDER === "groq"
        ? {
            model: activeModel,
            messages,
            temperature: 0.2
          }
        : {
            model: activeModel,
            input: messages,
            temperature: 0.2
          })
    });

    const data = await response.json();

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: data.error?.message || `${AI_PROVIDER === "groq" ? "Groq" : "OpenAI"} request failed`
      });
    }

    const outputText = data.choices?.[0]?.message?.content ||
      data.output_text ||
      data.output?.flatMap(item => item.content || [])
        .map(content => content.text || "")
        .join("")
        .trim();

    if (!outputText) {
      return sendJson(res, 502, {
        error: `${AI_PROVIDER === "groq" ? "Groq" : "OpenAI"} returned an empty response.`
      });
    }

    const task = normalizeTask(parseJsonFromText(outputText), { prompt: cleanPrompt, priority, type });

    sendJson(res, 200, { task });
  } catch (error) {
    sendJson(res, 500, {
      error: error.cause?.message || error.message || "Something went wrong."
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    sendJson(res, 200, {
      message: "Intrackr AI Task Backend Running"
    });
    return;
  }

  if (req.method === "POST" && req.url === "/create-task") {
    createTask(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/dump-props") {
    try {
      const body = await readJsonBody(req);
      fs.writeFileSync(path.join(__dirname, "props_dump.json"), JSON.stringify(body, null, 2), "utf8");
      console.log("Successfully dumped props to props_dump.json");
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  sendJson(res, 404, {
    error: "Not found"
  });
});

const PORT = process.env.PORT || 3000;

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing backend or set PORT to a different value.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Intrackr AI Task Backend running on port ${PORT}`);
});

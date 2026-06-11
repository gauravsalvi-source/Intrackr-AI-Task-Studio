# Intrackr AI Task Builder

Chrome/Edge extension for reporting bugs from any `http` or `https` tab.

It adds a draggable bug reporter that captures the active tab, lets you highlight or mark the screenshot, turns a short issue summary into a developer-friendly bug report, and creates the task in Intrackr using the teammate's own logged-in Intrackr session. The old visible-form fill helper is still available when you are on the Intrackr create-task page.

## Setup

1. Create `.env` from `.env.example` and add either a Groq key or an OpenAI key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
PORT=3000
```

or:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
PORT=3000
```

2. Start the backend:

```bash
npm start
```

3. Load the extension:

- Open Chrome or Edge extensions.
- Enable Developer mode.
- Choose **Load unpacked**.
- Select this folder: `intrackr-ai-extension`.

4. Open any app you want to test, then click the extension icon or the **Bug** launcher.

5. Log into Intrackr once with your own magic link.

6. Capture the active tab, annotate the screenshot, add a short issue summary, generate the report, then choose **Create Intrackr Task**.

If no Intrackr tab is open, the extension opens Intrackr so you can log in. After login, return to the tested app and click **Create Intrackr Task** again.

## Notes

- Keep API keys in `.env`, not in extension files.
- Teammates do not need a shared `INTRACKR_API_TOKEN` or `INTRACKR_API_KEY`. Task creation uses their active Intrackr login session from the browser.
- The extension currently posts tasks to `https://intrackr.thalia-apps.com/api/tasks` from the logged-in Intrackr tab. If Intrackr uses a different create-task route, update `INTRACKR_CREATE_TASK_PATH` in `background.js`.
- The form fill uses flexible label and placeholder matching. If Intrackr has custom fields that do not fill, update the patterns in `content.js`.

# Documentation Hotlink

Click the book icon in the editor title bar to open the **Markdown preview** of the docs file that matches the current file's basename.

-   **Docs folder**: configurable (default: `docs`).
-   **Docs extension**: configurable (default: `.md`).
-   **Preview**: uses built-in VS Code Markdown preview (`markdown.showPreview` / `markdown.showPreviewToSide`).

## Settings

-   `docsPreview.docsFolder` — Folder containing generated docs. Accepts relative (to the workspace), absolute, or `${workspaceFolder}`.
-   `docsPreview.docsExtension` — Extension of the docs files, e.g. `.md`.
-   `docsPreview.openToSide` — Open preview to the side (true) or in the current column (false).

## Command

-   **Open Docs Preview** (`docsPreview.openForCurrentFile`) — Also available in Command Palette and as a book icon in the editor toolbar.

## How it matches files

If you're editing `classes/MyService.cls`, the extension looks for `<docsFolder>/MyService<docsExtension>` (e.g., `docs/MyService.md`).

If the file is missing, you'll get a friendly message.

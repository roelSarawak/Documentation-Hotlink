import * as vscode from "vscode";
import * as path from "path";

function getConfig() {
    const cfg = vscode.workspace.getConfiguration("docsPreview");
    return {
        folder: cfg.get<string>("docsFolder", "docs"),
        ext: cfg.get<string>("docsExtension", ".md"),
        toSide: cfg.get<boolean>("openToSide", true),
    };
}

function expandDocsFolder(
    docsFolder: string,
    workspaceUri: vscode.Uri
): string {
    if (docsFolder.includes("${workspaceFolder}")) {
        return docsFolder.replace("${workspaceFolder}", workspaceUri.fsPath);
    }
    if (path.isAbsolute(docsFolder)) {
        return docsFolder;
    }
    return path.join(workspaceUri.fsPath, docsFolder);
}

async function openMarkdownPreview(uri: vscode.Uri, toSide: boolean) {
    const cmd = toSide ? "markdown.showPreviewToSide" : "markdown.showPreview";
    await vscode.commands.executeCommand(cmd, uri);
}

async function resolveDocsUriForFile(
    fileUri: vscode.Uri
): Promise<vscode.Uri | null> {
    const wsFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    if (!wsFolder) {
        return null; // file not inside a workspace
    }
    const { folder, ext } = getConfig();
    const baseName = path.parse(fileUri.fsPath).name;

    const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
    const docsRoot = expandDocsFolder(folder, wsFolder.uri);
    const docsPath = path.join(docsRoot, `${baseName}${normalizedExt}`);
    const docsUri = vscode.Uri.file(docsPath);

    try {
        await vscode.workspace.fs.stat(docsUri);
        return docsUri;
    } catch {
        return null; // not found
    }
}

export function activate(context: vscode.ExtensionContext) {
    const openCmd = vscode.commands.registerCommand(
        "docsPreview.openForCurrentFile",
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor.");
                return;
            }

            const docsUri = await resolveDocsUriForFile(editor.document.uri);
            if (!docsUri) {
                const { folder, ext } = getConfig();
                const base = path.parse(editor.document.uri.fsPath).name;
                vscode.window.showWarningMessage(
                    `No docs found for \"${base}\" in \"${folder}\" with extension \"${ext}\".`
                );
                return;
            }

            const { toSide } = getConfig();
            await openMarkdownPreview(docsUri, toSide);
        }
    );

    context.subscriptions.push(openCmd);
}

export function deactivate() {}

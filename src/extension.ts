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

async function findFileRecursively(
    dirUri: vscode.Uri,
    fileName: string
): Promise<vscode.Uri | null> {
    try {
        // Check if the target file exists in the current directory
        const targetUri = vscode.Uri.joinPath(dirUri, fileName);
        try {
            await vscode.workspace.fs.stat(targetUri);
            return targetUri;
        } catch {
            // File not found in current directory, continue searching
        }

        // Read directory contents
        const entries = await vscode.workspace.fs.readDirectory(dirUri);

        // Search in subdirectories
        for (const [name, type] of entries) {
            if (type === vscode.FileType.Directory) {
                const subDirUri = vscode.Uri.joinPath(dirUri, name);
                const found = await findFileRecursively(subDirUri, fileName);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    } catch (error) {
        // Directory doesn't exist or can't be read
        return null;
    }
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
    const docsRootUri = vscode.Uri.file(docsRoot);
    const targetFileName = `${baseName}${normalizedExt}`;

    // First, try the original logic (direct path in docs root)
    const directPath = path.join(docsRoot, targetFileName);
    const directUri = vscode.Uri.file(directPath);

    try {
        await vscode.workspace.fs.stat(directUri);
        return directUri;
    } catch {
        // Not found in root, search recursively in subdirectories
        return await findFileRecursively(docsRootUri, targetFileName);
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
                    `No docs found for \"${base}\" in \"${folder}\" (including subfolders) with extension \"${ext}\".`
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

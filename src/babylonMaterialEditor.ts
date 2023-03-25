import * as vscode from 'vscode';

export class BabylonMaterialEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new BabylonMaterialEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(BabylonMaterialEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'babylonjs.material';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'save':
					this.updateTextDocument(document, e.text);
					return;
			}
		});

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		const editorUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'editor.js'));

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>BabylonJS Material</title>

				<style>
					body {
						padding: 0;
						height: 100vh;
						overflow: hidden;
					}
					#root {
						height: 100%;
					}
					.blocker, .hidden
					{
						display: none;
					}
				</style>
			</head>
			<body>
				<div id="root"></div>
				<canvas id="canvas"></canvas>

				<script src=" https://preview.babylonjs.com/babylon.js"></script>
				<script src=" https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
				<script src=" https://nme.babylonjs.com/babylon.nodeEditor.js"></script>
				<script src="${editorUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, text: string) {
		const edit = new vscode.WorkspaceEdit();

		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			text);

		return vscode.workspace.applyEdit(edit);
	}
}

// @ts-check

// Script run within the webview itself.
(function () {
	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const container = /** @type {HTMLElement} */ (document.querySelector('#root'));
	const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#canvas'));

	/**
	 * Render the document in the webview.
	 */
	function updateContent(/** @type {string} */ text) {
		container.children.length = 0;

		let engine = new BABYLON.Engine(canvas, false, { disableWebGL2Support: false });
		let scene = new BABYLON.Scene(engine);
		new BABYLON.HemisphericLight("light #0", new BABYLON.Vector3(0, 1, 0), scene);
		new BABYLON.HemisphericLight("light #1", new BABYLON.Vector3(0, 1, 0), scene);
		new BABYLON.HemisphericLight("light #2", new BABYLON.Vector3(0, 1, 0), scene);

		nodeMaterial = new BABYLON.NodeMaterial("node");
		nodeMaterial.loadFromSerialization(JSON.parse(text));
		nodeMaterial.build(true);

		BABYLON.NodeEditor.Show({
			nodeMaterial: nodeMaterial,
			hostElement: container,
			// customLoadObservable: customLoadObservable,
			customSave: {
				label: "Save to VSCode",
				action: (data) => {
					return Promise.resolve(
						vscode.postMessage({
							type: 'save',
							text: data,
						})
					)
				}
			},
		});

	};

	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event => {
		const message = event.data; // The json data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;
				updateContent(text);
				vscode.setState({ text });
				return;
		}
	});

	const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
}());

import * as vscode from 'vscode';
import LinkCommand from './commands/linkCommand';
import LinkCheckProvider from './providers/linkCheckProvider';

export function activate(context: vscode.ExtensionContext) {

    const linkCheckProvider = new LinkCheckProvider();
    const providerRegistrations = vscode.Disposable.from(
        vscode.workspace.registerTextDocumentContentProvider(LinkCheckProvider.scheme, linkCheckProvider),
        vscode.languages.registerDocumentLinkProvider({ scheme: LinkCheckProvider.scheme }, linkCheckProvider)
    );

    const commandRegistration = vscode.commands.registerCommand('extension.checkLinks', () => {
        vscode.window.showInformationMessage('Check Links Start...');

        return LinkCommand.checkAll().then(() => {
            const uri = vscode.Uri.parse(`${LinkCheckProvider.scheme}:Links.locations`);
            return vscode.workspace.openTextDocument(uri).then(doc => {
                vscode.window.showTextDocument(doc, vscode.window.activeTextEditor.viewColumn + 1);
                vscode.window.showInformationMessage('Check Links End!');
            });
        });
    });

    validateWhenEdit(context);

    context.subscriptions.push(
        linkCheckProvider,
        providerRegistrations,
        commandRegistration
    );
}

function validateWhenEdit(context: vscode.ExtensionContext) {
    var decorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		backgroundColor: 'rgba(255,0,0,0.3)'
	});	

    var activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerValidation();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerValidation();	
		}
	}, null, context.subscriptions);
	
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerValidation();
		}
	}, null, context.subscriptions);

    var timeout = null;	
	function triggerValidation() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(validate, 500);
	}

    function validate() {
        if (activeEditor && activeEditor.document.languageId == 'markdown') {
            var decorations : vscode.DecorationOptions[] = [];
            let locations = LinkCommand.check(activeEditor.document);
            locations.forEach(location => {
                var decoration = { range: location.range, hoverMessage: '** bad link **'};
                decorations.push(decoration);
            })
            activeEditor.setDecorations(decorationType, decorations);
        }
    }
}
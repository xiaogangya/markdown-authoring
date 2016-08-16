import * as vscode from 'vscode';
import LinkCommand from './commands/linkCommand';
import LinkCheckProvider from './providers/linkCheckProvider';
import PathCompletionProvider from './providers/pathCompletionProvider';

export function activate(context: vscode.ExtensionContext) {

    const linkCheckProvider = new LinkCheckProvider();
    const pathCompletionProvider = new PathCompletionProvider();
    const providerRegistrations = vscode.Disposable.from(
        vscode.workspace.registerTextDocumentContentProvider(LinkCheckProvider.scheme, linkCheckProvider),
        vscode.languages.registerDocumentLinkProvider({ scheme: LinkCheckProvider.scheme }, linkCheckProvider),
        vscode.languages.registerCompletionItemProvider('markdown', pathCompletionProvider, '(', '/', '\\')
    );

    const commandRegistration = vscode.commands.registerCommand('extension.checkLinks', () => {
        vscode.window.setStatusBarMessage('Check Links Start...', 5000);

        return LinkCommand.checkAll().then((locations) => {
            let resultKey = LinkCommand.putResult(locations);
            const uri = LinkCheckProvider.encodeUri(resultKey);
            return vscode.workspace.openTextDocument(uri).then(doc => {
                vscode.window.showTextDocument(doc, vscode.ViewColumn.Two).then(editor => {
                    linkCheckProvider.decorate(editor, doc);
                    vscode.window.setStatusBarMessage('Check Links End!', 5000);
                });
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
            var decorations: vscode.DecorationOptions[] = [];
            let locations = LinkCommand.check(activeEditor.document);
            locations.forEach(location => {
                var decoration = { range: location.range, hoverMessage: '** invalid link **' };
                decorations.push(decoration);
            })
            activeEditor.setDecorations(decorationType, decorations);
        }
    }
}
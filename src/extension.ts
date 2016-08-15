import * as vscode from 'vscode';
import LinkCommand from './commands/linkCommand';
import LinkCheckProvider, {encodeLocation} from './providers/linkCheckProvider';

export function activate(context: vscode.ExtensionContext) {

    const linkCheckProvider = new LinkCheckProvider();
    const providerRegistrations = vscode.Disposable.from(
        vscode.workspace.registerTextDocumentContentProvider(LinkCheckProvider.scheme, linkCheckProvider),
        vscode.languages.registerDocumentLinkProvider({ scheme: LinkCheckProvider.scheme }, linkCheckProvider)
    );

    const commandRegistration = vscode.commands.registerCommand('extension.checkLinks', () => {
        vscode.window.showInformationMessage('Check Links!');
        // LinkCommand.check();

        const editor = vscode.window.activeTextEditor;
        const uri = encodeLocation(editor.document.uri, editor.selection.active);
        return vscode.workspace.openTextDocument(uri).then(doc => vscode.window.showTextDocument(doc, editor.viewColumn + 1));
    });

    context.subscriptions.push(
        linkCheckProvider,
        providerRegistrations,
        commandRegistration
    );
}

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

        return LinkCommand.check().then(() => {
            const uri = vscode.Uri.parse(`${LinkCheckProvider.scheme}:Links.locations`);
            return vscode.workspace.openTextDocument(uri).then(doc => {
                vscode.window.showTextDocument(doc, vscode.window.activeTextEditor.viewColumn + 1);
                vscode.window.showInformationMessage('Check Links End!');
            });
        });
    });

    context.subscriptions.push(
        linkCheckProvider,
        providerRegistrations,
        commandRegistration
    );
}

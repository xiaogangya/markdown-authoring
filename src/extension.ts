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
        vscode.window.showInformationMessage('Check Links!');
        LinkCommand.check();
    });

    context.subscriptions.push(
        linkCheckProvider,
        providerRegistrations,
        commandRegistration
    );
}

import * as vscode from 'vscode';
import LinkCheckDocument from '../schemes/linkCheckDocument';
import LinkCommand from '../commands/linkCommand';

export default class LinkCheckProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {

    static scheme = 'linkCheck';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, LinkCheckDocument>();
    private _editorDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(206, 186, 44, 0.58)', textDecoration: 'underline'
    });
    private _subscriptions = new Array<vscode.Disposable>();

    constructor() {
        this._subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()))
        )
    }

    dispose() {
        this._subscriptions.forEach(d => d.dispose());
        this._documents.clear();
        this._editorDecoration.dispose();
        this._onDidChange.dispose();
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        // already loaded
        let document = this._documents.get(uri.toString());
        if (document) {
            return document.value;
        }

        const resultKey = LinkCheckProvider.decodeUri(uri);
        let locations = LinkCommand.getResult(resultKey).slice();
        locations.sort(LinkCheckProvider._compareLocations);

        // create document and return its early state
        document = new LinkCheckDocument(uri, locations, this._onDidChange);
        this._documents.set(uri.toString(), document);
        return document.value;
    }

    private static _compareLocations(a: vscode.Location, b: vscode.Location): number {
        if (a.uri.toString() < b.uri.toString()) {
            return -1;
        } else if (a.uri.toString() > b.uri.toString()) {
            return 1;
        } else {
            return a.range.start.compareTo(b.range.start)
        }
    }

    provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentLink[] {
        const doc = this._documents.get(document.uri.toString());
        if (doc) {
            return doc.links;
        }
    }

    decorate(editor: vscode.TextEditor, document: vscode.TextDocument): void {
        if (editor && document) {
            const doc = this._documents.get(document.uri.toString());
            if (doc) {
                const rangeList = doc.links.map(link => link.range);
                editor.setDecorations(this._editorDecoration, rangeList);
            }
        }
    }

    static encodeUri(resultKey: string): vscode.Uri {
        return vscode.Uri.parse(`${LinkCheckProvider.scheme}:LinkCheck.locations?${resultKey}`);
    }

    static decodeUri(uri: vscode.Uri): string {
        let resultKey = uri.query;
        return resultKey;
    }
}

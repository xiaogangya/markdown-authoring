import * as vscode from 'vscode';
import LinkCheckDocument from '../schemes/linkCheckDocument';
import LinkCheckCommand from '../commands/linkCommand';

export default class LinkCheckProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {

    static scheme = 'linkCheck';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, LinkCheckDocument>();
    private _editorDecoration = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(206, 186, 44, 0.58)', textDecoration: 'underline' });
    private _subscriptions = new Array<vscode.Disposable>();

    constructor() {

        // Listen to the following events:
        // * closeTextDocument - which means we must clear the corresponding model object - `ReferencesDocument`
        this._subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()))
            // todo: listen link check command event
        )
    }

    dispose() {
        this._subscriptions.forEach(d => d.dispose());
        this._documents.clear();
        this._editorDecoration.dispose();
        this._onDidChange.dispose();
    }

    /**
     * Expose an event to signal changes of _virtual_ documents
     * to the editor
     */
    get onDidChange() {
        return this._onDidChange.event;
    }

    /**
     * Provider method that takes an uri of the `references`-scheme and
     * resolves its content by (1) running the reference search command
     * and (2) formatting the results
     */
    provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {

        // already loaded?
        let document = this._documents.get(uri.toString());
        if (document) {
            return document.value;
        }

        // Decode target-uri and target-position from the provided uri and execute the
        // `reference provider` command (http://code.visualstudio.com/docs/extensionAPI/vscode-api-commands).
        // From the result create a references document which is in charge of loading,
        // printing, and formatting references
        let locations = LinkCheckCommand.linkLocationList.slice();

        // sort by locations and shuffle to begin from target resource
        let idx = 0;
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
        // While building the virtual document we have already created the links.
        // Those are composed from the range inside the document and a target uri
        // to which they point
        const doc = this._documents.get(document.uri.toString());
        if (doc) {
            return doc.links;
        }
    }
}

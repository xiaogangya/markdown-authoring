import * as vscode from 'vscode';
import LinkCheckDocument from '../schemes/linkCheckDocument';

export default class LinkCheckProvider implements vscode.TextDocumentContentProvider, vscode.DocumentLinkProvider {

    static scheme = 'linkCheckResults';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, LinkCheckDocument>();
    private _editorDecoration = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(206, 186, 44, 0.58)', textDecoration: 'underline' });
    private _subscriptions: vscode.Disposable;

    constructor() {

        // Listen to the following events:
        // * closeTextDocument - which means we must clear the corresponding model object - `ReferencesDocument`
        this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
    }

    dispose() {
        this._subscriptions.dispose();
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
        const [target, pos] = decodeLocation(uri);
        let locations = LinkCheckProvider.getLocationList(target);

        // sort by locations and shuffle to begin from target resource
        let idx = 0;
        locations.sort(LinkCheckProvider._compareLocations);

        // create document and return its early state
        document = new LinkCheckDocument(uri, locations, this._onDidChange);
        this._documents.set(uri.toString(), document);
        return document.value;
    }

    private static getLocationList(uri: vscode.Uri) : vscode.Location[] {
        let res = new Array<vscode.Location>();
        res.push(new vscode.Location(uri, new vscode.Range(new vscode.Position(0, 8), new vscode.Position(0, 10))));
        res.push(new vscode.Location(uri, new vscode.Range(new vscode.Position(4, 3), new vscode.Position(4, 5))));
        return res;
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

let seq = 0;

export function encodeLocation(uri: vscode.Uri, pos: vscode.Position): vscode.Uri {
    const query = JSON.stringify([uri.toString(), pos.line, pos.character]);
    return vscode.Uri.parse(`${LinkCheckProvider.scheme}:Links.locations?${query}#${seq++}`);
}

export function decodeLocation(uri: vscode.Uri): [vscode.Uri, vscode.Position] {
    let [target, line, character] = <[string, number, number]>JSON.parse(uri.query);
    return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}
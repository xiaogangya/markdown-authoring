import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import MarkdownUtils from './utilities/markdownUtils';
import PathCompletionProvider from './providers/pathCompletionProvider';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('markdown-authoring');

const throttleDuration = 500;
var throttle = {
    "uri": null,
    "timeout": null
};


export function activate(context: vscode.ExtensionContext) {
    // check all at the beginning
    checkAll();

    // register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.linkCheck', () => {
            checkAll();
        })
    )

    // register workspace events
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(didChangeTextDocument)
    );

    // register diagnotic collection
    context.subscriptions.push(diagnosticCollection);

    // register path completion provider
    const pathCompletionProvider = new PathCompletionProvider();
    const providerRegistrations = vscode.Disposable.from(
        vscode.languages.registerCompletionItemProvider('markdown', pathCompletionProvider, '(', '/', '\\', '.')
    );
    context.subscriptions.push(providerRegistrations);
}

function lint(uri: vscode.Uri, document?: vscode.TextDocument): void {
    if (path.extname(uri.fsPath) !== '.md') {
        return;
    }

    const invalidLinks = check(uri, document);
    let diagnostics = [];
    invalidLinks.forEach(link => {
        let diangostic = new vscode.Diagnostic(
            link.location.range,
            'Invalid relative reference link',
            vscode.DiagnosticSeverity.Warning
        );
        diangostic.source = link.source;
        diagnostics.push(diangostic);
    })

    diagnosticCollection.set(uri, diagnostics);
}

function didChangeTextDocument(change: any): void {
    requestLint(change.document.uri, change.document);
}

function suppressLint(uri: vscode.Uri): void {
    if (throttle.timeout && (uri === throttle.uri)) {
        clearTimeout(throttle.timeout);
        throttle.uri = null;
        throttle.timeout = null;
    }
}

function requestLint(uri: vscode.Uri, document?: vscode.TextDocument): void {
    suppressLint(uri);
    throttle.uri = uri;
    throttle.timeout = setTimeout(function waitThrottleDuration() {
        // Do not use throttle.document in this function; it may have changed
        lint(uri, document);
        suppressLint(uri);
    }, throttleDuration);
}

function checkAll(): void {
    vscode.window.setStatusBarMessage('start check links for all markdown files...',
        vscode.workspace.findFiles('**/*.md', '').then(uriList => {
            diagnosticCollection.clear();

            var openedDocuments = vscode.workspace.textDocuments;
            var openedUris = openedDocuments.map(x => x.uri);

            uriList.map(uri => {
                let index = openedUris.findIndex(x => x.fsPath === uri.fsPath);
                if (index >= 0) {
                    lint(uri, openedDocuments[index]);
                } else {
                    lint(uri);
                }
            });
        }).then(() => {
            vscode.window.setStatusBarMessage('end check links for all markdown files!', 5000);
        }));
}

function check(uri: vscode.Uri, document?: vscode.TextDocument): Array<any> {
    let positionList = MarkdownUtils.getLinkPositionList(
        path.dirname(uri.fsPath),
        document ? document.getText() : fs.readFileSync(uri.fsPath).toString());
    positionList = positionList.filter((position: any): boolean => {
        return !position.isValid;
    })

    let result = new Array<any>();
    positionList.forEach(position => {
        result.push({
            'location': new vscode.Location(
                vscode.Uri.file(uri.fsPath),
                new vscode.Range(
                    new vscode.Position(position.rowNum, position.colStart),
                    new vscode.Position(position.rowNum, position.colEnd))
            ),
            'source': position.source
        })
    })
    return result;
}
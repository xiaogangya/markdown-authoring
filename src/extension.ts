import * as vscode from 'vscode';
import MarkdownUtils from './utilities/markdownUtils';
import PathCompletionProvider from './providers/pathCompletionProvider';

const markdownLanguageId = "markdown";
const throttleDuration = 500;

const diagnosticCollection = vscode.languages.createDiagnosticCollection('markdown-authoring');
var throttle = {
    "document": null,
    "timeout": null
};


export function activate(context: vscode.ExtensionContext) {

    // register workspace events
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(lint),
        vscode.workspace.onDidChangeTextDocument(didChangeTextDocument),
        vscode.workspace.onDidCloseTextDocument(didCloseTextDocument)
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

function lint(document: vscode.TextDocument): void {
    if (document.languageId !== markdownLanguageId) {
        return;
    }

    const invalidLinks = check(document);
    let diagnostics = [];
    invalidLinks.forEach(link => {
        let diangostic = new vscode.Diagnostic(
            link.range,
            'invalid relative reference link',
            vscode.DiagnosticSeverity.Warning
        );
        diangostic.source = document.lineAt(link.range.start.line).text
            .substring(link.range.start.character, link.range.end.character);
        diagnostics.push(diangostic);
    })

    diagnosticCollection.set(document.uri, diagnostics);
}

function didChangeTextDocument(change: any): void {
    requestLint(change.document);
}

function didCloseTextDocument(document: vscode.TextDocument): void {
    suppressLint(document);
    diagnosticCollection.delete(document.uri);
}

function suppressLint(document: vscode.TextDocument): void {
    if (throttle.timeout && (document === throttle.document)) {
        clearTimeout(throttle.timeout);
        throttle.document = null;
        throttle.timeout = null;
    }
}

function requestLint(document: vscode.TextDocument): void {
    suppressLint(document);
    throttle.document = document;
    throttle.timeout = setTimeout(function waitThrottleDuration() {
        // Do not use throttle.document in this function; it may have changed
        lint(document);
        suppressLint(document);
    }, throttleDuration);
}

function check(document: vscode.TextDocument): Array<vscode.Location> {
    let positionList = MarkdownUtils.getLinkPositionList(document.uri.fsPath, document.getText());
    positionList = positionList.filter((position: any): boolean => {
        return !position.isValid;
    })

    let result = new Array<vscode.Location>();
    positionList.forEach(position => {
        result.push(new vscode.Location(
            vscode.Uri.file(document.uri.path),
            new vscode.Range(
                new vscode.Position(position.rowNum, position.colStart),
                new vscode.Position(position.rowNum, position.colEnd))
        ))
    })
    return result;
}
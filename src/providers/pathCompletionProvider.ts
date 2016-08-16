import * as vscode from 'vscode';
import * as path from 'path'
import * as fsUtils from '../utilities/fsUtils'
import MarkdownUtils from '../utilities/markdownUtils'

class UpCompletionItem extends vscode.CompletionItem {
    constructor() {
        super('..');
        this.kind = vscode.CompletionItemKind.File;
    }
}
export class PathCompletionItem extends vscode.CompletionItem {
    constructor(filename: string, isfile: boolean) {
        super(filename);

        this.kind = vscode.CompletionItemKind.File;

        this.addGroupByFolderFile(filename, isfile);
        this.addSlashForFolder(filename, isfile);
    }

    addGroupByFolderFile(filename: string, isfile: boolean) {
        this.sortText = `${isfile ? 'b' : 'a'}_${filename}`;
    }

    addSlashForFolder(filename: string, isfile: boolean) {
        if (!isfile) {
            this.label = `${filename}/`;
            this.insertText = filename;
        }
    }

}

export default class PathCompletionProvider implements vscode.CompletionItemProvider {

    constructor() { }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.CompletionItem[]> {
        const line = document.getText(document.lineAt(position).range);
        const partialLinkText = MarkdownUtils.getPartialLinkText(line, position.character);
        const startPath = fsUtils.getPath(document.fileName, partialLinkText);

        if (partialLinkText != null) {
            return fsUtils.getChildren(startPath).then(children => {
                return [
                    new UpCompletionItem(),
                    ...children.map(child => new PathCompletionItem(child.file, child.isFile))
                ];
            });
        } else {
            return Promise.resolve([]);
        }
    }
}
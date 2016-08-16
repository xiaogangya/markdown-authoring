import * as vscode from 'vscode';
import * as path from 'path'
import * as fs from 'fs'
import MarkdownUtils from '../utilities/markdownUtils'

class UpCompletionItem extends vscode.CompletionItem {
    constructor() {
        super('..');
        this.kind = vscode.CompletionItemKind.File;
    }
}

class PathCompletionItem extends vscode.CompletionItem {
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

class FileInfo {
    file: string;
    isFile: boolean;

    constructor(dir: string, file: string) {
        this.file = file;
        this.isFile = fs.statSync(path.join(dir, file)).isFile();
    }
}

export default class PathCompletionProvider implements vscode.CompletionItemProvider {

    constructor() { }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.CompletionItem[]> {
        const line = document.getText(document.lineAt(position).range);
        const partialLinkText = MarkdownUtils.getPartialLinkText(line, position.character);
        console.log(partialLinkText)
        const startPath = MarkdownUtils.resolvePath(path.dirname(document.fileName), partialLinkText);
        console.log(startPath)

        if (partialLinkText != null) {
            return this.getChildren(startPath).then(children => {
                return [
                    new UpCompletionItem(),
                    ...children.map(child => new PathCompletionItem(child.file, child.isFile))
                ];
            });
        } else {
            return Promise.resolve([]);
        }
    }

    private getChildren(startPath: string, maxResults?: number) {
        return this.readdir(startPath)
            .then(files => files.filter(filename => filename[0] !== '.').map(f => new FileInfo(startPath, f)))
            .catch(() => []);
    }

    private readdir(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path, (error, files) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(files);
                }
            });
        });
    }
}

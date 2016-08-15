import { CompletionItemProvider, TextDocument, Position, CompletionItem, CompletionItemKind } from 'vscode';
import * as path from 'path'
import * as fshelper from '../utilities/fshelper'
import MarkdownHelper from '../utilities/markdown'

class UpCompletionItem extends CompletionItem {
    constructor() {
        super('..');
        this.kind = CompletionItemKind.File;
    }
}
export class PathCompletionItem extends CompletionItem {
    constructor(filename : string, isfile : boolean) {
        super(filename);
        
        this.kind = CompletionItemKind.File;
        
        this.addGroupByFolderFile(filename, isfile);
        this.addSlashForFolder(filename, isfile);
    }
    
    addGroupByFolderFile(filename : string, isfile : boolean) {
        this.sortText = `${isfile ? 'b' : 'a'}_${filename}`;
    }
    
    addSlashForFolder(filename : string, isfile : boolean) {
        if (!isfile) {
            this.label = `${filename}/`;
            this.insertText = filename; 
        }
    }
    
}

export default class PathIntellisense implements CompletionItemProvider {
    
    constructor() { }
    
    provideCompletionItems(document: TextDocument, position: Position): Thenable<CompletionItem[]> {
        const line = document.getText(document.lineAt(position).range);
        const partialLinkText = MarkdownHelper.getPartialLinkText(line, position.character);
        const startPath = fshelper.getPath(document.fileName, partialLinkText);

        if (partialLinkText != null) {
            return fshelper.getChildren(startPath).then(children => {
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
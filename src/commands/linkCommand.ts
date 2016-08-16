import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import MarkdownUtils from '../utilities/markdownUtils';

export default class LinkCommand {
    static checkAll(): Thenable<Array<vscode.Location>> {
        return vscode.workspace.findFiles('**/*.md', '').then(uriList => {
            return Promise.all<any>(uriList.map(uri => {
                try {
                    return {
                        text: fs.readFileSync(uri.fsPath, "UTF-8"),
                        path: uri.fsPath
                    };
                } catch(e) {
                    return null;
                }
            })).then(fileList => {
                let result = new Array<vscode.Location>();
                fileList.filter(d => d != null).forEach(file => {
                    let postions = LinkCommand.check(file.text, file.path);
                    result = result.concat(postions);
                })
                return result;
            })
        })
    }

    static check(text: string, filepath: string): Array<vscode.Location> {
        let positionList = MarkdownUtils.getLinkPositionList(path.dirname(filepath), text);
        positionList = positionList.filter((position: any): boolean => {
            return !position.isValid;
        })

        let result = new Array<vscode.Location>();
        positionList.forEach(position => {
            result.push(new vscode.Location(
                vscode.Uri.file(filepath),
                new vscode.Range(
                    new vscode.Position(position.rowNum, position.colStart),
                    new vscode.Position(position.rowNum, position.colEnd))
            ))
        })
        return result;
    }
}

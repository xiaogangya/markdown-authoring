import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import MarkdownUtils from '../utilities/markdownUtils'

let uuid = require('node-uuid')

export default class LinkCommand {
    static results: Map<String, Array<vscode.Location>> = new Map<String, Array<vscode.Location>>()

    static putResult(result: Array<vscode.Location>): string {
        let key: string = uuid.v4()
        LinkCommand.results["linkCheck:" + key] = result;
        return key
    }

    static getResult(key: string): Array<vscode.Location> {
        return LinkCommand.results[key]
    }

    static deleteResult(key: string) {
        LinkCommand.results.delete(key)
    }

    static checkAll(): Thenable<Array<vscode.Location>> {
        return vscode.workspace.findFiles('**/*.md', '').then(uriList => {
            return Promise.all<vscode.TextDocument>(uriList.map(uri => {
                return vscode.workspace.openTextDocument(uri);
            })).then(documentList => {
                let result = new Array<vscode.Location>();
                documentList.forEach(document => {
                    let postions = LinkCommand.check(document);
                    result = result.concat(postions);
                })
                return result;
            })
        })
    }

    static check(document: vscode.TextDocument): Array<vscode.Location> {
        const text = document.getText();
        let positionList = MarkdownUtils.getLinkPositionList(path.dirname(document.uri.fsPath), text);
        positionList = positionList.filter((position: any): boolean => {
            return !position.isValid;
        })

        let result = new Array<vscode.Location>();
        positionList.forEach(position => {
            result.push(new vscode.Location(
                document.uri,
                new vscode.Range(
                    new vscode.Position(position.rowNum, position.colStart),
                    new vscode.Position(position.rowNum, position.colEnd))
            ))
        })
        return result;
    }
}

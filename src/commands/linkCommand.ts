import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Markdown from '../utilities/markdown'

export default class LinkCommand {
  static linkLocationList = new Array<vscode.Location>()

  static check(): Thenable<void> {
    LinkCommand.linkLocationList = new Array<vscode.Location>();

    return vscode.workspace.findFiles('**/*.md', '').then(uriList => {
      Promise.all<vscode.TextDocument>(uriList.map(uri => {
        return vscode.workspace.openTextDocument(uri);
      })).then(documentList => {
        documentList.forEach(document => {
          const text = document.getText();
          var positionList = Markdown.getLinkPositionList(text);
          positionList = positionList.filter((position: any): boolean => {
            var filePath = path.normalize(path.join(document.uri.fsPath, position.url));
            return !fs.existsSync(filePath);
          })

          positionList.forEach(position => {
            LinkCommand.linkLocationList.push(new vscode.Location(
              document.uri,
              new vscode.Range(
                new vscode.Position(position.rowNum, position.columnNumStart), 
                new vscode.Position(position.rowNum, position.columnNumEnd))
            ))
          })
        })
      })
    })
  }
  
}

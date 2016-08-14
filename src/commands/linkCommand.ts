import * as vscode from 'vscode';
import Markdown from '../utilities/markdown'

export default class LinkCommand {

  static check(): void {
    vscode.workspace.findFiles('**/*.md', '').then(uriList => {
      Promise.all<vscode.TextDocument>(uriList.map(uri => {
        return vscode.workspace.openTextDocument(uri);
      })).then(documentList => {
        documentList.forEach(document => {
          const text = document.getText();
          var positionList = Markdown.getLinkPositionList(text);
          if (positionList != []) {
            console.log(document);
            console.log(positionList);
          }
        })
      })
    })
  }
  
}

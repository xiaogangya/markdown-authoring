var vscode = require('vscode');
var checkLinks = require('./commands/checkLinks')

module.exports = {
  activate: function(context) {
    console.log('Congratulations, your extension "markdown-authoring" is now active!');

    var disposable = vscode.commands.registerCommand('extension.checkLinks', function (entity) {
      vscode.window.showInformationMessage('Check Links!');

      // triggered by file context menu, entity is a file
      if (entity && entity.path) {
        vscode.workspace.openTextDocument(entity.path).then(function(document) {
          vscode.window.showTextDocument(document, vscode.ViewColumn.One).then(function(editor) {
            checkLinks.do();
          })
        })
      } else {
        checkLinks.do();
      }
    });

    context.subscriptions.push(disposable);
  },

  deactivate: function() {
  }
}


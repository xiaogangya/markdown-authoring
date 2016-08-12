var vscode = require('vscode');
var marked = require('marked');

module.exports = {
  do: function() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    if (this.isMarkdown(editor)) {
      // var tokens = marked.lexer(editor.document.getText());
      // console.log(tokens);
      // this.highlight('');
    }
  },

  isMarkdown: function(editor) {
    return editor.document.languageId == 'markdown';
  },

  highlight: function(content) {
    var elements = document.getElementsByTagName('.view-line span');
    elements.each(function () {
      var text = this.innerHTML;
      if (text == content) {
        this.css('background-color', 'green');
      }
    })
  }
}
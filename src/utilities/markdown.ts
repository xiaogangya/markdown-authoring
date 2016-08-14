class regexrepl {
  private resultSrc : string;
  private opt : string;

  constructor(regex : RegExp, opt ?: string) {
    this.resultSrc = regex.source;
    this.opt = opt || '';
  }

  result() {
    return new RegExp(this.resultSrc, this.opt);
  }

  replace(name : string, val : RegExp) : regexrepl {
    var valSrc = val.source;
    valSrc = valSrc.replace(/(^|[^\[])\^/g, '$1');
    this.resultSrc = this.resultSrc.replace(name, valSrc);
    return this;
  }
}

export default class Markdown {
  // regex replacing helper from marked
  private static replace(regex : RegExp, opt?: string) {
    return new regexrepl(regex, opt);
  }

  private static regex_inside : RegExp = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
  private static regex_href : RegExp = /\s*<?([\s\S]*?)>?(?:\s+['\"]([\s\S]*?)['\"])?\s*/;
  private static regex_link : RegExp = Markdown.replace(/!?\[(inside)\]\(href\)/)
    .replace('inside', Markdown.regex_inside)
    .replace('href', Markdown.regex_href)
    .result();
  
  private static parseLink(rowNum: number, rowText: string): any[] {
    let res = [];

    var match;
    var regex = new RegExp(Markdown.regex_link.source, 'g');
    while (match = regex.exec(rowText)) {
      res.push({
        url: match[0],
        rowNum: rowNum,
        columnNumStart: match.index,
        columnNumEnd: match.index + match[0].length
      })
    }

    return res;
  }

  public static getLinkPositionList(text: string): any[] {
    let res = [];

    let rowList = text.split('\n');
    rowList.forEach((rowText, rowNum) => {
      res = res.concat(this.parseLink(rowNum, rowText))
    })

    return res;
  }
}

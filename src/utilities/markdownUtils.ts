import * as fsUtils from './fsUtils';

class RegexRepl {
  private resultSrc: string;
  private opt: string;

  constructor(regex: RegExp, opt?: string) {
    this.resultSrc = regex.source;
    this.opt = opt || '';
  }

  result() {
    return new RegExp(this.resultSrc, this.opt);
  }

  replace(name: string, val: RegExp): RegexRepl {
    var valSrc = val.source;
    valSrc = valSrc.replace(/(^|[^\[])\^/g, '$1');
    this.resultSrc = this.resultSrc.replace(name, valSrc);
    return this;
  }
}

export default class MarkdownHelper {
  // regex replacing helper from marked
  private static replace(regex: RegExp, opt?: string) {
    return new RegexRepl(regex, opt);
  }

  private static regex_link_text: RegExp = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
  private static regex_link_href: RegExp = /\s*<?([\s\S]*?)>?(?:\s+['\"]([\s\S]*?)['\"])?\s*/;
  private static regex_link: RegExp = MarkdownHelper.replace(/!?\[(?:inside)\]\(href\)/g)
    .replace('inside', MarkdownHelper.regex_link_text)
    .replace('href', MarkdownHelper.regex_link_href)
    .result();
  private static regex_link_partial: RegExp = MarkdownHelper.replace(/!?\[(?:inside)\]\(href$/)
    .replace('inside', MarkdownHelper.regex_link_text)
    .replace('href', MarkdownHelper.regex_link_href)
    .result();

  private static parseLink(rowNum: number, rowText: string): any[] {
    let res = [];

    var match;
    var regex = new RegExp(MarkdownHelper.regex_link.source, 'g');
    while (match = regex.exec(rowText)) {
      var url: string = match[1]
      var isValid = true
      var isFileLink = false
      if (!url.includes("://")) {
        // considered as a path
        isFileLink = true
      }
      res.push({
        url: url,
        rowNum: rowNum,
        colStart: match.index,
        colEnd: match.index + match[0].length,
        isFileLink: isFileLink,
        isValid: true
      })
    }

    return res;
  }

  public static getLinkPositionList(path: string, text: string): any[] {
    let res = [];

    let rowList = text.split('\n');
    rowList.forEach((rowText, rowNum) => {
      var links = MarkdownHelper.parseLink(rowNum, rowText)
      links.forEach(link => {
        if (link.isFileLink) {
          link.isValid = fsUtils.fileExists(path, link.url)
        }
      })
      res = res.concat(links)
    })

    return res;
  }

  public static getPartialLinkText(text: string, pos: number): string {
    let context = text.substring(0, pos)

    var match;
    var regex = new RegExp(MarkdownHelper.regex_link_partial.source, 'g');
    if (match = regex.exec(context)) {
      return match[1]
    }
    return null;
  }
}

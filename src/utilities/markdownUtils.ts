import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

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
    let valSrc = val.source;
    valSrc = valSrc.replace(/(^|[^\[])\^/g, '$1');
    this.resultSrc = this.resultSrc.replace(name, valSrc);
    return this;
  }
}

export default class MarkdownUtils {
  // regex replacing helper from marked
  private static replace(regex: RegExp, opt?: string) {
    return new RegexRepl(regex, opt);
  }

  private static regex_link_text: RegExp = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
  private static regex_link_href: RegExp = /\s*<?([\s\S]*?)>?(?:\s+['\"]([\s\S]*?)['\"])?\s*/;
  private static regex_link: RegExp = MarkdownUtils.replace(/!?\[(?:inside)\]\(href\)/g)
    .replace('inside', MarkdownUtils.regex_link_text)
    .replace('href', MarkdownUtils.regex_link_href)
    .result();
  private static regex_link_partial: RegExp = MarkdownUtils.replace(/!?\[(?:inside)\]\(href$/)
    .replace('inside', MarkdownUtils.regex_link_text)
    .replace('href', MarkdownUtils.regex_link_href)
    .result();

  private static regex_def: RegExp = /^ *\[[^\]]+\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])?\s*$/;
  private static regex_def_partial: RegExp = /^ *\[[^\]]+\]: *<?([^\s>]+)$/;

  private static parseLink(rowNum: number, rowText: string): any[] {
    let result = [];
    result = result.concat(this.parseLinkInternal(rowNum, rowText, MarkdownUtils.regex_link));
    result = result.concat(this.parseLinkInternal(rowNum, rowText, MarkdownUtils.regex_def));

    return result;
  }

  private static parseLinkInternal(rowNum: number, rowText: string, regexp: RegExp): any[] {
    let result = [];

    let match;
    let reg = new RegExp(regexp.source, 'g');
    while (match = reg.exec(rowText)) {
      let url: string = match[1];
      let isFileLink = MarkdownUtils.isFileLink(url);
      if (isFileLink) {
        url = MarkdownUtils.getFileLink(url);
      }
     
      result.push({
        source: match[1],
        url: url,
        rowNum: rowNum,
        colStart: match.index,
        colEnd: match.index + match[0].length,
        isFileLink: isFileLink,
        isValid: true
      })
    }

    return result;
  }

  private static isFileLink(url: string): boolean {
    // etc. http:, mailto:
    if (url.includes(':')) return false;
    // etc. #asdf
    if (url.startsWith('#')) return false;
    // etc. /a/b
    // remove trailing #
    url = this.getFileLink(url);
    // get file extension, if longer than 5 characters, ignore
    // because the java package like com.microsoft.xxx may contain . as well.
    if (path.extname(url).length == 0 || path.extname(url).length > 4) return false;

    return true;
  }

  private static getFileLink(url: string): string {
    let index = url.indexOf('#');
    if (index > 0) {
      url = url.substring(0, index);
    }
    return url;
  }

  private static fileExists(currentPath: string, file: string) {
    const fullpath = path.resolve(MarkdownUtils.resolvePath(currentPath, file), path.basename(file));
    return fs.existsSync(fullpath) && fs.statSync(fullpath).isFile();
  }

  public static getLinkPositionList(path: string, text: string): any[] {
    let res = [];

    let rowList = text.split('\n');
    rowList.forEach((rowText, rowNum) => {
      var links = MarkdownUtils.parseLink(rowNum, rowText)
      links.forEach(link => {
        if (link.isFileLink) {
          link.isValid = MarkdownUtils.fileExists(path, link.url)
        }
      })
      res = res.concat(links)
    })

    return res;
  }

  public static getPartialLinkText(text: string, pos: number): string {
    let context = text.substring(0, pos)

    let match;
    let regex = new RegExp(MarkdownUtils.regex_link_partial.source, 'g');
    if (match = regex.exec(context)) {
      return match[1]
    }
    regex = new RegExp(MarkdownUtils.regex_def_partial.source, 'g');
    if (match = regex.exec(context)) {
      return match[1]
    }
    return null;
  }

  public static resolvePath(currentPath: string, linkText: string): string {
    let rootPath = vscode.workspace.rootPath;
    if (!rootPath) {
      rootPath = currentPath;
    }

    let textdir = linkText;
    if (!linkText.endsWith("/") && !linkText.endsWith("\\")) {
      textdir = path.dirname(linkText);
    }
    if (linkText.startsWith("/") || linkText.startsWith("\\")) {
      return path.resolve(rootPath, "." + textdir);
    } else {
      return path.resolve(currentPath, textdir);
    }
  }
}

import { JSX_OPEN_TAG_PARSER, JSX_CLOSE_TAG_PARSER, JSX_SELF_CLOSE_TAG_PARSER } from './jsxParser'
import transformJSX from './transformJSX'


function parseMarkdownContent(state, startIndent, startLine, maxLine) {
  var pos, max, lineText, blkIndent, indent
  var nextLine = startLine

  for (; nextLine < maxLine; nextLine++) {
    indent = state.sCount[nextLine]
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    lineText = state.src.slice(pos, max);

    if (lineText === '') continue;
    if (indent < startIndent) return;
    if (blkIndent === undefined) {
      blkIndent = indent
    }
    else if (lineText === '</markdown>' && state.sCount[nextLine] === startIndent) {
      return {
        key: '$$mdx_block_'+Math.random().toString(36).substring(7),
        contentStart: startLine,
        contentEnd: nextLine,
        blkIndent: blkIndent || 0,
      }
    }
    else if (indent < blkIndent) {
      return
    }
  }
}


export default function jsx_block(state, startLine, endLine, silent) {
  var i, nextLine, token, lineText, result, type,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  lineText = state.src.slice(pos, max);

  result = JSX_OPEN_TAG_PARSER.parse(lineText.trim());

  if (!result.status) { return false; }

  type = result.value.value

  if (silent) {
    // true if this sequence can be a terminator, false otherwise
    return true;
  }

  nextLine = startLine + 1;

  // If we are here - we detected HTML block.
  // Let's roll down till block end.
  const isSelfClosing =
    JSX_SELF_CLOSE_TAG_PARSER.parse(lineText.trim()).status

  let content
  let js

  let markdownContents = []

  if (!isSelfClosing) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (lineText === '<markdown>') {
        const markdownContent = parseMarkdownContent(state, state.sCount[nextLine], nextLine + 1, endLine)
        if (markdownContent) {
          markdownContents.push(markdownContent)
          nextLine = markdownContent.contentEnd
          continue
        }
      }

      result = JSX_CLOSE_TAG_PARSER.parse(lineText)

      if (result.value === type) {
        let line = startLine;
        const codes = []
        for (let { key, contentStart, contentEnd, blkIndent } of markdownContents) {
          codes.push(
            state.getLines(line, contentStart - 1, state.blkIndent, true).trim(),
            `{${key}}`
          )
          line = contentEnd + 1
        }
        codes.push(state.getLines(line, nextLine + 1, state.blkIndent, true).trim())
        const code = codes.join('\n')

        js = transformJSX(code)

        if (js) {
          nextLine++
          break
        }
      }
    }
  }

  if (!js) {
    markdownContents = []
    content = state.getLines(startLine, nextLine, state.blkIndent, true)
    js = transformJSX(content)
  }

  if (!js) {
    return false
  }

  state.line = nextLine;

  if (!silent) {
    if (markdownContents.length === 0) {
      token         = state.push('jsx_block', '', 0);
      token.map     = [ startLine, nextLine ];
      token.content = js;
    }
    else {
      const originalBlkIndent = state.blkIndent
      let line = 0
      const jsLines = js.split('\n')
      let first = 1
      for (let { key, contentStart, contentEnd, blkIndent } of markdownContents) {
        let startLine = line
        while (jsLines[line].indexOf(key) === -1) {
          line++
        }

        if (startLine !== line) {
          token         = state.push('jsx_block', '', first);
          token.content = jsLines.slice(startLine, line).join('\n').replace(/,$/, '')
        }

        first = 0
        line++

        token         = state.push('jsx_block', '', 1);
        token.content = 'markdown({}'

        state.blkIndent = blkIndent
        state.md.block.tokenize(state, contentStart, contentEnd);

        token         = state.push('jsx_block', '', -1);
        token.content = ')'
      }

      state.originalBlkIndent = originalBlkIndent

      token         = state.push('jsx_block', '', first - 1);
      token.content = jsLines.slice(line).join('\n')
    }
  }
  return true;
};

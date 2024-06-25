'use strict';
import * as vscode from 'vscode';

const messages = {
  unselection: "Currently not selected",
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ...[
      "CodeWrapper.wrapTextWithSingleQuotes",
      "CodeWrapper.wrapTextWithDoubleQuotes",
      "CodeWrapper.wrapTextWithBackticks",
      "CodeWrapper.wrapTextWithRoundBrackets",
      "CodeWrapper.wrapTextWithSquareBrackets",
      "CodeWrapper.wrapTextWithCurlyBrackets",
    ].map((command, index) => vscode.commands.registerTextEditorCommand(
      command,
      async(editor) => {
        const character_map = ["'", "\"", "`", "(", "[", "{"];

        if (!HasSelection(editor)) {
          vscode.window.showWarningMessage(messages.unselection);
          return;
        }

        WrapSelections(editor, `${character_map[index]}\$0${OverturnCharacter(character_map[index])}`);
      }
    )),

    vscode.commands.registerTextEditorCommand(
      "CodeWrapper.wrapText",
      async(editor) => {
        if (!HasSelection(editor)) {
          vscode.window.showWarningMessage(messages.unselection);
          return;
        }

        const input = await vscode.window.showInputBox();
        if (input === undefined)
          return;

        const left_wrap_text = input;
        const right_wrap_text = input.split(/\b/).flatMap((str) => {
          if (HasAsciiPunctuation(str)) {
            // 将标点串分割并将某些字符反转
            // Split punctuation string and reverse some characters
            return str.split("").map((char) => {
              return OverturnCharacter(char);
            });
          } else {
            return str;
          }
        }).reverse().join("");


        WrapSelections(editor, `${left_wrap_text}\$0${right_wrap_text}`);
      }
    ),

    vscode.commands.registerTextEditorCommand(
      "CodeWrapper.wrapTextWithTag",
      async(editor) => {
        const { document } = editor;
        let snippet_str = "";

        if (["html", "xml", "jsx", "tsx"].includes(document.languageId)) {
          snippet_str = `<\${1:div} class="\$2"\$3>\$0</\${1:div}>`;
        } else if (document.languageId === "xml" || document.isUntitled) {
          snippet_str = `<\${1:tag} \${2:attr}="\$3"\$4}>\$0</\${1:tag}>`;
        } else {
          vscode.window.showWarningMessage("This document type is unsupported");
        }

        if (!HasSelection(editor)) {
          vscode.window.showWarningMessage(messages.unselection);
          return;
        }

        WrapSelections(editor, snippet_str);
      }
    ),
  );
};

function HasAsciiPunctuation(char: string) {
  return /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(char);
}

function HasSelection({ selections }: vscode.TextEditor) {
  return selections.length > 0 && !selections.every((sel) => sel.isEmpty);
}

function OverturnCharacter(char: string) {
  const char_overturn_table: { [key: string]: string | undefined } = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">",
    ")": "(",
    "]": "[",
    "}": "{",
    ">": "<",
  };

  return char_overturn_table[char] ?? char;
}

function WrapSelections(
  editor: vscode.TextEditor,
  snippet_str: string,
) {
  const { document, selections } = editor;

  for (const selection of selections) {
    if (selection.isEmpty)
      continue;

    const workspace_edit = new vscode.WorkspaceEdit();
    let wrap_range = selection as vscode.Range;
    let wrap_text = document.getText(wrap_range);


    if (!selection.isSingleLine) {
      // 多行选择
      // Multi-line selection

      const start_line = document.lineAt(selection.start);

      // 判断开始光标的位置
      if (selection.start.character === start_line.text.length) {
        // 光标在行尾

        const wrap_start_line = document.lineAt(selection.start.line + 1);

        wrap_range = new vscode.Range(
          wrap_start_line.lineNumber, wrap_start_line.firstNonWhitespaceCharacterIndex,
          selection.end.line, selection.end.character
        );
      } else if (selection.start.character < start_line.firstNonWhitespaceCharacterIndex) {
        // 光标在行首

        wrap_range = new vscode.Range(
          start_line.lineNumber, start_line.firstNonWhitespaceCharacterIndex,
          selection.end.line, selection.end.character
        );
      }

      wrap_text = document.getText(wrap_range).split(/\n\r?/)
        .map((line, idx) => {
          if (idx === 0)
            return line;

          return "\t" + line;
        }).join("\n");

      snippet_str = snippet_str.replace("$0", "\n\t\$0\n");
    }

    const snippet = new vscode.SnippetString(snippet_str.replace(
      "$0",
      `\${0:${wrap_text.replace("$0", "\\$0")}}`
    ));
    const snippet_edit = new vscode.SnippetTextEdit(wrap_range, snippet);

    workspace_edit.set(document.uri, [snippet_edit]);
    vscode.workspace.applyEdit(workspace_edit);
  }
}

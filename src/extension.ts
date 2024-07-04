'use strict';
import * as vscode from 'vscode';
import {
  SnippetString,
  SnippetTextEdit,
} from 'vscode';

const messages = {
  unselection: "Currently not selected",
  document_type_unsupported: "This document type is unsupported",
}

export function activate(context: vscode.ExtensionContext) {
  const configration = vscode.workspace.getConfiguration("CodeWrapper");
  const html_tag_support_type = configration.get("htmlTagSupportType", [
    "html",
    "jsx",
    "tsx",
    "vue"
  ]) as string[];
  const tag_support_type = configration.get("tagSupportType", []) as string[];

  context.subscriptions.push(
    ...Object.entries({
      SingleQuotes:   "'",
      DoubleQuotes:   "\"",
      Backticks:      "`",
      RoundBrackets:  "(",
      SquareBrackets: "[",
      CurlyBrackets:  "{",
      AngleBrackets:  "<",
    }).map(([command, char]) => vscode.commands.registerTextEditorCommand(
      "CodeWrapper.wrapTextWith" + command,
      async(editor) => {
        if (!HasSelection(editor)) {
          vscode.window.showWarningMessage(messages.unselection);
          return;
        }

        WrapSelections(editor, `${char}\$0${OverturnCharacter(char)}`);
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

        if (html_tag_support_type.includes(document.languageId)) {
          snippet_str = `<\${1:div} class="\$2"\$3>\$0</\${1:div}>`;
        } else if (
          tag_support_type.length === 0 ||
          tag_support_type.includes(document.languageId) ||
          document.isUntitled
        ) {
          snippet_str = `<\${1:tag} \${2:attr}="\$3"\$4}>\$0</\${1:tag}>`;
        } else {
          vscode.window.showWarningMessage(messages.document_type_unsupported);
          return;
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

function HasAsciiPunctuation(str: string) {
  return /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(str);
}

function HasSelection({ selections }: vscode.TextEditor) {
  return selections.length > 0 && !selections.every((sel) => sel.isEmpty);
}

const match_$0 = /\$0|\$\{0([^}]|(?<=\\\\)\})*\}/;

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
  const snippet_edits = [] as SnippetTextEdit[];

  snippet_str = snippet_str.replace(match_$0, "\$0");

  for (const selection of selections) {
    if (selection.isEmpty)
      continue;

    let wrap_range = selection as vscode.Range;
    let actual_snippet_str = snippet_str;
    let inner_text = document.getText(wrap_range);


    if (!wrap_range.isSingleLine) {
      const start_line = document.lineAt(wrap_range.start);
      let wrap_start: vscode.Position | undefined;

      if (wrap_range.start.character === start_line.text.length) {
        // 光标在行尾
        // The cursor is at the end of the line

        const start_line = document.lineAt(wrap_range.start.line + 1);

        wrap_start = new vscode.Position(
          start_line.lineNumber,
          start_line.firstNonWhitespaceCharacterIndex
        );
      } else if (
        wrap_range.start.character < start_line.firstNonWhitespaceCharacterIndex
      ) {
        // 光标在行首
        // The cursor is at the beginning of the line

        wrap_start = new vscode.Position(
          start_line.lineNumber,
          start_line.firstNonWhitespaceCharacterIndex
        );
      }

      wrap_range = wrap_range.with({ start: wrap_start });

      inner_text = document.getText(wrap_range).split(/\n\r?/)
        .reduce((prev_line, curr_line) => prev_line + "\n\t" + curr_line)

      actual_snippet_str = snippet_str.replace("\$0", "\n\t\$0\n");
    }

    // 处理特殊字符
    // Handle special characters
    inner_text = inner_text.replace(/([\\$}])/g, "\\$1");

    snippet_edits.push(new SnippetTextEdit(
      wrap_range,
      new SnippetString(
        actual_snippet_str.replace("\$0", `\${0:${inner_text}}`)
      )
    ));
  }


  const workspace_edit = new vscode.WorkspaceEdit();
  workspace_edit.set(document.uri, snippet_edits);
  vscode.workspace.applyEdit(workspace_edit);
}

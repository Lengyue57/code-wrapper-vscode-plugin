# Code Wrapper

This plugin can be wrap your code with a customizable text.

The idea for make this plugin came from [Wrap Selection](https://marketplace.visualstudio.com/items?itemName=konstantin.wrapSelection)

## How to use

1. Open the command palette (`Ctrl+Shift+P`) and select "Code Wrapper: Wrap Text".
2. Enter the text you want to wrap your code with.

Or yuo can also use the keyboard shortcut (`Alt+W W`).

The plugin also offers the special command for certain situations:

 command                                  | description     | keybinding            | keybinding (Mac)
:-----------------------------------------|:----------------|:---------------------:|:------------------------:
 `CodeWrapper.wrapTextWithSingleQuotes`   | single quotes   | `` Alt+W ' ``/`` ' `` | `` Option+W ' ``/`` ' ``
 `CodeWrapper.wrapTextWithDoubleQuotes`   | double quotes   | `` Alt+W " ``/`` " `` | `` Option+W " ``/`` " ``
 `CodeWrapper.wrapTextWithBackticks`      | backticks       | `` Alt+W ` ``/`` ` `` | `` Option+W ` ``/`` ` ``
 `CodeWrapper.wrapTextWithRoundBrackets`  | round brackets  | `` Alt+W ( ``/`` ( `` | `` Option+W ( ``/`` ( ``
 `CodeWrapper.wrapTextWithSquareBrackets` | square brackets | `` Alt+W [ ``/`` [ `` | `` Option+W [ ``/`` [ ``
 `CodeWrapper.wrapTextWithCurlyBrackets`  | curly brackets  | `` Alt+W { ``/`` { `` | `` Option+W { ``/`` { ``
 `CodeWrapper.wrapTextWithTag`            | HTML or XML tag | `` Alt+W T ``         | `` Option+W T ``

## Expectations

1. Add `CodeWrapper.wrapTextWithSnippet` command.
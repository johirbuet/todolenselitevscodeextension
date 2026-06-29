import * as vscode from 'vscode';

type TodoMatch = {
  line: number;
  text: string;
  type: string;
};

let statusBarItem: vscode.StatusBarItem;

const todoDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 215, 0, 0.25)',
  border: '1px solid rgba(255, 215, 0, 0.8)',
  borderRadius: '3px'
});

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  statusBarItem.text = 'TODOs: 0';
  statusBarItem.tooltip = 'Number of TODO/FIXME/HACK comments in current file';
  statusBarItem.show();

  const disposable = vscode.commands.registerCommand(
    'todolens-lite.scanTodos',
    () => {
      scanCurrentFile();
    }
  );

  vscode.window.onDidChangeActiveTextEditor(
    () => scanCurrentFile(),
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    () => scanCurrentFile(),
    null,
    context.subscriptions
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(statusBarItem);

  scanCurrentFile();
}

function scanCurrentFile(): void {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    statusBarItem.text = 'TODOs: 0';
    return;
  }

  const matches = findTodoComments(editor.document);

  statusBarItem.text = `TODOs: ${matches.length}`;
  highlightTodoLines(editor, matches);
}


function findTodoComments(document: vscode.TextDocument): TodoMatch[] {
  const matches: TodoMatch[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const text = line.text;

    const match = text.match(/\b(TODO|FIXME|HACK)\b[:\s-]*(.*)/i);

    if (match) {
      matches.push({
        line: i + 1,
        text: text.trim(),
        type: match[1].toUpperCase()
      });
    }
  }

  return matches;
}

function highlightTodoLines(
  editor: vscode.TextEditor,
  matches: TodoMatch[]
): void {
  const decorations = matches.map((match) => {
    const lineIndex = match.line - 1;
    const line = editor.document.lineAt(lineIndex);

    return {
      range: line.range,
      hoverMessage: `${match.type}: ${match.text}`
    };
  });

  editor.setDecorations(todoDecorationType, decorations);
}

export function deactivate() {}
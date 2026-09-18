import * as vscode from "vscode";

// ═══════════════════════════════════════════════════════════════
// Общая логика взаимодействия с редактором для всех команд палитры:
// "есть выделение — берём его, нет — спрашиваем через input box" и
// "заменить выделение результатом / вставить в курсор / открыть
// отдельный документ" — три паттерна, переиспользуемые между всеми
// src/tools/* (сами tools/* ничего не знают про vscode API, только
// эта прослойка).
// ═══════════════════════════════════════════════════════════════

export async function getInput(promptTitle: string, placeholder: string): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (editor && !editor.selection.isEmpty) {
    return editor.document.getText(editor.selection);
  }
  return vscode.window.showInputBox({ title: promptTitle, placeHolder: placeholder, ignoreFocusOut: true });
}

// Заменяет выделение результатом, если оно было — иначе вставляет
// результат в позицию курсора. Если активного редактора вообще нет
// (ввод пришёл через input box без открытого файла), просто копирует
// в буфer обмена — единственное, что можно сделать без редактора.
export async function replaceSelectionOrInsert(result: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.env.clipboard.writeText(result);
    void vscode.window.showInformationMessage("Wrench: result copied to clipboard (no active editor).");
    return;
  }
  await editor.edit((editBuilder) => {
    if (!editor.selection.isEmpty) {
      editBuilder.replace(editor.selection, result);
    } else {
      editBuilder.insert(editor.selection.active, result);
    }
  });
}

// Для результатов, которые не заменяют выделение "1 в 1" (декодированный
// JWT с двумя блоками, конвертация таймстампа с несколькими строками) —
// открывает отдельный необытийный документ рядом, ничего не трогая в
// исходном файле.
export async function openResultDocument(content: string, language = "plaintext"): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({ content, language });
  await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
}

export function showError(message: string): void {
  void vscode.window.showErrorMessage(`Wrench: ${message}`);
}

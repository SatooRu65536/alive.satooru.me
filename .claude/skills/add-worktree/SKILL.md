---
name: add-worktree
description: main worktree から新しい worktree に切り替える．
argument-hint: '[worktreeの対象（省略可，例: main）]'
---

このスキルは，現在の作業ブランチが main worktree の場合に，新しい worktree に切り替える．

# 手順

## 新しい worktree への切り替え

- 引数（`$ARGUMENTS`）が指定された場合，それを worktree の対象として優先すること
- 現在の作業ブランチが main worktree の場合，`git worktree add` コマンドで新しい worktree を作成し，その worktree に切り替えること
- 現在のブランチが main の場合，「main ブランチのため work tree を作成しませんでした」と伝えること

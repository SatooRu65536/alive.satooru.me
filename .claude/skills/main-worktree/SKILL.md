---
name: main-worktree
description: main worktree に切り替える．
argument-hint: '[worktreeの対象（省略可，例: main）]'
---

このスキルは，現在の作業ブランチが main worktree でない場合に，main worktree に切り替える．

# 手順

## main worktree への切り替え

- 引数（`$ARGUMENTS`）でブランチ名が指定された場合，それを main worktree で checkout する対象として優先すること
- 現在の作業ブランチが main worktree でない場合，`git worktree list` コマンドで main worktree のパスを取得し，`git worktree remove` コマンドで現在の作業ブランチの worktree を削除すること
- main worktree が main ブランチでない場合，ユーザーに「main worktree が main ブランチではありません」と伝え，切り替えて良いか確認すること
- まだコミットされてない変更がある場合は，コミットするか途中であれば stash すること
- main worktree で対象のブランチを checkout すること

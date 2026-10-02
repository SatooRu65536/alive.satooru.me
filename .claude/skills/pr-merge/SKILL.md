---
name: pr-merge
description: GitHub の Pull Request をマージするスキル．/pr-merge が入力されたときのみ使用すること．
argument-hint: '[PRの対象（省略可，例: main...HEAD）]'
---

@.claude/rules/coding-flow.md に則って，GitHub の Pull Request をマージするスキル．

# 手順

## PR の特定

- 引数（`$ARGUMENTS`）が指定された場合，それを PR の対象として優先すること
- 現在の作業ブランチが PR の対象である場合，そのブランチを PR の対象とすること
- PR が特定できない場合，「PR の対象が特定できません」とだけユーザーに伝え，以降の手順を行わないこと
- PR の対象が特定できた場合，「PR: {PR URL}」とだけユーザーに伝えること

## CI/CD の確認

- PR の対象に対して，GitHub Actions などの CI/CD が実行されている場合，その結果を確認すること
- CI/CD が失敗している場合，「CI/CD が失敗しています」とだけユーザーに伝え，以降の手順を行わないこと

## マージの実行

- `gh pr merge` コマンドを使用して，PR の対象をマージすること
- マージが成功した場合，「PR をマージしました」とだけユーザーに伝えること
- マージが失敗した場合，「PR のマージに失敗しました」とだけユーザーに伝えること

## issue のクローズ

- PR に関連する issue が存在する場合，その issue をクローズすること
- issue のクローズが成功した場合，「関連する issue をクローズしました」とだけユーザーに伝えること

## 後片付け

- PR のマージ後，作業ブランチを削除すること
- worktree が存在する場合，`git worktree remove` コマンドを使用して削除すること
- main worktree で作業している場合 main ブランチに切り替えること
- main ブランチに切り替えた後，`git pull` コマンドを使用してリモートの変更を取得すること

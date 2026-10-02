---
name: pr-create
description: GitHub の Pull Request を作成するスキル．/pr-create が入力されたときのみ使用すること．
argument-hint: '[issueの対象（省略可，例: main...HEAD）]'
---

@.claude/rules/coding-flow.md に則って，GitHub の Pull Request を作成するスキル．

# 手順

## issue の特定

- 引数（`$ARGUMENTS`）が指定された場合，それを issue の対象として優先すること
- 現在の作業ブランチが issue の対象である場合，そのブランチを issue の対象とすること
- issue が特定できない場合，「issue の対象が特定できません」とだけユーザーに伝え，以降の手順を行わないこと
- issue の対象が特定できた場合，「issue: {issue URL}」とだけユーザーに伝えること

## リモートブランチの確認

- まだリモートにブランチが存在しない場合，`git push -u origin HEAD` コマンドを使用して，現在の作業ブランチをリモートに発行すること

## Commit

- コミットされてない変更がある場合，`git commit` コマンドを使用して，コミットすること

## Push

- `git push` コマンドを使用して，現在の作業ブランチをリモートに push すること

## PR の作成

- `gh pr create` コマンドを使用して，issue の対象に対する PR を作成すること
- PR の作成が成功した場合，「PR を作成しました．{PR URL}」とだけユーザーに伝えること
- PR の作成が失敗した場合，「PR の作成に失敗しました」とだけユーザーに伝えること
- PR は @.github/PULL_REQUEST_TEMPLATE/pull_request_template.md に従って作成すること

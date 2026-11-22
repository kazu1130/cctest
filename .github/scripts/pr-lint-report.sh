#!/usr/bin/env bash
# Markdown Lint の結果を PR にコメント（上書き）し、ラベルを付け外しする。
#
# 必要な環境変数:
#   GH_TOKEN, REPO, RUN_ID, HEAD_SHA, LINT_CONCLUSION, EVENT_PR (空でも可)
#   REPORT_FILE   lint 結果ファイルのパス（artifact。信用しないデータとして扱う）
# 任意:
#   MARKER, LABEL, SERVER_URL, GITHUB_STEP_SUMMARY
set -euo pipefail

: "${REPO:?}" "${RUN_ID:?}" "${HEAD_SHA:?}" "${LINT_CONCLUSION:?}" "${REPORT_FILE:?}"
MARKER="${MARKER:-<!-- md-lint-report -->}"
LABEL="${LABEL:-docs: lint-failed}"
SERVER_URL="${SERVER_URL:-https://github.com}"
MAX_REPORT_BYTES=50000

# PR 番号は artifact ではなくイベント / API から取得する
resolve_pr_number() {
  local pr="${EVENT_PR:-}"
  if [ -z "$pr" ]; then
    # フォーク PR では workflow_run.pull_requests が空になるので head SHA から検索する
    pr=$(gh pr list --repo "$REPO" --state open --search "$HEAD_SHA" \
           --json number --jq '.[0].number // empty')
  fi
  [[ "$pr" =~ ^[0-9]+$ ]] && echo "$pr"
}

build_comment() {
  local errors short_sha run_url
  errors=$(grep -oE 'Summary: [0-9]+' "$REPORT_FILE" | grep -oE '[0-9]+' || echo "?")
  short_sha="${HEAD_SHA:0:7}"
  run_url="${SERVER_URL}/${REPO}/actions/runs/${RUN_ID}"

  echo "$MARKER"
  if [ "$LINT_CONCLUSION" = "success" ]; then
    echo "## ✅ Markdown Lint: 問題なし"
    echo
    echo "コミット \`${short_sha}\` の Markdown に指摘はありません。"
  else
    echo "## ❌ Markdown Lint: ${errors} 件の指摘"
    echo
    echo "コミット \`${short_sha}\` で以下の指摘がありました。"
    echo
    echo "<details open><summary>lint 結果</summary>"
    echo
    echo '```text'
    # 長さを制限し、コードブロックを壊す ``` を無害化する
    head -c "$MAX_REPORT_BYTES" "$REPORT_FILE" | sed 's/```/` ` `/g'
    echo '```'
    echo
    echo "</details>"
  fi
  echo
  echo "<sub>[ワークフロー実行ログ](${run_url}) · このコメントは自動で更新されます</sub>"
}

upsert_comment() {
  local pr="$1" body_file="$2" comment_id
  comment_id=$(gh api --paginate "repos/${REPO}/issues/${pr}/comments" \
    --jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | contains(\"${MARKER}\"))) | .id" \
    | head -n 1)

  if [ -n "$comment_id" ]; then
    echo "Updating comment ${comment_id} on PR #${pr}"
    gh api -X PATCH "repos/${REPO}/issues/comments/${comment_id}" -F body=@"$body_file" > /dev/null
  else
    echo "Creating comment on PR #${pr}"
    gh api -X POST "repos/${REPO}/issues/${pr}/comments" -F body=@"$body_file" > /dev/null
  fi
}

update_label() {
  local pr="$1"
  if [ "$LINT_CONCLUSION" = "success" ]; then
    gh pr edit "$pr" --repo "$REPO" --remove-label "$LABEL" || true
  else
    gh label create "$LABEL" --repo "$REPO" --color d73a4a \
      --description "Markdown lint に失敗している PR" --force
    gh pr edit "$pr" --repo "$REPO" --add-label "$LABEL"
  fi
}

main() {
  local pr body_file
  if ! pr=$(resolve_pr_number); then
    echo "::warning::PR が見つからないため、コメントとラベルをスキップします"
    exit 0
  fi

  body_file=$(mktemp)
  build_comment > "$body_file"

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    { echo "### Markdown Lint (${LINT_CONCLUSION}) - PR #${pr}"; cat "$body_file"; } >> "$GITHUB_STEP_SUMMARY"
  fi

  upsert_comment "$pr" "$body_file"
  update_label "$pr"
}

main "$@"

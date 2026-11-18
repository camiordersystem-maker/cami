# Rollback

## 1. Application rollback

Production applicationはCloudflare Worker versionとしてrollbackします。

release前に必ずcurrent active Production versionを保存し、Cloudflare/Wranglerの現在versionで正しいrollback方法を`--help`またはAPI仕様から確認します。

CLI commandを古いrunbookから決め打ちしません。

## 2. Application-only release

DB migrationを伴わないreleaseで障害が起きた場合:

1. 新Worker versionの影響を確認
2. 直前のknown-good Worker versionへrollback
3. `/api/health`
4. `/api/readiness`
5. `/login`
6. admin login / critical read-only screen
7. Cloudflare error確認

DB restoreは行いません。

## 3. Database rollback

Production DBへのdestructive automatic rollbackは構成しません。

DB変更を伴うreleaseでは事前に:

- Neon restore point / recovery method
- migration SQL
- forward-fix可能性
- app backward compatibility
- data migration影響

を確認します。

データ復元は操作者の明示承認なしに実行しません。

## 4. DNS / custom domain rollback

Application releaseとdomain cutoverは分離しています。

DNS/custom domainを変更する工程では、変更前record / Worker route / TLS / URL envを保存し、元のworkers.dev entrypointをfallbackとして維持できるか確認します。

## 5. LINE / email

LINE/email設定変更を伴う場合はapplication rollbackだけで戻らない可能性があります。provider設定変更は別途change logとrollback値を保管します。

## 6. Stop conditions

次の場合は問題を隠してrelease継続しません。

- wrong SHA
- login unavailable
- readiness persistent failure
- Production DB identity mismatch
- ProductionがSTAGING DB/configを参照
- order/inventory/invoice readで重大不整合
- persistent Worker exception / 5xx

## 7. Evidence

rollback時も成功releaseと同様にReviewPackを作成し、failed version、rollback target、検証結果、DB変更有無を記録します。

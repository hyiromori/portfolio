---
title: "Cloudflare 製の workerd を動かしてみる"
emoji: "🏃🏻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["JavaScript","Cloudflare"]
published: true
---

# はじめに

Publickey で以下の記事を見つけて、どんなものか動かしてみた記録です。

https://www.publickey1.jp/blog/22/cloudflare_workersjavascriptwasmworkerdnanoserviceshomogeneous_deployment.html

詳しい解説は上記の記事を見てもらえればと思いますが、私が特に魅力を感じたのは以下の点でした、

> 標準準拠でロックインはされない
> 
> workerdはサーバ向けのJavaScript/WebAssemblyのランタイムですが、基本的にはWebブラウザが備えているAPIを実装しています。
> 
> と同時にDenoやNode.jsなどと共に今年立ち上げた非Webブラウザ系JavaScriptランタイムのコード互換を実現するワークグループの標準に従うとしており、コードのworkerdへのロックインは起こらないとしています。


## おことわり

`workerd` は現時点で Beta 版です。
機能が不足していたり、破壊的変更が行われる可能性がありますので、ご注意ください。

![workerd is Beta](https://mryhryki.com/file/UVgBp1i_ULFY9gWQ6IB5Tl1d8o8aIKK2Zg8g4bNTZ0ebwgAk.png)

[WARNING: This is a beta. Work in progress.](https://github.com/cloudflare/workerd/blob/a2376c452624b5a68b467465d17b81314ebf9452/README.md#warning-this-is-a-beta-work-in-progress)

この記事の動作確認では、コミットハッシュ [a2376c4](https://github.com/cloudflare/workerd/commit/a2376c452624b5a68b467465d17b81314ebf9452) を使用しています。


# workerd を動かす

[README の Getting Started](https://github.com/cloudflare/workerd/blob/a2376c452624b5a68b467465d17b81314ebf9452/README.md#getting-started) に従って

## 1. リポジトリをクローン

まずはリポジトリをクローンします。

```shell
$ git clone git@github.com:cloudflare/workerd.git
$ cd ./workerd/
```

## 2. Bazel (Bazelisk) のインストール

ビルドには Bazel というツールが必要になるようです。
README のリンクを開くと [Bazelisk](https://bazel.build/install/bazelisk) というツールをおすすめされていたので、そちらをインストールします。

macOS を使っているので [Homebrew](https://brew.sh/) で簡単にインストールできました。

```shell
$ brew install bazelisk
```

## 3. Xcode のバージョン確認

README を見ると、macOS の場合は `Xcode 13` 以降がインストールされている必要があるようです。
私の場合は `14.0.1` が入っていたので、バージョンだけ確認して終わりました。

## 4. workerd のビルド

`bazelisk` を使って `workerd` をビルドします。

```shell
$ bazelisk build -c opt //src/workerd/server:workerd

...

INFO: Elapsed time: 2512.784s, Critical Path: 53.88s
INFO: 8341 processes: 3309 internal, 5031 darwin-sandbox, 1 local.
INFO: Build completed successfully, 8341 total actions
```

大体42分ぐらいかかっています。長い。

### 補足

README では `bazel` コマンドを使うように書かれていますが、今回は `bazelisk` をインストールしたので、コマンドを置き換えています。

```diff
- $ bazel build ...
+ $ bazelisk build ...
```

## 5. パスを通す

ビルドした `workerd` のバイナリは `(Repository root)/bazel-bin/src/workerd/server/workerd` に出力されています。
このバイナリをパスの通ったところに移動 (or コピー) すればOKです。

（が、今回は一時的に試してみたかったので、一旦以下のようにパスを通しました）

```shell
$ export PATH="$(pwd)/bazel-bin/src/workerd/server/:${PATH}"
```

以上で、準備は完了です。

# 動かしてみる

リポジトリの `/samples` ディレクトリにサンプルが4つ用意されていたので動かしてみます。

## Hello world

`helloworld` と `helloworld_esm` の２種類が用意されていますが、書き方の違いだけで動作的には同じでした。
以下のコマンドで実行できます。

```shell
$ workerd serve ./samples/helloworld/config.capnp
# or
$ workerd serve ./samples/helloworld_esm/config.capnp
```

http://localhost:8080/ にアクセスすると動作確認できます。

```shell
$ curl http://localhost:8080/
Hello World
```

## 静的ファイル配信

`static-files-from-disk` というディレクトリは静的なファイル配信のサンプルのようです。
以下のコマンドで実行できます。

```shell
$ cd samples/static-files-from-disk/
$ workerd serve ./config.capnp
```

http://localhost:8080/ にアクセスすると動作確認できます。

![Result](https://mryhryki.com/file/UVfhxaFu6o7mKr8mVwsymFfF-C4-6gdpxkImj3INcYk697SY.png)

ちなみに `--directory-path site-files="(ディレクトリパス)"` を指定すると配信したいディレクトリを変更できるようです。

```shell
$ workerd serve samples/static-files-from-disk/config.capnp --directory-path site-files="$(pwd)/samples/static-files-from-disk/content-dir/"
```

[設定ファイルのコメント](https://github.com/cloudflare/workerd/blob/46119264c20bc3da7db2ce5cefa983e5d564c7b6/samples/static-files-from-disk/config.capnp#L6) に書いてありました。

## チャット

`durable-objects-chat` というディレクトリは、チャットができるサンプルのようです。
以下のコマンドで実行できます。

```shell
$ workerd serve ./samples/durable-objects-chat/config.capnp
```

http://localhost:8080/ にアクセスすると動作確認できます。

![Chat capture](https://mryhryki.com/file/UVfLHzf68e8B8oujs0VACdWxdSeQ6zhEB9DvTyIZ5pr1Gkdc.png)

ディレクトリ名に入っているように [Durable Objects](https://blog.cloudflare.com/ja-jp/durable-objects-ga-ja-jp/) という機能を使っているようです。
今回はじめて聞いたのでよく分かっていませんが、任意の状態を保存しておく機能のようです。

上記のチャットのキャプチャでも、一度退室した後に戻ってくるとこれまでの履歴が出ているのも、多分その機能なのかな、と思っています。
また、ローカルで動かした場合はどこに保存されているのかもよく分かっていません。
詳しく知らないので、ただの推測です。分かる方いれば、コメントいただけると嬉しいです。

# 考察

## hello world の中身

`addEventListener('fetch', ...)` と書かれているように、(`fetch`) イベントに対してハンドラを登録するという形で実装するようです。
Service Worker の書き方と同じ感じなので、馴染みやすいですね。

```javascript
// samples/helloworld/worker.js
addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  return new Response("Hello World\n");
}
```

また esm の方だと `fetch` を含むオブジェクトを `export default` しているようです。

```javascript
export default {
  async fetch(req, env) {
    return new Response("Hello World\n");
  }
};
```

# おわりに



# ジェネレーティブ NFT コレクションのテンプレート

このプログラムでは、ジェネレーティブ NFT コレクションに必要なツールが全て入っています。

・コントラクト
・mint ページおよびコントラクトと繋ぎこみするフロントエンド
・ジェネレーティブ NFT の画像生成ツール

# 特徴

・MerkleTree 対応
・コントラクトのテストケースが一通りあり
・コントラクトテストのカバレッジ対応（予定）
・CSV データを基にした柔軟な画像生成
・フロントエンドの画面データもあり。

# QuickStart

## Install

`npm install`
WorkSpace の設定があるため、ルートディレクトリで npm install の設定をすると全ての設定が一括インストールできます

## コントラクトの設定

### env ファイルの設定

コントラクトをデプロイするために必要な情報を env ファイルに書き込んでいきます。
.env.example ファイルをコピーして .env ファイルを作成して、そこの設定を書き換えてください。

`cp ~/NFTBoil/contract/.env.example ~/NFTBoil/contract/.env`

ACCOUNT_PRIVATE_KEY は、コントラクトデプロイするオペレーターのウォレットの秘密鍵です。絶対に外部に漏洩しないでください。
また、RINKEBY_RPC, MAINNET_RPC は、カスタム RPC を infula や alchemy から取得してください。
もし Ethereum 以外のプロジェクトであれば、こちらの変数は削除してかまいません。
CONTRACT_NAME, CONTRACT_SYMBOL, IPFS_JSON は自分のプロジェクトのものに変えてください。

### コントラクトのテスト

まず、ローカルにてノードを立ち上げて、コントラクトが正しく動くかを確かめてください。

`cd ~/NFTBoil/contract/`
`npx hardhat node`

もし、install の時に typechain の設定が必要であれば、下記コマンドで出来ます。
`npx hardhat typechain`

ローカルにノードを立ち上げたら、テストコードの実施をしてください。

`npx hardhat test`

テストがすべて通れば成功です。
また、プロジェクトにおいてコードを書き換えた場合は、テストコードの修正も行ったほうが良いでしょう。

### コントラクトのデプロイ

Ethereum チェーンでデプロイする前提であれば、まずはテストネットの Rinkeby Network にデプロイをします。
（他のチェーンにデプロイするときは適宜 hardhat.config.ts に network を追加してください。）
また、テストネットにアップロードする前に、事前に faucet から ETH をゲットしてください。

その後、下記コマンドでテストネットにデプロイします。

`npx hardhat run scripts/deploy.ts --network rinkeby`
デプロイした後は etherscan でデプロイしたコントラクトを確認してください。

### コントラクトの verify

信頼性担保のため、コントラクトは必ず verify しましょう。
コントラクトの verify は etherscan から行います。
また、コントラクトを verify するためには、Flat 化したソースコードが必要です。こちらのコマンドで flat 化できます。

`npm run flatten`

out/ ファイルにて生成されるコードを、etherscan の verify にて利用してください。

### mainnet へのデプロイ

mainnet へデプロイするときは下記のコマンドでできます。
Ethereum の場合、ガス代が大きくかかるのでご注意ください。
`npx hardhat run scripts/deploy.ts --network mainnet`

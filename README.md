# Node.jsでTwitter botを作る(枠組み)
## はじめに
このmarkdownでは、Twitter botを動かすためのツールとして、Node.jsを使用します。なぜなら、
- Javascriptで実装できる。
- Streamが簡単
- JSONが扱いやすい

からです。
また、PHPで作ることも打診されたのですが、

- Streamがtwitteroatuhでは非対応
- そうなると、定期的にcronとかでつつくしかない

など、制約が大きかったので、Node.jsを利用しております。この雛形を使えば、基本的な機能については問題ないでしょう。
## 環境構築
### Node.jsそのものの導入
Cloud9のアカウントを持っているのであれば、環境構築はいらないです。それ以外の場合は、自分のマシンにNode.jsの実行環境を整えておく必要があります。[こちら](https://nodejs.org/en/download/)でダウンロード可能です。あとはインストーラーに従ってください。
### twitの導入
次に、Node.jsでbotを作成するには、Node.js用のツイッターライブラリーtwitをインストールしておくと便利です。
```
npm install twit
```
でインストールできます。

## app.js
ここでは、サーバーの実行、keyやtokenでの認証を行います。このコード自体は極力弄らない方がいいです。

ざっとその内容をまとめておくと、
```
var express = require('express');
var app = express();
```
ページそのものをExpressというライブラリを利用してます。ただ、アプリそのものを動かすのにはそれほど必要ないので、あまり深く
考えなくて大丈夫です。
```
var options = {
  key: process.env.TWIBOT_TWITTER_KEY,
  secret: process.env.TWIBOT_TWITTER_SECRET,
  token: process.env.TWIBOT_TWITTER_TOKEN,
  token_secret: process.env.TWIBOT_TWITTER_TOKEN_SECRET
};
```
ここで、keyやtokenを入れます。ただ、ここに直接書いても構いませんが、
.shのshellで実行することを開発段階ではお勧めします。そして、そのshell script内にkeyやtokenを書いておくといいでしょう。
それ以外は、portを開くコードだったりするので、特に気にする必要はありません。
## index.js
このコードでメインの処理を行います。
### 設定
まず、app.jsでの設定をインポートする必要があります。そのため、
```
//必要なライブラリをインポート
var app = require('../app')
var Twit = require('twit')
```
で、app.jsとtwitをインポートします。

次に、アカウントの認証情報をtwitに読み込むのですが、
以下のように、
```
//ここで、twitterのアカウント認証情報を入力(別ファイルから取得)
var options = app.get('options')
var twitter = new Twit( {
  consumer_key: options.key,
  consumer_secret: options.secret,
  access_token: options.token,
  access_token_secret: options.token_secret
})
```
としておけば大丈夫です。
### ツイートする
#### 起動時にツイートする
実際にツイートができるかを確認するには、次のように起動時にのみツイートするだけのコードを書いてやるといいでしょう。
```
twitter.post('status/update',{
    status: "ここにツイートしたい内容を書く!"
    },
    /*エラー処理用の関数*/
    function(err,response){
        //ここでエラー処理をしておこう!
        if (err){
            console.log('Error!');
            console.log(err);
        }
    }
)
```
これがデフォルトの形式です。エラー処理はなくてもいいかもしれないですが、エラーを見るのはもちろんのこと、
twitterのルールとして、15分以内に同じテキストをツイートできず、"status duplicated"とか出ちゃうので、
それを確かめる上でも必要です。

このシステム内では、
```
//起動時にメッセージを送信
twitter.post('statuses/update', {
  status: list_of_nihongo[Math.floor(Math.random() * list_of_nihongo.length)].data
  },
  function(err, data, response) {
    if (err){
      console.log('Error!');
      console.log(err);
    }
    else{
      console.log(data);
    }
  }
);
```
と記述しました。
#### 定期的にツイートする
この方法がとてもスタンダードだと思います。そのためには、setIntervalk()関数を用いるのがいいでしょう。
```
//定期的にツイートを行う
setInterval(function() {
  twitter.post('statuses/update', {
        status: "”ここにテキスト"
      },
      /*エラー処理*/
      function(err, data, response) {
        if (err){
          console.log('Error!');
          console.log(err);
        }
        else{
          console.log(data);
        }
      });
}, 1000*60*60);
```
というのがデフォルトです。

このプログラムでは
```
//定期的にツイートを行う
setInterval(function() {
  twitter.post('statuses/update', {
        status: list_of_nihongo[Math.floor(Math.random() * list_of_nihongo.length)].data
      },
      function(err, data, response) {
        if (err){
          console.log('Error!');
          console.log(err);
        }
        else{
          console.log(data);
        }
      });
  console.log("hoge");
}, 1000*60*60);
```

とし、一番下に書いてます。

### リプライする
これには大きく分けて、2ステップ存在します。まず最初に、リプライが来た際に、そのイベントを受け取るためのストリームをonにする。
そして、リプライした人に対して、リプライする。
そのため、この部分が一番面倒かもしれないです。
#### ストリーム
リプライにリプライするには、自分のリプライにのみ反応しないと困ります。そのため、自分のアカウントのみを追跡するように
以下のコードを書いてください。これは、リプライ用のストリームです。
```
var public_stream = twitter.stream('statuses/filter', 
  {
    track: '@自分のアカウント名'
  }
);
```
#### リプライを受け取る+リプライ
リプライを受け取った直後にリプライを返すように書いてしまいましょう。
ここでは、ストリームを使って、受け取った直後に引数内の関数で
リプライしています。
```
//ツイートを受け取る
public_stream.on('tweet', 
  function (tweet) {
    console.log(tweet.text);
    var tweet_response = '';//ここに返信用のデータを記述
    /*もし、リプライだったら*/
    if(tweet.in_reply_to_status_id){
      var ans = list_of_nihongo[Math.floor(Math.random() * list_of_nihongo.length)];
      /*ユーザーのアカウント名はtweet.user.screen_nameで取得可能*/
      tweet_response = '@' + tweet.user.screen_name + " " + "ここにテキスト";
    }
    /*リプライじゃなかったら*/
    else{
      console.log('New mention!');
      console.log(tweet.text);
    }
    /*レスポンスが1文字以上ちゃんとあるなら返信*/
    if (tweet_response.length > 0){
      twitter.post('statuses/update', 
        {
          in_reply_to_status_id: tweet.id_str,
          status: tweet_response
        },
        /*エラー処理*/
        function(err, data, response) {
          if (err){
            console.log('Error!');
            console.log(err);
          }
        }
      );
    }
  }
);
```
### DM
これに関してはとても単純です。ただ、そのために、別にストリームを
作りました。
```
// イベント受信用のstream取得
var stream = twitter.stream('user')
```
そして、以下のコードをかけば大丈夫です。
```
// ダイレクトメッセージハンドリング
stream.on('direct_message', function(data) {
  var message = data.direct_message

  // 自分が送信したダイレクトメッセージは処理わしない
  if (message.sender_id_str === options.id) return
  var reply = { user_id: message.sender_id_str, text: "ここにメッセージを入力"}
  console.log(message.text)
  //メッセージ送信
  twitter.post('direct_messages/new', reply, function(err, data, resp) {})
})
```
なんとこれだけでdmが送れてしまいます。
## 最後に
これだけでは、dmのgetがないので、その部分も順次書いていく次第です。
また、このコードは[こちら](https://github.com/daikikojima/Node_bot)
にあります。
## 参考にしたサイト
主にこれらがメインです。

[http://qiita.com/nakahashi/items/9566f9cd31e0160aeac2](http://qiita.com/nakahashi/items/9566f9cd31e0160aeac2)
[https://www.botwiki.org/tutorials/making-what_capital/](https://www.botwiki.org/tutorials/making-what_capital/)

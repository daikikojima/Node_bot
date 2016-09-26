//必要なライブラリをインポート
var app = require('../app')
var Twit = require('twit')


//ここで、twitterのアカウント認証情報を入力(別ファイルから取得)
var options = app.get('options')
var twitter = new Twit( {
  consumer_key: options.key,
  consumer_secret: options.secret,
  access_token: options.token,
  access_token_secret: options.token_secret
})

// イベント受信用のstream取得
var stream = twitter.stream('user')

// フォローイベントのハンドリング
stream.on('follow', function(data) {
  var param = { user_id: data.source.id_str }

  // 自分発のフォローは処理しない
  if (data.source.id_str === options.id) return

  // フォローされた相手をフォローする
  twitter.post('friendships/create', param, function(err, data, resp){})
})
// ダイレクトメッセージハンドリング
stream.on('direct_message', function(data) {
  var message = data.direct_message

  // 自分が送信したダイレクトメッセージは処理わしない
  if (message.sender_id_str === options.id) return

  // ここでは、適当に作ってあるファイルから適当なものを抽出
  var anste = list_of_nihongo[Math.floor(Math.random() * list_of_nihongo.length)].data;
  var reply = { user_id: message.sender_id_str, text: anste}
  console.log(message.text)
  //メッセージ送信
  twitter.post('direct_messages/new', reply, function(err, data, resp) {})
})
//日本語の定型文ファイルをロード
var fs = require('fs'),
    path = require('path'),
    list_of_nihongo = require(path.join(__dirname, 'list_of_nihongo.js'));
//自分のツイートに対して、追いかけない    
var public_stream = twitter.stream('statuses/filter', 
  {
    track: '@Kusobottest'
  }
);
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

//ツイートを受け取る
public_stream.on('tweet', 
  function (tweet) {
    console.log('Received new answer!');
    console.log(tweet.text);
    var tweet_response = '';
    if(tweet.in_reply_to_status_id){
      var ans = list_of_nihongo[Math.floor(Math.random() * list_of_nihongo.length)];
      tweet_response = '@' + tweet.user.screen_name + " " + ans.data;
    }
    else{
      console.log('New mention!');
      console.log(tweet.text);
    }
    if (tweet_response.length > 0){
      twitter.post('statuses/update', 
        {
          in_reply_to_status_id: tweet.id_str,
          status: tweet_response
        },
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

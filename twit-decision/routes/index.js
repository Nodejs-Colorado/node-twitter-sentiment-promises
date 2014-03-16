var path = require("path"),
    twit = require('twit'),
    sentimental = require('Sentimental'),
    config = require("../config"),
    Q = require('q'),
    util = require('util');

// establish the twitter config (grab your keys at dev.twitter.com)
var twitter = new twit({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token: config.access_token,
  access_token_secret: config.access_token_secret
});

/*
* Helper Functions
*/

var performAnalysis = function (tweetSet) {
  //set a results variable
  var results = 0;
  // iterate through the tweets, pulling the text, retweet count, and favorite count
  for(var i = 0; i < tweetSet.length; i++) {
    tweet = tweetSet[i]['text'];
    retweets = tweetSet[i]['retweet_count'];
    favorites = tweetSet[i]['favorite_count'];
    // remove the hashtag from the tweet text
    tweet = tweet.replace('#', '');
    // perfrom sentiment on the text
    var score = sentimental.analyze(tweet)['score'];
    // calculate score
    results += score;
    if(score > 0){
      if(retweets > 0) {
        results += (Math.log(retweets)/Math.log(2));
      }
      if(favorites > 0) {
        results += (Math.log(favorites)/Math.log(2));
      }
    }
    else if(score < 0){
      if(retweets > 0) {
        results -= (Math.log(retweets)/Math.log(2));
      }
      if(favorites > 0) {
        results -= (Math.log(favorites)/Math.log(2));
      }
    }
    else {
      results += 0;
    }
  }
  // return score
  results = results / tweetSet.length;
  return results;
};

// Searches the tweets, scores them, and returns a promise of that data
var searchTweets = function(choice) {
  var deferred = Q.defer(),
      today = new Date(),
      dateString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate(),
      choiceData = {},
      score = 0;

  twitter.get('search/tweets',
  {
    q: '' + choice + ' since:' + dateString,
    count: 20
  }, function(err, data) {
      if (err) {
        deferred.reject(new Error(err));
      } else {
        // perfrom sentiment analysis (see below)
        score = performAnalysis(data['statuses']);
        console.log("score:", score);
        console.log("choice:", choice);
        
        choiceData['choice'] = choice;
        choiceData['score'] = score;
        deferred.resolve(choiceData);
      }
      console.log("");
    });
  return deferred.promise;
};

// Compares the scores of the two choices and returns the highest score
var scoreCompare = function(choices){
  var highestScore = -Infinity,
      highestChoice = null,
      result = {};

  choices.forEach(function(choice) {
    if(choice['score'] > highestScore) {
      highestScore = choice['score'];
      highestChoice = choice['choice'];
      console.log("winner:", highestChoice);
      result = {
        choice : highestChoice,
        score : highestScore
      };
    }
  });
  return result;
};

/*
* Export Routing Functions
*/

exports.index = function(req, res) {
  res.render('index', { title: "Twit-Decision" });
};

exports.ping = function(req, res) {
  res.send("pong!", 200);
};

exports.search = function(req, res) {
  var choices = JSON.parse(req.body.choices),
      choiceArray = [];

  console.log("----------");

  var promise = function(choices) {
    var deferred = Q.defer();
    choices.forEach(function(choice, index) {
      searchTweets(choice)
        .fail(function(error) {
          throw new Error(error);
        })
        .done(function(data) {
          choiceArray.push(data);
          if (choiceArray.length === choices.length) {
            deferred.resolve(choiceArray);
          }
        });
    });
    return deferred.promise;
  };

  promise(choices).then(function(data) {
      return scoreCompare(data);
    }).done(function(result) {
      console.log('final_result', result);
      res.send(result);
    });

};


## Node Twitter Sentiment Analysis - Promises

Blog post - [http://mherman.org/blog/2014/02/19/node-twitter-sentiment/](http://mherman.org/blog/2014/02/19/node-twitter-sentiment/)

![twit-decision](https://raw.github.com/mjhea0/node-twitter-sentiment/master/twit-decision.png)

# [Promises](https://github.com/mjhea0/node-twitter-sentiment-promises)

### Intro
Promises are not the easiest JavaScript concept to wrap your head around, so do not feel bad if this concept takes time to understand.  It certainly has taken a lot of time for myself, and I still get caught up and confused in using some of the methods.  In this example, I tried to just use a simple (and hopefully easy to understand) pattern of deferreds using the Q promise library.  You may also have experience with jQuery deferreds via the `$.Deferred` object.  They are very similar.

### What are promises (from the Q [documentation](https://github.com/kriskowal/q))

> If a function cannot return a value or throw an exception without blocking, it can return a promise instead. A promise is an object that represents the return value or the thrown exception that the function may eventually provide. A promise can also be used as a proxy for a remote object to overcome latency.

### Here are some great resources for learning more about promises
1. [Promises A+ Spec](http://promises-aplus.github.io/promises-spec/)
1. [Q Library](http://documentup.com/kriskowal/q/)
1. [Promisesjs.org - Great introduction](http://www.promisejs.org/)
1. [Promises by Nodeschool.io](http://nodeschool.io/#promiseitwonthurt)
1. [Javascript Promises in Wicked Detail](http://mattgreer.org/articles/promises-in-wicked-detail/?utm_source=javascriptweekly&utm_medium=email)
1. [Promises in Node.js](http://strongloop.com/strongblog/promises-in-node-js-with-q-an-alternative-to-callbacks/)
1. [Using Promises with Q](https://github.com/bellbind/using-promise-q/)
1. [Using jQuery Deferreds - Book from O'Reilly](http://shop.oreilly.com/product/0636920030508.do)

### Pattern used
Here the deferred pattern was used, which goes something like this:

```javascript
var promise = function(err, result) {
	var deferred = Q.defer();
	if (err) {
		deferred.reject(new Error(err));
	} else {
		deferred.resolve(result);
	}
	return deferred.promise;
}
```

You then go on to using the `then` and `done` methods:

```javascript
promise.then(function(data) {
	return doSomething(data);
}).done(function(data) {
	return finishSomething(data);
});
```

### How they were implemented
```javascript
var searchTweets = function(choice) {
  var deferred = Q.defer(), // declare the deferred
     ...

  twitter.get('search/tweets',
  {
    q: '' + choice + ' since:' + dateString,
    count: 20
  }, function(err, data) {
      if (err) {
        deferred.reject(new Error(err)); //reject it in the callback
      } else {
        ...
        choiceData['choice'] = choice;
        choiceData['score'] = score;
        deferred.resolve(choiceData); //resolve it in the callback
      }
      console.log("");
    });
  return deferred.promise; //return the promise object
};
```

The search function.  Note the promise chain:

```javascript
exports.search = function(req, res) {
  var choices = JSON.parse(req.body.choices),
      choiceArray = [];

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
```

Have Fun!

console.log("lol")


var fs = require('fs');
var fetchVideoInfo = require('youtube-info');
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey('AIzaSyAQpa6n3ApT5oVDlibNynBsM7Bfln7NUU4');
 


var LIMIT = 20;
var RELATED_START = 5;
var RELATED_COUNT = 5;
var count = 0;

var mixes = {};
var tracks = {};
var titles = {};

var prefix = "https://www.youtube.com/watch?v=";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function recurse(id) {
  console.log("Recurse: ", id);
  if (count >= LIMIT) {
    sleep(10000).then(() => {
      results();
    })
    return;
  }

  mixes[prefix + id] = true;

  fetchVideoInfo(id).then(function (videoInfo) {
    var description = videoInfo.description;
    var titles = getSubSongs(description);

    console.log("Titles: ", titles)

    findRelated(id).then(function (data) {
      for (var i = RELATED_START; i < data.length; i++) {
        var related = data[i].id.videoId;
        count++;

        if (count <= LIMIT)
          recurse(related);
      }
    })

    console.log("ID", id)

    for (var i = 0; i < titles.length; i++) {
      var title = cleanTitle(titles[i]);

      if (titles[title])
        continue;
      else
        titles[title] = true;

      youtubeSearch(title).then((data) => {
        if (data == null || data.id == null) {
          return;
        } 

        var source = id;
        var vidId = data.id;
        var title = data.title;

        console.log("Result: ", vidId);
        tracks[prefix + vidId] = {
          source: source,
          title: title
        };
      })
    }
  });
}

recurse('uAPhMJb-LIU');

function results() {
  console.log("======== DONE ========")

  var mixesKeys = Object.keys(mixes);
  var tracksKeys = Object.keys(tracks);
  var output = "";

  for (var i = 0; i < tracksKeys.length; i++) {
    var track = tracksKeys[i];



    var line = "<a href=\"" + track + "\">" + tracks[track].title + "</a> FROM <a href=\"" + prefix + tracks[track].source + "\">"+prefix + tracks[track].source+"</a></br>";
    output += line;
    console.log(line);
  }

  for (var i = 0; i < mixesKeys.length; i++) {
    var mix = mixesKeys[i];

    var line = "<a href=\"" + mix + "\">" + "MIX: " + mixes[mix] + "</a></br>";
    output += line;
    console.log(line);
  }

  fs.writeFile("vid.html", output, function(err) {
    if(err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  }); 
}

function cleanTitle(title) {
  return title.replace(/&.*;/, '');
}

// youtubeSearch("Kaoru Wada - Sangoaposs Theme by MusicMike512");
// youtubeSearch("Kaoru Wada - Sango&apos;s Theme by MusicMike512");

function getDescription(id) {
  return new Promise((resolve, reject) => {
    fetchVideoInfo('id', function (err, videoInfo) {
      if (err) 
        throw new Error(err);

      console.log(videoInfo.description);
      resolve(videoInfo.description)
    });
  });
}


function findRelated(id) {
  return new Promise((resolve, reject) => {
    youTube.related(id, RELATED_COUNT + RELATED_START, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        var related = data.items;
        // console.log(related);
        resolve(related);
      }
    });
  })
}

function youtubeSearch(title) {
  return new Promise((resolve, reject) => {
    youTube.search(title, 1, function(err, data) {
      if (err) {
        console.log("ERR", err, "DATA", data)
        return null;
      }

      var items = data.items;
      var item = items[0];

      if (items.length == 0) {
        console.log("Youtube search for " + title + " returned no results.")
        return null;
      }

      console.log("DEBUG", item.snippet.title)

      // resolve(item.id.videoId);
      resolve({
        id: item.id.videoId,
        title: item.snippet.title
      })
    });
  })
}


function getSubSongs(data) {
  var split1 = ");return false;\">"
  var split2 = "</a>"
  var split3 = "<br>"

  var titles = [];

  while (true) {
    var index1 = data.indexOf(split1);
    var sub = data.substring(index1+split1.length)
    var index2 = sub.indexOf(split2);
    var index3 = sub.indexOf(split3);

    var str = sub.substring(index2+split2.length, index3)
    var clean = str.replace(/\r\n/g,"");

    if (sub.length < 1 || index1 == -1 || index2 == -1 || index3 == -1) {
      break;
    }

    titles.push(clean);

    data = sub.substring(index3+split3.length);
  }

  return titles;
}
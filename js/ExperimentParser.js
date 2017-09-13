var ExperimentParser = (function() {
  var module = {};

  function getRandomPhrase(sourceText) {
    var sentence = getRandomSentence(sourceText).split(" ");
    var randomStartIndex = Math.floor(Math.random() * (sentence.length - 2));
    var minimalEndIndex = randomStartIndex + 2;
    var randomEndIndex =  minimalEndIndex + Math.floor(Math.random() * (sentence.length - minimalEndIndex));
    return sentence.slice(randomStartIndex, randomEndIndex).join(" ").replace(/(\r\n|\n|\r)/gm, "");
  }

  function getRandomSentence(sourceText) {
    var sentences = sourceText.match(/[^\.!\?]+[\.!\?]+/g);
    var randomIndex = Math.floor(Math.random() * sentences.length);
    return sentences[randomIndex].trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  function getRandomParagraph(sourceText) {
    var paragraphs = sourceText.match(/[^\r\n]+/g);
    var randomIndex = Math.floor(Math.random() * paragraphs.length);
    return paragraphs[randomIndex].trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  function getStimuli(textSource, granularity, articles) {
    var stimuli = "";
    var articleIndex = Math.floor(Math.random() * Object.keys(articles).length);
    var articleTitle = Object.keys(articles)[articleIndex];
    var articleContent = articles[articleTitle];
    switch (granularity) {
      case "phrase":
        stimuli = getRandomPhrase(articleContent);
        break;
      case "sentence":
        stimuli = getRandomSentence(articleContent);
        break;
      case "paragraph":
        stimuli = getRandomParagraph(articleContent);
        break;
      default:
        break;
    }
    return stimuli;
  }

  function getTrial(technique, granularity, corpus, textSource, stimuli) {
    return {
      "technique": technique,
      "granularity": granularity,
      "corpus": corpus,
      "data_file": textSource,
      "stimuli": stimuli
    };
  }

  module.getExperiments = function(pid, configurations, articlesObj) {
    var experimentTrials = [];
    var blocks = configurations.blocks;
    var trials = configurations.trials;
    var pIndex = pid.substring(1);
    if (pIndex > 0) {
      pIndex -= 1;
      pIndex %= configurations.conditions.length;
    } else {
      pIndex = 0;
    }
    var pConditions = configurations.conditions[pIndex];
    for (var techniqueIndex in pConditions.techniques) {
      var technique = pConditions.techniques[techniqueIndex];
      for (var block = 1; block <= blocks; block++) {
        for (var granularityIndex in pConditions.granularities) {
          var granularity = pConditions.granularities[granularityIndex];
          for (var corpusIndex in pConditions.corpora) {
            var corpus = pConditions.corpora[corpusIndex];
            var textSource = articlesObj[corpus].source;
            var corpusArticles = articlesObj[corpus].articles;
            for (var trial = 1; trial <= trials; trial++) {
              var stimuli = getStimuli(textSource, granularity, corpusArticles);
              var trialConditions = getTrial(technique, granularity, corpus, textSource, stimuli);
              experimentTrials.push(trialConditions);
            }
          }
        }
      }
    }
    console.log(experimentTrials);
    return experimentTrials;
  }

  return module;
})();

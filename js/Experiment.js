var trialConditions;
var currentTrial;
var totalNumOfTrials;
var pid;
var timer;
var startTime;
var endTime;

var trialData = [];
var requests = [];
var simpleArticles = {};
var complexArticles = {};
var preTrialCompleted = false;
var numOfIntervals = 4;
var clickCount = 0;
var keyCount = 0;

var experimentsFile = 'data/experiments.json';
var simpleArticlesFile = 'data/simple_texts.json';
var complexArticlesFile = 'data/complex_texts.json';

var headers = [
  'Participant id',
  'Technique',
  'Granularity',
  'Vocabulary size',
  'Trial no',
  'Stimuli',
  'User Response',
  'Trial Start Time',
  'Trial End Time',
  'Trial Time',
  'Accuracy',
  'Click Count',
  'Keystroke Count'
];

// Check if is interval break time
function isBreakTime(trialIndex, numOfTrials, numOfIntervals) {
  return trialIndex > 0 && trialIndex % Math.floor(numOfTrials / numOfIntervals) === 0;
}

// Setup and display trial session
function initiateTrial() {
  currentTrial += 1;
  ACPToolKit.presentTrial(trialConditions[currentTrial]);
  $('.js-expt-current-trial').text(currentTrial);
  $('.js-expt-action-button').text("Next Task");
  clickCount = 0;
  keyCount = 0;
}

// Cleanup outgoing trial and setup next trial
function next() {
  // Save results if outgoing is actual trial
  if (currentTrial > 0) {
    var trialResult = ACPToolKit.getCurrentTrialState();
    var technique = trialResult.technique;
    var granularity = trialResult.granularity;
    var corpus = trialResult.corpus;
    var trialNum = currentTrial;
    var stimuli = trialResult.stimuli;
    var userResponse = trialResult.user_response;
    var trialStartTime = trialResult.start_time;
    var trialEndTime = trialResult.end_time;
    var trialDuration = trialResult.duration;
    var accuracy = stimuli === userResponse ? 1 : 0;
    var row = [
      pid,
      technique,
      granularity,
      corpus,
      trialNum,
      stimuli,
      userResponse,
      trialStartTime,
      trialEndTime,
      trialDuration,
      accuracy,
      clickCount,
      keyCount
    ];
    trialData.push(row);
  }

  // Current state is pre-trial: Set pre-trial UI
  if (currentTrial === -1) {
    currentTrial += 1;
    ACPToolKit.presentTrial(trialConditions[currentTrial]);
    $('.js-expt-current-trial').text("Pre-Trial");
    $('.js-expt-action-button').text("Begin");
    $('#pretrial-instructions').css('display', 'block');

  // Current state is completed: Prompt download of trials result
  } else if (currentTrial === totalNumOfTrials) {
    ACPToolKit.downloadTrialResults(trialData);
    window.location = 'questionnaire-post.html';

  // Current state is a break: Set break UI, break first, then continue trial
  } else if (isBreakTime(currentTrial, totalNumOfTrials, numOfIntervals)) {
    alert("Let's take a 1-minute break here.\nI will let you know when to resume.");
    $('.js-expt-action-button').prop('disabled', true);

    endTime = new Date();
    endTime = new Date(endTime.getTime() + 60000);

    var timer = setInterval(function() {
        var currentTime = new Date();
        var seconds = Math.round((endTime - currentTime) / 1000);
        if (seconds <= 0) {
          seconds = "00";
        } else if (seconds < 10) {
          seconds = "0" + seconds;
        }
        $('#timer').text("00:" + seconds);
    }, 1000);

    setTimeout(function() {
      alert("1-minute is up!\nLet's continue.");
      initiateTrial();
      $('.js-expt-action-button').prop('disabled', false);
      $('#autocompaste-display').css('display', 'block');
      $('#trial-instructions').css('display', 'block');
      $('#autocompaste-timer').css('display', 'none');
      $('#break-instructions').css('display', 'none');
      clearInterval(timer);
    }, 60000);

    $('#autocompaste-timer').css('display', 'flex');
    $('#break-instructions').css('display', 'block');
    $('#autocompaste-display').css('display', 'none');
    $('#trial-instructions').css('display', 'none');

  // Current state is trial: Set trial UI, continue trial
  } else {
    $('#pretrial-instructions').css('display', 'none');
    initiateTrial();
  }
}

// Bind everything to track mouse and key presses
$(document).on('mousedown', function(e) {
  clickCount += 1;
});
$(document).on('keydown', function(e) {
  keyCount += 1;
});

// On-load experiment page, setup and initiate experiment
$(document).ready(function() {
  // Fetch articles list, then fetch articles
  $.when(
    $.ajax(simpleArticlesFile),
    $.ajax(complexArticlesFile)
  ).done(function(simple, complex) {
    var setupRequest = $.ajax(experimentsFile);
    requests.push(setupRequest);
    // Prepare simple articles request
    var simplePaths = simple[0];
    for (var pathIndex in simplePaths) {
      var deferred = $.ajax(simplePaths[pathIndex].url, {
        key: simplePaths[pathIndex].title,
        success: function(result) {
          simpleArticles[this.key] = result;
        }
      });
      requests.push(deferred);
    }
    // Prepare complex articles request
    var complexPaths = complex[0];
    for (var pathIndex in complexPaths) {
      var deferred = $.ajax(complexPaths[pathIndex].url, {
        key: complexPaths[pathIndex].title,
        success: function(result) {
          complexArticles[this.key] = result;
        }
      });
      requests.push(deferred);
    }
    // Fetch articles, then setup experiment
    $.when.apply($, requests).then(function() {
      var setup = arguments[0][0];
      var articles = {
        'small': {
          'source': simpleArticlesFile,
          'articles': simpleArticles
        },
        'large': {
          'source': complexArticlesFile,
          'articles': complexArticles
        }
      };
      pid = ACPToolKit.getCurrentParticipantId();
      configurations = setup.configurations;
      trialConditions = ExperimentParser.getExperiments(pid, configurations, articles);
      currentTrial = -1;
      totalNumOfTrials = trialConditions.length - 1;
      $('.js-expt-num-trials').text(totalNumOfTrials);
      trialData.push(headers);
      next();
    });
  });
});

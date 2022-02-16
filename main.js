/*jshint esversion:6*/

$(function() {
    const video = $("video")[0];

    var model;
    var cameraMode = "environment"; // or "user"

    const startVideoStreamPromise = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: cameraMode
        }
    }).then(function(stream) {
        return new Promise(function(resolve) {
            video.srcObject = stream;
            video.onloadeddata = function() {
                video.play();
                resolve();
            };
        });
    });

    var publishable_key = "rf_xsaIZ3DeAfXIUzFPhc57";
    var toLoad = {
        model: "rock-paper-scissors-presentation",
        version: 4 // <<<--- YOUR VERSION THERE
    };

    const loadModelPromise = new Promise(function(resolve, reject) {
        roboflow.auth({
            publishable_key: publishable_key
        }).load(toLoad).then(function(m) {
            model = m;
            resolve();
        });
    });


    const SELECTIONS = [
        {
          name: 'rock',
          emoji: '✊',
        },
        {
          name: 'paper',
          emoji: '✋',
        },
        {
          name: 'scissors',
          emoji: '✌',
        }
      ]
      

var startGame = false
var computer = "none"
var buttonStart = document.querySelector("button")
    buttonStart.addEventListener("click", function(e){
    e.preventDefault();
    computer = randomSelection();
    // console.log("computer =>>>>>>>>>>>>", computer)
    startGame=true
    alert(`PRESS OK: ROCK, PAPER, SCISSORS, SHOOT!`)
})

function randomSelection() {
    const randomIndex = Math.floor(Math.random() * SELECTIONS.length)
    return SELECTIONS[randomIndex].name
  }

  let playerScore = 0;
  let computerScore = 0;
  
// Complete logic of game inside this function
const winner = (player, computer) => {

    let emoji;

    for (let i = 0; i < SELECTIONS.length; i++) {
        if(SELECTIONS[i].name === computer){
            emoji = SELECTIONS[i].emoji
        }
      }
    document.getElementById("computerSign").innerHTML = emoji

    // console.log("emoji", emoji)
    // console.log("emo", computer)
    const playerScoreBoard = document.querySelector('.player-count');
    const computerScoreBoard = document.querySelector('.computer-count');

    let result;
    if(player === computer){
        result = 'Tie'
    }
    else if(player == 'rock'){
        if(computer == 'paper'){
            result = 'Computer Won';
            computerScore++;
            computerScoreBoard.textContent = computerScore;

        }else{
            result = 'Player Won'
            playerScore++;
            playerScoreBoard.textContent = playerScore;
        }
    }
    else if(player == 'scissors'){
        if(computer == 'rock'){
            result = 'Computer Won';
            computerScore++;
            computerScoreBoard.textContent = computerScore;
        }else{
            result = 'Player Won';
            playerScore++;
            playerScoreBoard.textContent = playerScore;
        }
    }
    else if(player == 'paper'){
        if(computer == 'scissors'){
            result = 'Computer Won';
            computerScore++;
            computerScoreBoard.textContent = computerScore;
        }else{
            result = 'Player Won';
            playerScore++;
            playerScoreBoard.textContent = playerScore;
        }
    }

    return result
}


    Promise.all([
        startVideoStreamPromise,
        loadModelPromise
    ]).then(function() {
        $('body').removeClass('loading');
        $('button').removeClass('hidden');
        resizeCanvas();
        detectFrame();
    })

    var canvas, ctx;
    const font = "16px sans-serif";

    function videoDimensions(video) {
        // Ratio of the video's intrisic dimensions
        var videoRatio = video.videoWidth / video.videoHeight;

        // The width and height of the video element
        var width = video.offsetWidth, height = video.offsetHeight;

        // The ratio of the element's width to its height
        var elementRatio = width/height;

        // If the video element is short and wide
        if(elementRatio > videoRatio) {
            width = height * videoRatio;
        } else {
            // It must be tall and thin, or exactly equal to the original ratio
            height = width / videoRatio;
        }

        return {
            width: width,
            height: height
        };
    }

    $(window).resize(function() {
        resizeCanvas();
    });

    const resizeCanvas = function() {
        $('canvas').remove();

        canvas = $('<canvas/>');

        ctx = canvas[0].getContext("2d");

        var dimensions = videoDimensions(video);

        console.log(video.videoWidth, video.videoHeight, video.offsetWidth, video.offsetHeight, dimensions);

        canvas[0].width = video.videoWidth;
        canvas[0].height = video.videoHeight;

        canvas.css({
            width: dimensions.width,
            height: dimensions.height,
            left: ($(window).width() - dimensions.width) / 2,
            top: ($(window).height() - dimensions.height) / 2
        });

        $('body').append(canvas);
    };

    const renderPredictions = function(predictions) {
        var dimensions = videoDimensions(video);

        var scale = 1;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        predictions.forEach(function(prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;

            const width = prediction.bbox.width;
            const height = prediction.bbox.height;

            // Draw the bounding box.
            ctx.strokeStyle = prediction.color;
            ctx.lineWidth = 4;
            ctx.strokeRect((x-width/2)/scale, (y-height/2)/scale, width/scale, height/scale);

            // Draw the label background.
            ctx.fillStyle = prediction.color;
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect((x-width/2)/scale, (y-height/2)/scale, textWidth + 8, textHeight + 4);
        });

        predictions.forEach(function(prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;

            const width = prediction.bbox.width;
            const height = prediction.bbox.height;

            // Draw the text last to ensure it's on top.
            ctx.font = font;
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000000";
            ctx.fillText(prediction.class, (x-width/2)/scale+4, (y-height/2)/scale+1);
        });
    };


    var prevTime;
    var pastFrameTimes = [];
    const detectFrame = function() {
        if(!model) return requestAnimationFrame(detectFrame);

        model.detect(video).then(function(predictions) {
            requestAnimationFrame(detectFrame);
            renderPredictions(predictions);

            if(prevTime) {
                pastFrameTimes.push(Date.now() - prevTime);
                if(pastFrameTimes.length > 30) pastFrameTimes.shift();

                var total = 0;
                _.each(pastFrameTimes, function(t) {
                    total += t/1000;
                });

                var fps = pastFrameTimes.length / total;
                $('#fps').text(Math.round(fps));
            }
            prevTime = Date.now();
            // Result pop up
            if(startGame == true && predictions.length > 0) {
                let human = predictions[0].class.toLowerCase();
                let result = winner(human, computer)
                console.log("human >>>>>", human, result)
                let string = `computer: ${computer}\n human: ${human}\n result: ${result}`
                alert(string)
            }
        }).catch(function(e) {
            console.log("CAUGHT", e);
            requestAnimationFrame(detectFrame);
        });
    };
});


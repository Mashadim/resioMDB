'use strict'; // eslint-disable-line strict
const fs = require('fs'); // eslint-disable-line no-unused-vars
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/resiodb');
//mongoose.connection.once('open', function() {
//	console.log('Connected with resiodb')
//});
//create an instance of an express application
const app = express();

//our express app will act as a handler to an http server - notice '.Server' method
const http = require('http').Server(app); // eslint-disable-line new-cap

//Don't need this? :const QuestionSchema = require('./modules/questionSchema');

const pollRoute = require('./Routes/pollRoute');

app.use('/polls', pollRoute);

//require in socket.io
//the html page also needs a script tag - see client/index.html
//require in socket.io and pass the http server to it
//the socket is now listening on our server
//this triggers the 'connection' event that io listens for below
const io = require('socket.io')(http);

const mockDB = require('./mockDB');

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}./../client/index.html`));
});

app.get('/client/bundle.js', (req, res) => {
  res.sendFile(path.join(`${__dirname}./../client/bundle.js`));
});

//when the server starts, io needs to listen for the 'connection' event
//that event triggers a callback where it is common practice to name the parameter 'socket'
//'.on' acts as an event listener - socket will only listen for events
//while only io will emit events with the '.emit' method
//this is different in the react components where socket will both listen and emit
//this particular event 'viewerAnswer' is being emitted from the viewer at Viewer-Choice.jsx
//then the server emits the data via the 'serverResponse' event, which is heard by Presenter-Dashboard.jsx
io.on('connection', socket => {
  socket.on('viewerAnswer', data => {

    // dataObj = {q: question index, choice: new choice {string},
    //  allVotes: stringified array from local storage}

    var dataObj = JSON.parse(data);
    var presenterObj = {
      q: dataObj.q,
      choice: dataObj.choice // new choice
    }
    //  parse allVotes into an array
    //  the array index correspond to the question order on page
    var votes = JSON.parse(dataObj.allVotes);

    if (votes[dataObj.q] === dataObj.choice) {
      return;
    } else if (votes[dataObj.q] !== null) {
      presenterObj.oldChoice = votes[dataObj.q];
    }

    votes[dataObj.q] = dataObj.choice;
    io.emit('updatePresenter', JSON.stringify(presenterObj));
    socket.emit('updateLS', JSON.stringify(votes));

  });

  socket.on('getQuestions', (hash) => {
    console.log("i've received hash:", hash);
    console.log("i'm going to send:", mockDB[hash]);
    socket.emit('sendQuestions', mockDB[hash]);
  });
});

app.get('/api/questions', (req, res) => {
	console.log()
//	var listOfQuestions = new Questions({
//		
//	})
  res.json(database);
});

//data is hard coded into the server for now
//for the app to work, the data structure should be formatted as follows:
//an object containing one key named 'questions' whose value is an array containing all questions
//each element in the array is an object containing 4 keys
//'cType' will determine graph type in Presenter-IndividualGraph.jsx
//'question' is just the question text that will be displayed
//'choices' is an array of all possible choices - these will also be displayed
//'qType' is used to determine whether the thumb graphic is used in Viewer-Choices.jsx
//both Presenter-Dashboard.jsx and Viewer-QuestionApp.jsx make an ajax request to grab this data

//var database = {
//  questions:
//  [
//    { cType: 'bar',
//      question: 'Who has the coolest scratch project?',
//      choices: [{ Brandon: 0, Danny: 0, Masha: 0}],
//      qType: 'multiple'
//    },
//    { cType: 'pie',
//      question: 'What is your favorite beer?',
//      choices: [{ 'Stone IPA': 0, 'Corona Light': 0, 'Guiness': 0, 'Sierra Nevada': 0, 'Blue Moon': 0, "I don't drink beer, I drink bourbon": 0}],
//      qType: 'multiple'
//    },
//    {
//      cType: 'bar',
//      question: 'What was your favorite company that came to hiring day?',
//      choices: [{ 'Dog Vacay': 0, 'Dollar Shave Club': 0, 'LA Body Points': 0, Whisper: 0, Procore: 0, ESPN: 0, Ticketmaster: 0 }],
//      qType: 'multiple'
//    },
//    { cType: 'pie',
//      question: 'Thumbs Up or Thumbs Down on drinks last Thursday?',
//      choices: [{ Up: 0, Down: 0 }],
//      qType: 'thumbs'
//    }
//  ]
//};

//http is our server and therefore needs to be listening on a port
http.listen(3000);

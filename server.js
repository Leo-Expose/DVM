// starting comment 
// code by leo
// i accept payment in all forms

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 7000;

// necessary comment
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'resources')));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'resources/webpages'));

app.use(session({
  secret: 'votingSecret',
  resave: false,
  saveUninitialized: true,
}));

// Load votes
let votes = { headBoy: {}, headGirl: {}, generalCaptain: {} };
const voteFilePath = path.join(__dirname, 'votes', 'V.csv');

const loadVotes = () => {
  if (fs.existsSync(voteFilePath)) {
    const data = fs.readFileSync(voteFilePath, 'utf8');
    data.split('\n').forEach(line => {
      const [candidate, count] = line.split(',');
      if (candidate && count) {
        const [type, name] = candidate.split('_');
        if (!votes[type]) votes[type] = {};
        votes[type][name] = parseInt(count, 10);
      }
    });
  }
};

const saveVote = (type, candidate) => {
  if (!votes[type][candidate]) {
    votes[type][candidate] = 0;
  }
  votes[type][candidate]++;
  const data = Object.entries(votes).flatMap(([type, candidates]) =>
    Object.entries(candidates).map(([name, count]) => `${type}_${name},${count}`)
  ).join('\n');
  fs.writeFileSync(voteFilePath, data);
};

const logVote = (user, type, candidate) => {
  if (user && user.name) {
    const logFilePath = path.join(__dirname, 'logs', 'log.csv');
    const logEntry = `${user.name},${user.admissionNumber},${type},${candidate}\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(`Vote Logged: ${logEntry.trim()}`);
  } else {
    console.error('User is undefined or missing name property');
  }
};

// DB loading & checking bcoz errors are everywhere in life
let voters = [];
const votersFilePath = path.join(__dirname, 'Voters.csv');

const loadVoters = () => {
  if (fs.existsSync(votersFilePath)) {
    const data = fs.readFileSync(votersFilePath, 'utf8');
    voters = data.split('\n').slice(1).map(line => {
      const [name, admissionNumber] = line.split(',');
      return { name: name?.trim(), admissionNumber: admissionNumber?.trim() };
    }).filter(voter => voter.name && voter.admissionNumber);
  }
};

// voter validation
const isValidVoter = (name, admissionNumber) => {
  return voters.some(voter => 
    voter.name.toLowerCase() === name.trim().toLowerCase() && 
    voter.admissionNumber === admissionNumber.trim()
  );
};

// candidate naming
const headBoys = [
  { name: "Abdul Hazim", photo: "headboy1.png", class: "Class X" },
  { name: "Neil Binoy", photo: "headboy2.png", class: "Class X" },
  { name: "Thejus Kamal", photo: "headboy3.png", class: "Class X" }
];

const headGirls = [
  { name: "Elizabeth Olsen", photo: "headgirl1.png", class: "Class XI" },
  { name: "Toxic Britney", photo: "headgirl2.png", class: "Class XI" },
  { name: "Scarlett Johannson", photo: "headgirl3.png", class: "Class XI" },
  { name: "Hazel FromPJ", photo: "headgirl4.png", class: "Class XI" },
  { name: "Annabeth FromPJ", photo: "headgirl5.png", class: "Class XI" }
];

const generalCaptains = [
  { name: "L Messi", photo: "gencap1.png", class: "Class XII" },
  { name: "Christiano Ronaldo", photo: "gencap2.png", class: "Class XII" },
  { name: "Yousef", photo: "gencap3.png", class: "Class XII" },
  { name: "Ahmed", photo: "gencap4.png", class: "Class XII" },
  { name: "Mohammed", photo: "gencap5.png", class: "Class XII" },
  { name: "Miloud", photo: "gencap6.png", class: "Class XII" },
  { name: "Hussien", photo: "gencap7.png", class: "Class XII" },
  { name: "George", photo: "gencap8.png", class: "Class XII" },
  { name: "Jennifer F Kennedy", photo: "gencap9.png", class: "Class XII" },
  { name: "Bear Rosevelvet", photo: "gencap10.png", class: "Class XII" },
  { name: "Obama Unknown", photo: "gencap11.png", class: "Class XII" }
];

// webpage redirection
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login.html');
});

app.post('/login', (req, res) => {
  const { name, admissionNumber } = req.body;
  if (isValidVoter(name, admissionNumber)) {
    req.session.user = { name, admissionNumber };
    console.log(`Login Successful: ${name}, ${admissionNumber}`);
    res.redirect('/headBoy');
  } else {
    console.log(`Invalid Login Attempt: ${name}, ${admissionNumber}`);
    res.render('invalid.html');
  }
});

app.get('/headBoy', (req, res) => {
  res.render('headboy.html', { candidates: headBoys });
});

app.post('/vote/headBoy', (req, res) => {
  const { candidate } = req.body;
  const user = req.session.user;
  saveVote('headBoy', candidate);
  logVote(user, 'headBoy', candidate);
  res.redirect('/headGirl');
});

app.get('/headGirl', (req, res) => {
  res.render('headgirl.html', { candidates: headGirls });
});

app.post('/vote/headGirl', (req, res) => {
  const { candidate } = req.body;
  const user = req.session.user;
  saveVote('headGirl', candidate);
  logVote(user, 'headGirl', candidate);
  res.redirect('/generalCaptain');
});

app.get('/generalCaptain', (req, res) => {
  res.render('gencap.html', { candidates: generalCaptains });
});

app.post('/vote/generalCaptain', (req, res) => {
  const { candidate } = req.body;
  const user = req.session.user;
  saveVote('generalCaptain', candidate);
  logVote(user, 'generalCaptain', candidate);
  res.render('success.html');
});

app.get('/admin', (req, res) => {
  res.render('admin.html');
});

app.post('/admin/start', (req, res) => {
  res.send('<script>window.open("/login", "_blank");</script>Voting started!');
});

app.post('/admin/stop', (req, res) => {
  res.send('Voting stopped!');
});

app.post('/admin/pause', (req, res) => {
  res.send('Voting paused!');
});

// Load data for no reason but code will die if this is not there
// blame stackoverflow
loadVotes();
loadVoters();

// update 3, running on local network
app.listen(port, '0.0.0.0', () => {
  console.log(`Voting app listening at http://0.0.0.0:${port}`);
});

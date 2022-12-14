const lightmode = ['#275d38', '#1a4127', '#ffffff'];
const darkmode = ['#0e2717', '#ffffff87', '#2e2e2e'];
let toggle = true;
let usermodepref;
let systemmodepref = 'unknown';
const audio = new Audio('./resources/bell.wav');
const siriOpen = new Audio('./resources/siri open.mp3');
const siriClose = new Audio('./resources/siri close.mp3');
audio.volume = 0.4;
let msg = new SpeechSynthesisUtterance();
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
let recognition = new SpeechRecognition();
let enabled = false;

// new speech recognition object

// This runs when the speech recognition service returns result

// start recognition

//there wasn't a dsitinguish between a darkmode preference for windows and browser

$(document).ready(() => {
  $('button[data-cy="add_log_btn"]').prop('disabled', true);
  fetchCourseData();
  $(document).on('change', '#course', unhide);
  $(document).on('keyup', '#uvuId', cleantext);
  $(document).on('keyup', '#uvuId', fetchUVUData);
  $(document).on('click', '#lightbulb', toggleDarkmode);
  $(document).on('submit', '#form', postUVUdata);
  $(document).on('click', '#speechRecordStart', recording);
  $(document).on('keyup', '#textareaLog', () => {
    if ($('#textareaLog').val().length > 0 && enabled)
      $('button[data-cy="add_log_btn"]').prop('disabled', false);
    else $('button[data-cy="add_log_btn"]').prop('disabled', true);
  });
  let usermodepref = getCookie('darkmodepref');
  if (!usermodepref) usermodepref = 'unknown';
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
    systemmodepref = 'dark';
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  )
    systemmodepref = 'light';
  if (usermodepref == 'Yes') {
    toggleDarkmode();
    usermodepref = 'dark';
  } else if (usermodepref == 'No') {
    usermodepref = 'light';
  } else if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    toggleDarkmode();
  }
  console.log(`User Pref: ${usermodepref}`);
  console.log(`OS Pref: ${systemmodepref}`);
});

function recording() {
  recognition.onstart = function () {
    siriOpen.play();
  };

  recognition.onresult = function (event) {
    var transcript = event.results[0][0].transcript;
    $('#textareaLog').val(transcript);
  };

  recognition.onspeechend = function () {
    if (enabled) $('button[data-cy="add_log_btn"]').prop('disabled', false);
    siriClose.play();
    // when user is done speaking
    recognition.stop();
  };
  recognition.start();
}

function toggleDarkmode() {
  if (toggle) {
    $('body').css('backgroundColor', darkmode[0]);
    $('.fancyForm').css('color', darkmode[1]);
    $('.fancyForm').css('backgroundColor', darkmode[2]);
    $('#toprow').css('backgroundColor', darkmode[2]);
    toggle = false;
    document.cookie = 'darkmodepref=Yes';
  } else {
    $('body').css('backgroundColor', lightmode[0]);
    $('.fancyForm').css('color', lightmode[1]);
    $('.fancyForm').css('backgroundColor', lightmode[2]);
    $('#toprow').css('backgroundColor', lightmode[2]);
    toggle = true;
    document.cookie = 'darkmodepref=No';
  }
}

//unhides when a course is selected
function unhide(event) {
  if ($('#course').val() == '') {
    $('#uvuId').css('display', 'none');
    $('#labelId').css('display', 'none');
  } else {
    $('#uvuId').css('display', 'block');
    $('#labelId').css('display', 'block');
  }
}

function cleantext(event) {
  if (isNaN($('#uvuId').val().slice(-1))) {
    $('#uvuId').val(
      $('#uvuId')
        .val()
        .slice(0, $('#uvuId').val().length - 1)
    );
  }
}

function hideComment(element) {
  //this hides comments for the studentlogs

  if (element.lastElementChild.style.display == 'none') {
    element.lastElementChild.style.display = 'block';
    element.parentNode.lastElementChild.style.display = 'block';
  } else {
    element.lastElementChild.style.display = 'none';
    element.parentNode.lastElementChild.style.display = 'none';
  }
}

function playText(element) {
  //plays text to speach of that element
  let tmp =
    element.parentNode.childNodes[0].lastElementChild.lastElementChild
      .innerHTML;

  msg.text = tmp;
  window.speechSynthesis.speak(msg);
}

function fetchCourseData(event) {
  // URL for the database, specifying courses
  let url = `http://localhost:3000/api/v1/courses`;

  // Set uvuId search bar placeholder here
  $('#uvuId').attr('placeholder', '10234567');

  // Get request for courses
  axios
    .get(url)
    .then((text) => {
      text = text.data;
      //parse the text from response
      //text = JSON.parse(text);
      //set the options
      let html = '<option selected value="">Choose Courses</option>\n';
      for (i of text) {
        html += `<option value="${i.id}">${i.display}</option>\n`;
      }
      //paste to innerhtml
      $('#course').html(html);
    })
    .catch((err) => console.log(err));
}

function fetchUVUData(event) {
  //define variables
  const uvuId = $('#uvuId').val();
  const corseId = $('#course').val();

  const studentLogs = document.querySelector('ul[data-cy="logs"]');
  let html = '';

  if ($('#uvuId').val().length == 8) {
    // get request for logs with specified uvuid and courseId
    let url = `http://localhost:3000/api/v1/logs?uvuId=${uvuId}&courseId=${corseId}`;

    axios
      .get(url)
      .then((text) => {
        text = text.data;
        //once it passes prints the specified student Logs for uvu id
        $('#uvuIdDisplay').html(`Student Logs for ${uvuId}`);
        for (i of text) {
          html += `<div class="listItemDiv"><li onclick="hideComment(this)">
                <div><small>${i.date} </small></div>
                <pre><p class="logCommentSelector">${i.text}</p></pre>
              </li><button type="button" class= "playButton" onclick="playText(this)">Play</button></div>`;
        }
        studentLogs.innerHTML = html;
        enabled = true;
        if ($('#textareaLog').val().length > 0)
          $('button[data-cy="add_log_btn"]').prop('disabled', false);
      })
      .catch((err) => console.log(err));
  }
}

function postUVUdata(event) {
  event.preventDefault();
  const uvuId = $('#uvuId').val();
  const courseId = $('#course').val();
  const postlogs = $('#textareaLog').val();

  let date = new Date();
  date = date.toLocaleString();
  const id = createUUID();
  let params = {
    courseId: courseId,
    uvuId: uvuId,
    date: date,
    text: postlogs,
    id: id,
  };

  let url = `http://localhost:3000/api/v1/logs`;
  axios.post(url, params).then(function (response) {
    console.log(response);
    $('#textareaLog').val('');
    fetchUVUData();
    $('button[data-cy="add_log_btn"]').prop('disabled', true);

    audio.play();
  });
}

function createUUID() {
  return 'xxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(cname) {
  let name = cname + '=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

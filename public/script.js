const passwordLengthRangeMin = 4;
const passwordLengthRangeMax = 20;
let numbersList = "";
let lowerCase = "abcdefghijklmnopqrstuvwxyz";
let upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let specialChars = "!@#$%^&*()_+-={}[];':?><,./|`~";

function updateWelcomeMessage() {
  let welcomeMsg = document.getElementById("welcomeHeader");
  let hrs = new Date().getHours();

  switch (true) {
    case hrs < 6:
      welcomeMsg.innerText = "Good Evening";
      break;
    case hrs < 12:
      welcomeMsg.innerText = "Good Morning";
      break;
    case hrs < 18:
      welcomeMsg.innerText = "Good Afternoon";
      break;
    default:
      welcomeMsg.innerText = "Good Evening";
      break;
  }
}

function getServerSysData(dataReq) {
  let o = '';
  new Promise((resolve, reject) => {
    fetch("/getSysData/" + dataReq, { method: "POST" }).then((response) => {
      resolve(response.json());
    });
  }).then((data) => {
    return data.out;
    
  });
  
}

function updateTimeAndDate() {
  let currentDate = new Date();
  let year = currentDate.getFullYear();
  let month = currentDate.toLocaleString("default", { month: "long" });
  let day = currentDate.getDate();
  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  let timeString = hours + ":" + minutes + ":" + seconds + "\n";
  let dateString = day + " " + month + " " + year;
  document.getElementById("time").innerText = timeString;
  document.getElementById("date").innerText = dateString;
}

function printMountStuff() {
  let toAlrt =
    "sudo mount -t cifs //192.168.1.216/configShare /mnt/serverShare -o credentials=/etc/samba/share";
  alert(toAlrt);
}

function navOpen(section) {
  let sections = document.getElementsByClassName("section");
  for (let i = 0; i < sections.length; i++) {
    sections[i].style.display = "none";
  }
  document.getElementById(section).style.display = "block";
}
function togglePassGenButtonState() {
  console.log("togglePassGenButtonState");
  let button = document.getElementById("passGenButton");

  if (button.classList.contains("passGenButtonUnpressed")) {
    button.classList.add("passGenButtonPressed");
    button.classList.remove("passGenButtonUnpressed");
  } else {
    button.classList.add("passGenButtonUnpressed");
    button.classList.remove("passGenButtonPressed");
  }
}

function passwordGenerationRequested() {
  //animate button press

  togglePassGenButtonState();

  setTimeout(togglePassGenButtonState, 195);

  //setTimeout(button.classList.remove("passGenButtonPressed"), 750);
  //setTimeout(button.classList.add("passGenButtonUnpressed"), 750);
  let length = Math.round(
    (document.getElementById("passGenLengthSlider").value / 100) *
      (passwordLengthRangeMax - passwordLengthRangeMin) +
      passwordLengthRangeMin
  );
  let lower = document
    .getElementById("includeLowerCase")
    .classList.contains("checked");
  let upper = document
    .getElementById("includeUpperCase")
    .classList.contains("checked");
  let numbers = document
    .getElementById("includeNumbers")
    .classList.contains("checked");
  let special = document
    .getElementById("includeSpecial")
    .classList.contains("checked");
  let password = generatePassword(length, numbers, lower, upper, special);

  document.getElementById("passGenOutput").innerHTML = password;
}

function generatePassword(PassLength, numbers, lower, upper, special) {
  let use = "";
  if (!numbers && !lower && !upper && !special) {
    numbers = true;
    lower = true;
    upper = true;
    special = true;
  }
  if (numbers) {
    use += numbersList;
  }
  if (lower) {
    use += lowerCase;
  }
  if (upper) {
    use += upperCase;
  }
  if (special) {
    use += specialChars;
  }

  use = use.split("");

  let password = "";

  for (let i = 0; i < PassLength; i++) {
    let rNum = Math.floor(Math.random() * use.length);
    password += String(use[rNum]);
  }
  return password;
}
function shutdownMenuToggle() {
  let menu = document.getElementById("shutdownMenu");
  if (menu.style.display == "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
}

updateWelcomeMessage();
updateTimeAndDate();
setInterval(updateTimeAndDate, 1000);

navOpen("home");
for (let i = 0; i < 10; i++) {
  numbersList += String(i);
}

document.getElementById("passGenLengthSlider").value = 50;
document.getElementById("includeLowerCase").classList.add("checked");
document.getElementById("includeNumbers").classList.add("checked");

document.querySelectorAll(".checkboxTd span").forEach(function (span) {
  span.addEventListener("click", function () {
    // Toggle the 'checked' class on the span element
    this.classList.toggle("checked");
  });
});

document
  .getElementById("passGenLengthSlider")
  .addEventListener("input", function () {
    let length = Math.round(
      (this.value / 100) * (passwordLengthRangeMax - passwordLengthRangeMin) +
        passwordLengthRangeMin
    );
    document.getElementById("passGenLengthText").innerHTML =
      "Length: " + length;
  });

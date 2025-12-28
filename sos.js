// sos.js
const PRIMARY_NUMBER = "+919264960831";
const EMERGENCY_CONTACTS = [
  "+91abcd960831",
  "+9195vxyz8546"
];

let countdown;
let timeLeft = 5;
let sosActive = false;

export function startEmergency() {
  if (sosActive) return;
  sosActive = true;
  
  timeLeft = 5;

  countdown = setInterval(() => {
    const el = document.getElementById("sosTime");
    if (el) el.innerText = timeLeft;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(countdown);
      triggerEmergency();
    }
  }, 1000);
}
export function cancelEmergency() {
  clearInterval(countdown);
  sosActive = false;
}

function triggerEmergency() {
  sosActive=false;

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const mapLink = `https://maps.google.com/?q=${lat},${lon}`;

      sendSMS(mapLink);
      makeCall();
    },
    () => alert("Location permission required for SOS")
  );
}

function makeCall() {
  window.location.href = "tel:" + PRIMARY_NUMBER;
}

function sendSMS(mapLink) {
  const msg = encodeURIComponent(
    `🚨 EMERGENCY ALERT!\nI need help.\nMy location:\n${mapLink}`
  );

  EMERGENCY_CONTACTS.forEach(num => {
    window.open(`sms:${num}?body=${msg}`);
  });
}

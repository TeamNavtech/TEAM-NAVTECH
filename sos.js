// sos.js
const PRIMARY_NUMBER = "+919264960831";
const EMERGENCY_CONTACTS = [
  "+919264960831",
  "+919569818546"
];

let countdown;
let timeLeft = 5;
let sosActive = false;

export function startEmergency() {
  if (sosActive) return;
  sosActive = true;

  showSOSModal();
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

function cancelSOS() {
  clearInterval(countdown);
  sosActive = false;
  document.getElementById("sosModal")?.remove();
}

function showSOSModal() {
  const modal = document.createElement("div");
  modal.className = "sos-modal";
  modal.id = "sosModal";
  modal.innerHTML = `
    <div class="sos-box">
      <h2>🚨 Emergency Alert</h2>
      <p>Calling & alerting contacts in</p>
      <div class="sos-timer" id="sosTime">5</div>
      <button id="cancelSOS">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("cancelSOS").onclick = cancelSOS;
}

function triggerEmergency() {
  cancelSOS();

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

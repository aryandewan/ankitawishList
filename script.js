let sunflowerCount = 0;
let petalsPerSunflower = 10;
let currentPetalCount = 0;
let direction = 1; // 1 = right, -1 = left

document.addEventListener("DOMContentLoaded", loadWishes); // Load wishes when page loads

// Initialize EmailJS with your public key
if (typeof emailjs !== "undefined") {
  emailjs.init("nIqNSrBXuJ895krcI");
} else {
  console.error("EmailJS library not loaded!");
}

function createSunflower(id) {
  sunflowerCount++;
  const sunflower = document.createElement("div");
  sunflower.classList.add("sunflower");
  sunflower.id = `sunflower-${id || sunflowerCount}`;

  const stem = document.createElement("img");
  stem.src = "stem.png";
  stem.classList.add("stem");

  const center = document.createElement("img");
  center.src = "center.png";
  center.classList.add("center");

  sunflower.appendChild(stem);
  sunflower.appendChild(center);
  document.getElementById("garden").appendChild(sunflower);

  let offsetX, offsetY, rotation;
  const isMobile = window.innerWidth <= 480;

  if (sunflowerCount === 1) {
    offsetX = window.innerWidth / 2 - 75;
    offsetY = 200;
  } else {
    if (isMobile) {
      // On mobile, stack sunflowers vertically below the first one
      offsetX = window.innerWidth / 2 - 75;
      offsetY = 200 + (sunflowerCount - 1) * 600; // 250px spacing between sunflowers
    } else {
      // Original positioning logic for desktop
      let referenceIndex = Math.floor(sunflowerCount / 2);
      let referenceSunflower = document.getElementById(
        `sunflower-${referenceIndex}`
      );

      let prevX =
        parseFloat(referenceSunflower.style.left) || window.innerWidth / 2 - 75;
      let prevY = parseFloat(referenceSunflower.style.top) || 200;

      offsetX = prevX + direction * 300;
      offsetY = prevY + 40;
      rotation = direction * 10;
    }
  }

  sunflower.style.position = "absolute";
  sunflower.style.left = `${offsetX}px`;
  sunflower.style.top = `${offsetY}px`;
  sunflower.style.transform = `rotate(${rotation || 0}deg)`;

  gsap.from(sunflower, {
    opacity: 0,
    scale: 0.5,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });

  direction *= -1;

  // Only trigger showSunflowerWishes when the center is clicked
  center.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent click from triggering sunflower click event
    showSunflowerWishes(sunflower.id);
  });
}

function sendWishEmail(wishText) {
  if (typeof emailjs === "undefined") {
    console.error("EmailJS library not loaded!");
    return;
  }

  const templateParams = {
    to_email: "n0teinquires@gmail.com",
    from_name: "Ankita",
    message: wishText,
  };

  emailjs.send("service_qaql9hr", "template_bfyqktc", templateParams).then(
    (response) => {
      console.log("Email sent successfully!", response.status, response.text);
    },
    (error) => {
      console.error("Failed to send email.", error);
    }
  );
}

function addWish() {
  const input = document.getElementById("wish-input");
  const wish = input.value.trim();
  if (!wish) return;

  // Send email with the new wish
  sendWishEmail(wish);

  input.value = "";

  if (currentPetalCount % petalsPerSunflower === 0) {
    createSunflower();
  }

  const petal = document.createElement("img");
  petal.src = "petal.png";
  petal.classList.add(
    "petal",
    `petal-${(currentPetalCount % petalsPerSunflower) + 1}`
  );
  petal.dataset.wish = wish;
  petal.addEventListener("click", showWishBox);

  const currentSunflower = document.getElementById(
    `sunflower-${sunflowerCount}`
  );
  currentSunflower.appendChild(petal);

  saveWish(
    wish,
    sunflowerCount,
    `petal-${(currentPetalCount % petalsPerSunflower) + 1}`
  );
  currentPetalCount++;
}

function saveWish(wish, sunflowerId, petalClass) {
  let wishes = JSON.parse(localStorage.getItem("wishes")) || [];
  wishes.push({ wish, sunflowerId, petalClass });
  localStorage.setItem("wishes", JSON.stringify(wishes));
}

function loadWishes() {
  let wishes = JSON.parse(localStorage.getItem("wishes")) || [];
  let sunflowerTracker = new Set();

  wishes.forEach(({ wish, sunflowerId, petalClass }) => {
    if (!document.getElementById(`sunflower-${sunflowerId}`)) {
      createSunflower(sunflowerId);
      sunflowerTracker.add(sunflowerId);
    }

    const petal = document.createElement("img");
    petal.src = "petal.png";
    petal.classList.add("petal", petalClass);
    petal.dataset.wish = wish;
    petal.addEventListener("click", showWishBox);

    document.getElementById(`sunflower-${sunflowerId}`).appendChild(petal);
  });

  sunflowerCount = sunflowerTracker.size;
  currentPetalCount = wishes.length;
}

function showWishBox(event) {
  event.stopPropagation();

  const wishBox = document.getElementById("wish-box");
  const wishText = document.getElementById("wish-text");
  const deleteButton = document.getElementById("delete-wish");
  const closeButton = document.getElementById("close-wish");

  // Get the wish from the sunflower center (it is stored in the dataset)
  const sunflowerId = event.target
    .closest(".sunflower")
    .id.replace("sunflower-", "");
  const petalClass = event.target.closest(".sunflower").querySelector(".petal")
    .classList[1];

  let wishes = JSON.parse(localStorage.getItem("wishes")) || [];
  let wish = wishes.find(
    (wish) => wish.sunflowerId == sunflowerId && wish.petalClass == petalClass
  ).wish;

  wishText.textContent = wish;
  deleteButton.onclick = () => deletePetal(event.target);
  closeButton.onclick = () => (wishBox.style.display = "none");

  wishBox.style.display = "block";
}

function deletePetal(petal) {
  // Remove petal visually
  gsap.to(petal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    onComplete: () => petal.remove(),
  });

  currentPetalCount--;

  // Remove wish from localStorage
  let wishes = JSON.parse(localStorage.getItem("wishes")) || [];
  wishes = wishes.filter(
    (wish) =>
      !(
        wish.sunflowerId == petal.parentElement.id.replace("sunflower-", "") &&
        wish.petalClass == petal.classList[1]
      )
  );
  localStorage.setItem("wishes", JSON.stringify(wishes));

  // Check if sunflower should be removed
  const sunflower = petal.parentElement;
  setTimeout(() => autoDeleteEmptySunflower(sunflower), 500);

  // Hide the wish box
  document.getElementById("wish-box").style.display = "none";
}

function autoDeleteEmptySunflower(sunflower) {
  setTimeout(() => {
    if (!sunflower.querySelector(".petal")) {
      gsap.to(sunflower, {
        opacity: 0,
        scale: 0,
        duration: 1,
        onComplete: () => {
          sunflower.remove();
          sunflowerCount--;
        },
      });
    }
  }, 100);
}

function showSunflowerWishes(sunflowerId) {
  const sunflower = document.getElementById(sunflowerId);
  const petalList = sunflower.querySelectorAll(".petal");

  const wishListContainer = document.getElementById("wish-list");
  wishListContainer.innerHTML = ""; // Clear previous list

  petalList.forEach((petal) => {
    const li = document.createElement("li");
    li.textContent = petal.dataset.wish;
    wishListContainer.appendChild(li);
  });

  // Show the sunflower info box
  document.getElementById("sunflower-info-box").style.display = "block";
}

function closeInfoBox() {
  document.getElementById("sunflower-info-box").style.display = "none";
}

document.body.insertAdjacentHTML(
  "beforeend",
  `<div id="wish-box">
      <p id="wish-text"></p>
      <button id="delete-wish">WISH COMPLETED</button>
      <button id="close-wish">CLOSE</button>
    </div>`
);

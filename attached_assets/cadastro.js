const firebaseConfig = {
  apiKey: "AIzaSyAP3Sy1PB0m_EpKifOpUd7tc1_eAKF2alM",
  authDomain: "vimbalambi-news.firebaseapp.com",
  projectId: "vimbalambi-news",
  storageBucket: "vimbalambi-news.appspot.com",
  messagingSenderId: "212254517932",
  appId: "1:212254517932:web:d061c943f90b4c4e204d09"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentStep = 1;
const form = document.getElementById("cadastroForm");
const steps = document.querySelectorAll(".form-step");
const stepIndicators = document.querySelectorAll(".step");
const backBtn = document.querySelector(".back");
const nextBtn = document.querySelector(".next");
const submitBtn = document.querySelector("button[type='submit']");

function showStep(n) {
  steps.forEach((step, i) => {
    step.classList.toggle("active", i === n - 1);
    stepIndicators[i].classList.toggle("active", i < n);
  });
  backBtn.style.display = n === 1 ? "none" : "inline-block";
  nextBtn.style.display = n < steps.length ? "inline-block" : "none";
  submitBtn.style.display = n === steps.length ? "inline-block" : "none";
  currentStep = n;
  console.log(`Etapa ${n} exibida.`);
}

function nextStep() {
  const inputs = steps[currentStep - 1].querySelectorAll("input, select");
  for (const input of inputs) {
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
  }
  showStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

showStep(1);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("loadingSpinner").style.display = "block";
  console.log("Iniciando processo de cadastro...");
  try {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const birthDate = document.getElementById("birthDate").value;
    const gender = document.getElementById("gender").value;
    const photoFile = document.getElementById("photo").files[0];
i
    console.log("Criando usuário no Firebase Auth...");
    const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
    const uid = userCredential.user.uid;
    console.log("Usuário criado com UID:", uid);

    let photoUrl = "";
    if (photoFile) {
      console.log("Enviando imagem para o Cloudinary...");
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("upload_preset", "vimbalambi_preset");

      const cloudRes = await fetch("https://api.cloudinary.com/v1_1/Esranislau/image/upload", {
        method: "POST",
        body: formData
      });
      const cloudData = await cloudRes.json();
      photoUrl = cloudData.secure_url;
      console.log("Imagem enviada com sucesso:", photoUrl);
    }

    console.log("Salvando dados no Firestore...");
    await db.collection("users").doc(uid).set({
      email,
      firstName,
      lastName,
      birthDate,
      gender,
      photoUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("Cadastro completo. Redirecionando...");
    window.location.href = "sucesso.html";
  } catch (error) {
    console.error("Erro no cadastro:", error);
    alert("Erro ao cadastrar: " + error.message);
  } finally {
    document.getElementById("loadingSpinner").style.display = "none";
  }
});
// Firebase Configuration
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

// Seleção de elementos do DOM
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("btnLogin");
const topLine = document.getElementById("topLine");
const successSound = document.getElementById("successSound");

// Função de login
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  errorMsg.style.display = "none"; // Esconde a mensagem de erro

  loginBtn.classList.add("elastic"); // Adiciona a animação no botão
  topLine.classList.add("active"); // Ativa a animação da linha de cima

  // Verifica se os campos não estão vazios
  if (!email || !password) {
    showError("Preencha todos os campos.");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified) {
        successSound.play(); // Toca o som de sucesso
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          window.location.href = "home.html"; // Redireciona para outra página após login
        }, 1800);
      } else {
        showError("Verifique seu email. Reenviamos o link.");
        user.sendEmailVerification()
          .then(() => console.log("Email de verificação reenviado."))
          .catch((error) => console.error("Erro ao reenviar verificação:", error));
      }
    })
    .catch((error) => {
      let message = "Email ou senha incorreta.";
      if (error.code === "auth/user-not-found") message = "Email não cadastrado.";
      if (error.code === "auth/wrong-password") message = "Senha incorreta.";
      if (error.code === "auth/invalid-email") message = "Email inválido.";
      showError(message);
      console.error("[Login] Erro:", error);
    });
});

// Função para mostrar a mensagem de erro
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
  errorMsg.style.animation = "shake 0.3s";
  setTimeout(() => errorMsg.style.animation = "", 300);
}

// Redefinir senha
document.getElementById("forgotPassword").addEventListener("click", () => {
  const email = prompt("Digite seu email:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert("Email de redefinição enviado."))
      .catch(() => alert("Erro: email não encontrado."));
  }
});
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

function createConfetti() {
  const confettiContainer = document.getElementById('confetti');
  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = -10 + 'px';
    confetti.style.width = Math.random() * 8 + 5 + 'px';
    confetti.style.height = Math.random() * 8 + 5 + 'px';
    
    const animationDuration = Math.random() * 2 + 1;
    confetti.style.animation = `fall ${animationDuration}s linear forwards`;
    
    confettiContainer.appendChild(confetti);
    
    const keyframes = `@keyframes fall {
      to {
        transform: translateY(${window.innerHeight + 10}px) rotate(${Math.random() * 360}deg);
        opacity: ${Math.random() * 0.5 + 0.5};
      }
    }`;
    
    const style = document.createElement('style');
    style.innerHTML = keyframes;
    document.head.appendChild(style);
  }
  
  confettiContainer.style.display = 'block';
  setTimeout(() => {
    confettiContainer.style.display = 'none';
    confettiContainer.innerHTML = '';
  }, 2000);
}
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("[AUTH] Usuário autenticado:", user.uid);
    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        console.log("[FIRESTORE] Dados recuperados:", data);

        document.getElementById("profilePhoto").src = data.photoUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
        document.getElementById("fullName").textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById("email").textContent = data.email;
        document.getElementById("birthDate").textContent = data.birthDate;
        document.getElementById("gender").textContent = data.gender;

        // Exibir confetes e botões após carregar os dados
        createConfetti();
        document.getElementById("buttonsContainer").style.display = "block";

        // Redireciona para o Dashboard após 3 segundos (APENAS SE ESTIVER LOGADO)

      } else {
        console.warn("[FIRESTORE] Documento não encontrado.");
      }
    } catch (err) {
      console.error("[FIRESTORE] Erro ao buscar dados:", err);
    }
  } else {
    console.warn("[AUTH] Usuário não autenticado. Redirecionando para Login...");
    // Se NÃO estiver logado, redireciona para a tela de Login (NÃO para o Dashboard!)
  }
});

function editarDados() {
  console.log("[AÇÃO] Usuário escolheu editar dados.");
  window.location.href = "cadastro.html"; // Corrigido para o caminho do cadastro
}

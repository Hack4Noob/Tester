// home.js - Script principal para a página inicial com sistema de log
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Sistema] Inicializando aplicação...');
    
    // Configurações iniciais
    const body = document.body;
    const html = document.documentElement;
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const posts = document.querySelectorAll('.post');
    const navLinks = document.querySelectorAll('.nav-bottom a');
    const postFields = document.querySelectorAll('.post-field');
    const themeToggle = document.getElementById('theme-toggle');

    /* ============= */
    /* SISTEMA DE TEMAS */
    /* ============= */
    function logThemeStatus() {
        const currentTheme = html.getAttribute('data-theme') || (body.classList.contains('dark-mode') ? 'dark' : 'light';
        const savedTheme = localStorage.getItem('theme') || localStorage.getItem('darkMode');
        console.log(`[Tema] Status atual: ${currentTheme} | Salvo: ${savedTheme || 'não definido'}`);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || (localStorage.getItem('darkMode') === 'true' ? 'dark' : null);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        console.log(`[Tema] Preferência do sistema: ${systemPrefersDark ? 'escuro' : 'claro'}`);

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            body.classList.add('dark-mode');
            html.setAttribute('data-theme', 'dark');
            console.log('[Tema] Tema escuro aplicado');
        } else {
            body.classList.remove('dark-mode');
            html.setAttribute('data-theme', 'light');
            console.log('[Tema] Tema claro aplicado');
        }
        
        logThemeStatus();
    }

    function toggleTheme() {
        const isDark = body.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        
        body.classList.toggle('dark-mode');
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        localStorage.setItem('darkMode', !isDark);
        
        console.log(`[Tema] Alternado para: ${newTheme}`);
        logThemeStatus();
    }

    // Inicializar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    initTheme();

    // Monitorar mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        console.log(`[Tema] Preferência do sistema alterada para: ${e.matches ? 'escuro' : 'claro'}`);
        if (!localStorage.getItem('theme') && !localStorage.getItem('darkMode')) {
            initTheme();
        }
    });

    /* ============= */
    /* DROPDOWN MENU */
    /* ============= */
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isVisible ? 'none' : 'block';
        console.log(`[Dropdown] ${isVisible ? 'Fechado' : 'Aberto'}`);
    });

    document.addEventListener('click', function() {
        if (dropdownContent.style.display === 'block') {
            dropdownContent.style.display = 'none';
            console.log('[Dropdown] Fechado ao clicar fora');
        }
    });

    dropdownContent.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('[Dropdown] Clicado dentro, mantendo aberto');
    });

    /* ============= */
    /* INTERAÇÕES COM POSTS */
    /* ============= */
    posts.forEach(post => {
        const likeBtn = post.querySelector('.post-action.like');
        const commentBtn = post.querySelector('.post-action.comment');
        const shareBtn = post.querySelector('.post-action.share');
        
        likeBtn.addEventListener('click', function() {
            const isActive = this.classList.contains('active');
            const icon = this.querySelector('i');
            
            if (isActive) {
                this.classList.remove('active');
                icon.classList.replace('fas', 'far');
                console.log('[Post] Like removido');
            } else {
                this.classList.add('active');
                icon.classList.replace('far', 'fas');
                console.log('[Post] Like adicionado');
                
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 300);
            }
        });
        
        commentBtn.addEventListener('click', function() {
            console.log('[Post] Clicado em comentar');
            alert('Funcionalidade de comentários será implementada em breve!');
        });
        
        shareBtn.addEventListener('click', function() {
            console.log('[Post] Clicado em compartilhar');
            alert('Opções de compartilhamento serão implementadas em breve!');
        });
    });

    /* ============= */
    /* EFEITOS VISUAIS */
    /* ============= */
    postFields.forEach(field => {
        field.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f6f7';
            console.log('[PostField] Hover ativado');
        });
        
        field.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#ffffff';
            console.log('[PostField] Hover desativado');
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            console.log(`[Navegação] Item ativado: ${this.querySelector('i').className}`);
        });
    });

    /* ============= */
    /* CARREGAMENTO DE POSTS */
    /* ============= */
    let isLoading = false;
    
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMorePosts();
        }
    });

    function loadMorePosts() {
        if (isLoading) {
            console.log('[Posts] Carregamento já em andamento, ignorando...');
            return;
        }
        
        console.log('[Posts] Iniciando carregamento de mais posts...');
        isLoading = true;
        const loader = document.createElement('div');
        loader.className = 'post-loader';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando mais posts...';
        document.querySelector('.feed').appendChild(loader);
        
        setTimeout(() => {
            const newPost = document.createElement('div');
            newPost.className = 'post elastic-enter';
            newPost.innerHTML = `
                <div class="post-header">
                    <img src="https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg" 
                         alt="Novo usuário" class="post-avatar">
                    <div>
                        <div class="post-user">Novo Usuário</div>
                        <div class="post-time">Agora mesmo <i class="fas fa-globe-europe"></i></div>
                    </div>
                </div>
                <div class="post-content">
                    Este é um novo post carregado dinamicamente quando você chega ao final da página.
                </div>
                <div class="post-actions">
                    <div class="post-action like">
                        <i class="far fa-thumbs-up"></i> Curtir
                    </div>
                    <div class="post-action comment">
                        <i class="far fa-comment"></i> Comentar
                    </div>
                    <div class="post-action share">
                        <i class="far fa-share-square"></i> Compartilhar
                    </div>
                </div>
            `;
            
            document.querySelector('.feed').removeChild(loader);
            document.querySelector('.feed').appendChild(newPost);
            addPostEvents(newPost);
            
            isLoading = false;
            console.log('[Posts] Novo post carregado com sucesso');
        }, 1500);
    }
    
    function addPostEvents(post) {
        const likeBtn = post.querySelector('.post-action.like');
        const commentBtn = post.querySelector('.post-action.comment');
        const shareBtn = post.querySelector('.post-action.share');
        
        likeBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
            console.log('[Novo Post] Like alterado');
        });
        
        commentBtn.addEventListener('click', function() {
            console.log('[Novo Post] Tentativa de comentar');
            alert('Comentários desabilitados em posts simulados.');
        });
        
        shareBtn.addEventListener('click', function() {
            console.log('[Novo Post] Tentativa de compartilhar');
            alert('Compartilhamento desabilitado em posts simulados.');
        });
    }

    /* ============= */
    /* TOOLTIPS */
    /* ============= */
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });

    function showTooltip(e) {
        const tooltipText = this.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        
        console.log(`[Tooltip] Mostrando: ${tooltipText}`);
    }

    function hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
            console.log('[Tooltip] Escondido');
        }
    }

    /* ============= */
    /* VERIFICAÇÃO DE IMAGENS */
    /* ============= */
    document.querySelectorAll('img').forEach(img => {
        img.onerror = () => {
            console.warn(`[Imagem] Erro ao carregar: ${img.src}`);
            img.style.display = 'none';
        };
        console.log(`[Imagem] Carregada: ${img.src}`);
    });

    console.log('[Sistema] Aplicação inicializada com sucesso');
});

// Manter funções globais para compatibilidade
function toggleDarkMode() {
    console.log('[Função Global] toggleDarkMode chamada');
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Atualizar atributo data-theme
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

window.addEventListener('load', function() {
    if (localStorage.getItem('darkMode') === 'true' || localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        console.log('[Carregamento] Tema escuro aplicado a partir do cache');
    }
});
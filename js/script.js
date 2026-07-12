function init() {
    // Remove loading class
    document.body.classList.remove('loading');

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    /*=============== THEME TOGGLE ===============*/
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    // Check local storage for theme
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = 'bx bx-moon';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            if (body.classList.contains('light-mode')) {
                localStorage.setItem('theme', 'light');
                if (themeIcon) themeIcon.className = 'bx bx-moon';
            } else {
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.className = 'bx bx-sun';
            }
        });
    }

    /*=============== TYPED.JS ===============*/
    if (document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: [
                'Desenvolvedora Full Stack em formação.',
                'Criando experiências digitais memoráveis.',
                'Construindo soluções robustas.',
                'Apaixonada por código e design.'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    /*=============== CHATBOT LOGIC ===============*/
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.querySelector('.chatbot__window');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotMessages = document.getElementById('chatbotMessages');

    if (chatbotToggle && chatbotWindow) {
        chatbotToggle.addEventListener('click', () => {
            chatbotWindow.classList.add('is-open');
        });

        chatbotClose.addEventListener('click', () => {
            chatbotWindow.classList.remove('is-open');
        });

        const responses = [
            {
                keywords: ['quem é', 'sobre', 'estuda', 'faculdade', 'formação'],
                answer: 'A Anna Beatriz é estudante de Engenharia de Software na Faculdade Católica de Brasília. Ela é apaixonada por tecnologia e desenvolvimento web, buscando sempre criar soluções organizadas, intuitivas e eficientes. Se desejar, posso apresentar outro projeto ou falar mais sobre as habilidades da Anna.'
            },
            {
                keywords: ['tecnologia', 'tecnologias', 'habilidade', 'habilidades', 'domina', 'linguagens', 'programação', 'linguagem'],
                answer: 'A Anna possui experiência com: HTML5, CSS3, JavaScript, Node.js, Express.js, Java, Python, MySQL, Git e GitHub. Se desejar, posso apresentar algum projeto onde ela aplicou essas tecnologias.'
            },
            {
                keywords: ['projeto', 'projetos', 'desenvolveu', 'portfolio', 'portfólio'],
                answer: 'A Anna desenvolveu projetos incríveis! Destaques: \n- Brasidente: Simulador educativo de gestão política.\n- Lojinha Online: Sistema de e-commerce.\n- Calculadora de Abastecimento.\n- Quiz Marvel.\n- Landing Page Pudim.\nFique à vontade para explorar a seção de Projetos no site para mais detalhes!'
            },
            {
                keywords: ['desafiador', 'dificil', 'maior desafio'],
                answer: 'O Brasidente foi um grande desafio! É um jogo estratégico desenvolvido em Python, onde o jogador toma decisões políticas e econômicas complexas. Você pode conferir mais sobre ele na seção de Destaque!'
            },
            {
                keywords: ['contato', 'falar', 'email', 'linkedin', 'entrar em contato'],
                answer: 'Você pode entrar em contato com a Anna através do email anascimentoreis8@gmail.com ou pelo LinkedIn e GitHub disponíveis na seção final da página. Ela vai adorar conversar com você!'
            },
            {
                keywords: ['currículo', 'curriculo', 'cv', 'baixar', 'pdf'],
                answer: 'Claro! Você pode baixar o currículo da Anna clicando no botão "CURRÍCULO" no menu de navegação, lá no topo da página.'
            },
            {
                keywords: ['github', 'git hub', 'repositorio', 'repositório'],
                answer: 'O GitHub da Anna é "Annascimento8". Lá você encontra o código fonte de todos esses projetos que mencionei. Você pode acessar pelo link no rodapé!'
            },
            {
                keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem'],
                answer: 'Olá! Eu sou a ANA.I, a assistente virtual do portfólio da Anna Beatriz. Como posso te ajudar a conhecer melhor o trabalho dela hoje?'
            }
        ];

        function appendMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('chat-msg', sender);
            // Replace newlines with <br> for formatting
            msgDiv.innerHTML = text.replace(/\n/g, '<br>');
            chatbotMessages.appendChild(msgDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function handleChatbotInput() {
            const text = chatbotInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            chatbotInput.value = '';

            // Mostrar "Digitando..."
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('chat-msg', 'ai', 'typing');
            typingDiv.textContent = '...';
            chatbotMessages.appendChild(typingDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            setTimeout(() => {
                // Remove typing indicator
                chatbotMessages.removeChild(typingDiv);

                const lowerText = text.toLowerCase();
                let reply = 'Essa informação não está disponível no portfólio no momento. Mas se desejar, posso apresentar algum projeto ou falar mais sobre as habilidades da Anna.';

                // Buscar melhor resposta
                for (const item of responses) {
                    const match = item.keywords.some(kw => lowerText.includes(kw));
                    if (match) {
                        reply = item.answer;
                        break;
                    }
                }
                appendMessage(reply, 'ai');

                // Atualizar tópicos restantes removendo os que foram falados
                remainingTopics = remainingTopics.filter(topic => {
                    const kwMatch = responses.find(r => r.answer === reply)?.keywords || [];
                    return !kwMatch.some(kw => topic.toLowerCase().includes(kw));
                });

                // Adicionar botões de "Continuar ou não" se não for uma resposta de encerramento
                if (!lowerText.includes('não') && !lowerText.includes('obrigado') && !lowerText.includes('encerrar')) {
                    setTimeout(() => {
                        appendContinueOptions();
                    }, 500);
                }

            }, 800);
        }

        let remainingTopics = ['Habilidades', 'Projetos', 'Contato', 'Currículo'];

        function appendContinueOptions() {
            const existingOptions = document.querySelector('.chat-inline-options');
            if (existingOptions) existingOptions.remove();

            // Se não houver mais tópicos
            if (remainingTopics.length === 0) {
                setTimeout(() => {
                    appendMessage('Você já conheceu todos os principais pontos do meu portfólio! Muito obrigada pela visita. Fique à vontade para explorar a página. 😊', 'ai');
                }, 500);
                return;
            }

            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'chat-inline-options';
            optionsContainer.style.display = 'flex';
            optionsContainer.style.gap = '0.5rem';
            optionsContainer.style.marginTop = '0.5rem';
            optionsContainer.style.flexWrap = 'wrap';

            const btnYes = document.createElement('button');
            btnYes.className = 'chat-suggestion';
            btnYes.textContent = 'Sim, continuar';
            btnYes.onclick = () => {
                appendMessage('Sim, quero saber mais', 'user');
                optionsContainer.remove();
                
                setTimeout(() => {
                    appendMessage('O que você gostaria de explorar agora?', 'ai');
                    showTopicButtons();
                }, 600);
            };

            const btnNo = document.createElement('button');
            btnNo.className = 'chat-suggestion';
            btnNo.textContent = 'Não, obrigado';
            btnNo.onclick = () => {
                appendMessage('Não, obrigado', 'user');
                optionsContainer.remove();
                
                setTimeout(() => {
                    appendMessage('Tudo bem! Se precisar de mais alguma coisa, estarei por aqui. 😊', 'ai');
                }, 600);
            };

            optionsContainer.appendChild(btnYes);
            optionsContainer.appendChild(btnNo);
            chatbotMessages.appendChild(optionsContainer);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function showTopicButtons() {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'chat-inline-options';
            optionsContainer.style.display = 'flex';
            optionsContainer.style.gap = '0.5rem';
            optionsContainer.style.marginTop = '0.5rem';
            optionsContainer.style.flexWrap = 'wrap';

            remainingTopics.forEach(topic => {
                const btn = document.createElement('button');
                btn.className = 'chat-suggestion';
                btn.textContent = topic;
                btn.onclick = () => {
                    chatbotInput.value = topic;
                    optionsContainer.remove();
                    handleChatbotInput();
                };
                optionsContainer.appendChild(btn);
            });

            chatbotMessages.appendChild(optionsContainer);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        if (chatbotSend) {
            chatbotSend.addEventListener('click', handleChatbotInput);
        }
        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleChatbotInput();
            });
        }

        // Handle Suggestions
        const suggestions = document.querySelectorAll('.chat-suggestion');
        suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                chatbotInput.value = btn.textContent;
                handleChatbotInput();
                // Optionally hide suggestions after first use to clear space
                const suggestionsContainer = document.getElementById('chatbotSuggestions');
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                }
            });
        });
    }
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);



    /*=============== PROJECTS DATABASE & MODAL LOGIC ===============*/
    const projects = [
        {
            id: 1,
            title: "GESTÃO DE LOJA",
            role: "FULLSTACK / DATABASE",
            desc: "Sistema completo para gestão de loja com controle de estoque e fluxo de caixa. Desenvolvido com foco em alta performance e segurança.",
            features: [
                "Dashboard administrativo completo",
                "Controle de inventário em tempo real",
                "Geração de relatórios financeiros detalhados"
            ],
            techs: ["Java", "Spring", "PostgreSQL", "HTML/CSS"],
            imgClass: "p-gradient-1",
            imgSrc: "assets/Gestão da loja.jpeg",
            github: "https://github.com/Annascimento8/Gestao-de-loja",
            live: "#"
        },
        {
            id: 2,
            title: "BRASIDENTE",
            role: "PYTHON / GAME DEV",
            desc: "Um jogo estratégico desenvolvido em Python, onde o jogador assume o papel de presidente e toma decisões políticas e econômicas complexas.",
            features: [
                "Sistema de decisões com consequências – As escolhas do jogador afetam a popularidade, a economia e o apoio político.",
                "Mapa explorável de Brasília – O jogador pode explorar o mapa, cumprir missões e interagir com diferentes áreas.",
                "Interação educativa com cidadãos – O jogo inclui diálogos e questionários sobre política e economia para promover o aprendizado."
            ],
            techs: ["Python", "Pygame"],
            imgClass: "p-gradient-2",
            imgSrc: "assets/images/Brasidente.jpeg",
            github: "https://github.com/Camilly-reis/Brasidente",
            live: "#"
        },
        {
            id: 3,
            title: "ESPAÇO RENASCER",
            role: "NODE.JS / MYSQL",
            shortDesc: "Plataforma web de utilidade pública que une tecnologia e apoio humanizado com foco em serviços gratuitos.",
            desc: "O objetivo central do Espaço Renascer é unir tecnologia e apoio humanizado. O site serve como uma interface informativa e de utilidade pública, oferecendo canais de emergência e gestão de serviços gratuitos.",
            features: [
                " Cadastro de Usuárias (Create) integrado com a API",
                " Listagem Dinâmica e Atualização em Tempo Real (Read)",
                " Edição de Dados via Prompt nativo (Update)",
                " Exclusão com Confirmação de Segurança (Delete)",
                " Design acolhedor com tons pastéis e responsividade"
            ],
            techs: ["HTML5", "CSS3", "JavaScript", "Node.js", "Express", "MySQL"],
            imgClass: "p-gradient-3",
            imgSrc: "assets/images/extensãoweb.png",
            github: "https://github.com/Annascimento8/Projeto-de-Extensao-Web",
            live: "#"
        },
        {
            id: 4,
            title: "FEEDBACKHUB",
            role: "NODE.JS / EXPRESS.JS 5",
            shortDesc: "O FeedbackHub é um sistema que permite aos usuários enviarem suas opiniões de forma rápida e simples. Demonstra conceitos de CRUD e arquitetura cliente-servidor.",
            desc: "O FeedbackHub é um sistema que permite aos usuários enviarem suas opiniões de forma rápida e simples.",
            features: [
                " Enviar feedbacks com nome e comentário",
                " Listar todos os feedbacks recebidos",
                " Remover feedbacks individualmente",
                " Contador de feedbacks em tempo real",
                " Layout responsivo",
                " Página 'Sobre' com informações do projeto"
            ],
            techs: ["Node.js", "Express.js 5", "HTML5", "CSS3", "JavaScript", "Google Fonts"],
            imgClass: "p-gradient-4",
            imgSrc: "assets/images/feedback.png",
            github: "https://github.com/Annascimento8/Sistema-de-Coleta-de-Feedbacks",
            live: "#"
        },
        {
            id: 5,
            title: "CALCULADORA DE ABASTECIMENTO",
            role: "HTML / CSS / JS",
            desc: "Uma aplicação web simples que calcula o valor total de um abastecimento com base no tipo de combustível e na quantidade de litros informada.",
            features: [
                "Cálculo automático em tempo real",
                "Exibição formatada em Real (R$)",
                "Validação dos dados inseridos"
            ],
            techs: ["HTML5", "CSS3", "JavaScript"],
            imgClass: "p-gradient-5",
            imgSrc: "assets/images/calculadora.png",
            bgSize: "140%",
            github: "https://github.com/Annascimento8/Calculadora-de-Abastecimento",
            live: "#"
        },
        {
            id: 6,
            title: "DOM: CONCEITOS BÁSICOS",
            role: "HTML / CSS / JS",
            desc: "Aplicação interativa desenvolvida para praticar conceitos fundamentais de manipulação do DOM, eventos e atualização dinâmica da interface.",
            features: [
                "Contador de cliques interativo",
                "Texto dinâmico com contador de caracteres",
                "Inserção dinâmica de novos elementos"
            ],
            techs: ["HTML5", "CSS3", "JavaScript"],
            imgClass: "p-gradient-6",
            imgSrc: "assets/images/Dom.png",
            github: "https://github.com/Annascimento8/Manipulacao-de-DOM",
            live: "#"
        },
        {
            id: 7,
            title: "SISTEMA GRASP",
            role: "JAVA / ARCHITECTURE",
            desc: "Sistema acadêmico modelado com fortes princípios arquiteturais GRASP (General Responsibility Assignment Software Patterns) para máxima coesão e baixo acoplamento.",
            features: [
                "Padrões de projeto bem definidos",
                "Separação clara de responsabilidades",
                "Fácil manutenção e escalabilidade"
            ],
            techs: ["Java", "UML", "OOP"],
            imgClass: "p-gradient-7",
            imgSrc: "assets/images/sistemas.png",
            github: "https://github.com/Annascimento8/Atividade_GRASP",
            live: "#"
        },
        {
            id: 8,
            title: "CONEXÃO MYSQL COM JAVA",
            role: "JAVA / MYSQL / JDBC",
            desc: "Projeto desenvolvido no MySQL com integração ao Java, utilizando JDBC para comunicação. Demonstra de forma prática como conectar, testar e listar dados de um banco de dados por meio de um programa Java.",
            features: [
                "Criação e estruturação do banco de dados no MySQL",
                "Configuração de conexão Java-MySQL usando JDBC Driver",
                "Teste e verificação do funcionamento do vínculo",
                "Listagem e exibição dos dados armazenados no banco"
            ],
            techs: ["Java", "MySQL", "JDBC", "Git"],
            imgClass: "p-gradient-8",
            imgSrc: "assets/images/image.png",
            bgPosition: "center",
            github: "https://github.com/Annascimento8/AtividadeEcommerce",
            live: "#"
        }
    ];

    const projectsGrid = document.querySelector('.projects-grid');
    const modal = document.getElementById('projectModal');

    const techIconMap = {
        'java': 'bxl-java',
        'spring': 'bxl-spring-boot',
        'postgresql': 'bxl-postgresql',
        'html/css': 'bxl-html5',
        'html5': 'bxl-html5',
        'css3': 'bxl-css3',
        'python': 'bxl-python',
        'pygame': 'bx-joystick',
        'javascript': 'bxl-javascript',
        'vanilla js': 'bxl-javascript',
        'node.js': 'bxl-nodejs',
        'express': 'bx-server',
        'express.js': 'bx-server',
        'express.js 5': 'bx-server',
        'mongodb': 'bxl-mongodb',
        'html5 + css3': 'bx-code-alt',
        'google fonts': 'bxl-google',
        'react': 'bxl-react',
        'jwt': 'bx-key',
        'chrome api': 'bxl-chrome',
        'dom api': 'bx-code-block',
        'css variables': 'bxl-css3',
        'uml': 'bx-sitemap',
        'oop': 'bx-cube-alt',
        'jsp/servlet': 'bx-server',
        'mysql': 'bx-data'
    };

    function getTechIconsHTML(techs) {
        return techs.map(t => {
            const cls = techIconMap[t.toLowerCase()] || 'bx-code-alt';
            return `<i class='bx ${cls}' title='${t}'></i>`;
        }).join('');
    }

    // Render Cards
    if (projectsGrid) {
        projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card hover-this';

            const bgSize = proj.bgSize || 'cover';
            const bgPos = proj.bgPosition || 'top center';
            const bgStyle = proj.imgSrc ? `style="background-image: url('${proj.imgSrc}'); background-size: ${bgSize}; background-position: ${bgPos};"` : '';

            card.innerHTML = `
                <div class="project-card__image ${proj.imgClass}" ${bgStyle}></div>
                <div class="project-card__content">
                    <h3 class="project-card__title">${proj.title}</h3>
                    <p class="project-card__desc">${proj.shortDesc || proj.desc}</p>
                    <div class="project-card__footer">
                        <div class="project-card__techs">
                            ${proj.role}
                        </div>
                        <div class="project-card__icons">
                            ${getTechIconsHTML(proj.techs)}
                            <a href="${proj.github}" target="_blank"><i class='bx bxl-github'></i></a>
                        </div>
                    </div>
                </div>
            `;

            // Open Modal on click
            card.addEventListener('click', () => openModal(proj));
            projectsGrid.appendChild(card);
        });
    }

    // Modal Logic
    const closeBtn = document.querySelector('.modal__close');

    function openModal(proj) {
        document.getElementById('modalTitle').textContent = proj.title;

        const modalImg = document.getElementById('modalImage');
        modalImg.className = `modal__image ${proj.imgClass}`;
        if (proj.imgSrc) {
            modalImg.style.backgroundImage = `url('${proj.imgSrc}')`;
            modalImg.style.backgroundSize = proj.bgSize || 'cover';
            modalImg.style.backgroundPosition = proj.bgPosition || 'top center';
        } else {
            modalImg.style.backgroundImage = '';
        }

        document.getElementById('modalAbout').innerHTML = proj.desc;

        // Badges
        const roles = proj.role.split('/').map(r => r.trim());
        document.getElementById('modalBadges').innerHTML = roles.map(r => `<span class="modal__badge">${r}</span>`).join('');

        // Features
        document.getElementById('modalFeatures').innerHTML = proj.features.map(f => `<li>${f}</li>`).join('');

        // Techs
        document.getElementById('modalTechs').innerHTML = proj.techs.map(t => `<span class="modal__tech-tag">${t}</span>`).join('');

        // Links
        document.getElementById('modalGithub').href = proj.github;
        document.getElementById('modalLive').href = proj.live;

        modal.showModal();
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        modal.classList.remove('is-open');
        setTimeout(() => {
            modal.close();
            document.body.style.overflow = '';
        }, 300); // match CSS transition
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            const dialogDimensions = modal.getBoundingClientRect()
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                closeModal();
            }
        });
    }



    /*=============== GSAP ANIMATIONS ===============*/

    // 1. Text Reveal Animation (Hero & Sections)
    const revealTexts = document.querySelectorAll('.text-reveal');

    revealTexts.forEach((text) => {
        // Split text by lines/words conceptually (simple fade/slide up for now)
        gsap.from(text, {
            scrollTrigger: {
                trigger: text,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 80,
            opacity: 0,
            duration: 1.5,
            ease: "expo.out"
        });
    });

    // 2. Fade In Elements
    const fadeElements = document.querySelectorAll('.fade-in');

    fadeElements.forEach((el) => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: "power3.out"
        });
    });

    // 3. Hero Parallax Effect
    gsap.to(".hero__title", {
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        },
        y: 150,
        opacity: 0.5
    });

    // 4. Marquee Speed Up on Scroll (Optional advanced touch)
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".marquee-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1
        }
    });

    tl.to(".marquee-text__inner", {
        xPercent: -20, // Move it faster when scrolling
        ease: "none"
    });

}

// Check if DOM is already loaded or wait for it
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Initialize Global Particles Background
if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 70, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": ["#8c1c31", "#ffffff", "#ff003c"] },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.8, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.3, "sync": false } },
            "size": { "value": 4, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#8c1c31", "opacity": 0.6, "width": 1.5 },
            "move": { "enable": true, "speed": 1.5, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "window",
            "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": { "distance": 150, "line_linked": { "opacity": 0.8, "color": "#ff003c" } },
                "push": { "particles_nb": 3 }
            }
        },
        "retina_detect": true
    });
}

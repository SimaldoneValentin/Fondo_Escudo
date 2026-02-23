// State Management
let currentUser = null;
let currentScreen = 'login';


// Screen Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Update navigation
    updateNavigation(screenId);
}

function updateNavigation(screenId) {
    // Update bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navMap = {
        'homeScreen': 0,
        'plansScreen': 1,
        'paymentsScreen': 2,
        'profileScreen': 3
    };
    
    if (navMap.hasOwnProperty(screenId)) {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[navMap[screenId]]) {
            navItems[navMap[screenId]].classList.add('active');
        }
    }
}

// Login Functions
function showLogin() {
    showScreen('loginScreen');
}

function showRegister() {
    showScreen('registerScreen');
}

function showHome() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('homeScreen');
    updatePaymentDates();
}

function updatePaymentDates() {
    if (!currentUser) return;
    
    // Calcular próxima fecha de vencimiento (día 15 de cada mes)
    const now = new Date();
    let nextPayment = new Date(now.getFullYear(), now.getMonth(), 15);
    
    // Si ya pasó el día 15, ir al próximo mes
    if (now.getDate() >= 15) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    
    // Si el usuario tiene una fecha de registro, calcular desde ahí
    if (currentUser.registrationDate) {
        const regDate = new Date(currentUser.registrationDate);
        const dayOfMonth = regDate.getDate();
        nextPayment = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
        if (now.getDate() >= dayOfMonth) {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        }
    }
    
    // Calcular días restantes
    const diffTime = nextPayment.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Formatear fecha
    const day = nextPayment.getDate();
    const month = nextPayment.getMonth() + 1;
    const year = nextPayment.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    // Actualizar elementos en la UI
    const dateEl = document.getElementById('nextPaymentDate');
    const daysEl = document.getElementById('daysRemaining');
    
    if (dateEl) {
        dateEl.textContent = formattedDate;
    }
    
    if (daysEl) {
        if (diffDays <= 0) {
            daysEl.textContent = 'Vencido';
            daysEl.style.color = '#ef4444';
        } else if (diffDays === 1) {
            daysEl.textContent = '1 día';
            daysEl.style.color = '#f59e0b';
        } else if (diffDays <= 5) {
            daysEl.textContent = `${diffDays} días`;
            daysEl.style.color = '#f59e0b';
        } else {
            daysEl.textContent = `${diffDays} días`;
            daysEl.style.color = '#22c55e';
        }
    }
    
    // Guardar fecha de próximo pago en el usuario
    currentUser.nextPaymentDate = nextPayment.toISOString();
}

function showPlans() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('plansScreen');
    updateCurrentPlanDisplay();
    updatePendingPlanUI();
    hideCurrentPlanFromAvailable();
}

function updateCurrentPlanDisplay() {
    // Obtener plan actual del usuario
    let planKey = 'plus';
    if (currentUser && currentUser.plan) {
        const planName = currentUser.plan.toLowerCase();
        if (planName.includes('base') || planName.includes('normal')) {
            planKey = 'base';
        } else if (planName.includes('pro')) {
            planKey = 'pro';
        }
    }
    
    const planData = PLANS_DATA[planKey];
    
    // Actualizar título del plan
    const titleEl = document.getElementById('currentPlanTitle');
    if (titleEl) {
        titleEl.textContent = planData.emoji + ' ' + planData.title.replace('PLAN ', 'Plan ');
    }
    
    // Actualizar precio
    const priceEl = document.getElementById('currentPlanPrice');
    if (priceEl) {
        priceEl.innerHTML = planData.cost + '<span>/mes</span>';
    }
    
    // Actualizar características
    const featuresEl = document.getElementById('currentPlanFeatures');
    if (featuresEl) {
        featuresEl.innerHTML = `
            <li><i class="fas fa-check"></i> ${planData.coverage}</li>
            <li><i class="fas fa-check"></i> Permanencia mínima ${planData.permanence}</li>
            <li><i class="fas fa-check"></i> ${planData.benefits}</li>
        `;
    }
}

function showPayments() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('paymentsScreen');
}

function showServiceStatus() {
    if (!currentUser) {
        showLogin();
        return;
    }
    openPlanStatusModal();
}

function showMultas() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('multasScreen');
    loadMultas();
}

function loadMultas() {
    // Cargar multas del usuario desde localStorage o mostrar vacío
    const multasContainer = document.getElementById('multasList');
    if (!multasContainer) return;
    
    const multas = currentUser.multas || [];
    
    if (multas.length === 0) {
        multasContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Sin multas</h4>
                <p>No tenés multas registradas</p>
            </div>
        `;
    } else {
        multasContainer.innerHTML = multas.map(multa => `
            <div class="multa-card ${multa.pagada ? 'pagada' : 'pendiente'}">
                <div class="multa-icon">
                    <i class="fas fa-file-invoice-dollar"></i>
                </div>
                <div class="multa-info">
                    <h4>${multa.descripcion}</h4>
                    <p class="multa-fecha">${multa.fecha}</p>
                </div>
                <div class="multa-monto">
                    <span class="monto">$${multa.monto.toLocaleString('es-AR')}</span>
                    <span class="estado ${multa.pagada ? 'pagada' : 'pendiente'}">${multa.pagada ? 'Pagada' : 'Pendiente'}</span>
                </div>
            </div>
        `).join('');
    }
}

// ==================== PLAN STATUS MODAL ====================
const PLANS_DATA = {
    base: {
        emoji: '🟢',
        title: 'PLAN BASE',
        description: 'El plan de entrada para quienes buscan protección esencial al menor costo.',
        cost: '$10.000',
        coverage: 'Del 20% al 45%',
        permanence: '90 días (3 meses)',
        benefits: 'Estándar',
        ideal: 'Personas que inician y quieren probar el sistema.',
        class: 'plan-base'
    },
    plus: {
        emoji: '🔵',
        title: 'PLAN PLUS',
        description: 'El equilibrio perfecto entre costo y velocidad de cobertura. El más recomendado.',
        cost: '$15.000',
        coverage: 'Del 50% al 65%',
        permanence: '60 días (2 meses)',
        benefits: 'Intermedio - Cobertura Ampliada',
        ideal: 'Usuarios que buscan seguridad sólida en poco tiempo.',
        class: 'plan-plus'
    },
    pro: {
        emoji: '🟡',
        title: 'PLAN PRO',
        description: 'Máxima potencia. Diseñado para cubrir casi la totalidad de cualquier imprevisto.',
        cost: '$20.000',
        coverage: 'Del 70% al 90%',
        permanence: '60 días (2 meses)',
        benefits: 'Altos (Cobertura General Superior)',
        ideal: 'Quienes no quieren correr riesgos y buscan la mejor protección.',
        class: 'plan-pro'
    }
};

function openPlanStatusModal() {
    const modal = document.getElementById('planStatusModal');
    if (!modal) return;
    
    // Obtener plan del usuario (por defecto 'plus')
    let userPlan = 'plus';
    if (currentUser && currentUser.plan) {
        const planName = currentUser.plan.toLowerCase();
        if (planName.includes('base') || planName.includes('normal')) {
            userPlan = 'base';
        } else if (planName.includes('pro')) {
            userPlan = 'pro';
        } else {
            userPlan = 'plus';
        }
    }
    
    const planData = PLANS_DATA[userPlan];
    
    // Actualizar badge
    const badge = document.getElementById('planBadge');
    if (badge) {
        badge.className = 'plan-status-badge ' + planData.class;
        badge.querySelector('.plan-emoji').textContent = planData.emoji;
        badge.querySelector('.plan-title').textContent = planData.title;
    }
    
    // Actualizar descripción
    const desc = document.getElementById('planDescription');
    if (desc) desc.textContent = planData.description;
    
    // Actualizar detalles
    const cost = document.getElementById('planCost');
    if (cost) cost.textContent = planData.cost;
    
    const coverage = document.getElementById('planCoverage');
    if (coverage) coverage.textContent = planData.coverage;
    
    const permanence = document.getElementById('planPermanence');
    if (permanence) permanence.textContent = planData.permanence;
    
    const benefits = document.getElementById('planBenefits');
    if (benefits) benefits.textContent = planData.benefits;
    
    const ideal = document.getElementById('planIdeal');
    if (ideal) ideal.textContent = planData.ideal;
    
    modal.classList.add('active');
}

function closePlanStatusModal() {
    const modal = document.getElementById('planStatusModal');
    if (modal) modal.classList.remove('active');
}

// ==================== CAMBIO DE PLAN ====================
let pendingPlanChange = null;

function selectPlan(planKey) {
    // Obtener plan actual del usuario
    let currentPlanKey = 'plus';
    if (currentUser && currentUser.plan) {
        const planName = currentUser.plan.toLowerCase();
        if (planName.includes('base') || planName.includes('normal')) {
            currentPlanKey = 'base';
        } else if (planName.includes('pro')) {
            currentPlanKey = 'pro';
        }
    }
    
    // Si es el mismo plan, no hacer nada
    if (planKey === currentPlanKey) {
        showSuccessMessage('Ya tenés este plan activo');
        return;
    }
    
    // Guardar plan pendiente
    pendingPlanChange = planKey;
    
    // Mostrar modal de confirmación
    openChangePlanModal(currentPlanKey, planKey);
}

function openChangePlanModal(currentPlanKey, newPlanKey) {
    const modal = document.getElementById('changePlanModal');
    if (!modal) return;
    
    const currentPlan = PLANS_DATA[currentPlanKey];
    const newPlan = PLANS_DATA[newPlanKey];
    
    // Actualizar nombres de planes
    const currentPlanName = document.getElementById('currentPlanName');
    if (currentPlanName) {
        currentPlanName.textContent = currentPlan.emoji + ' ' + currentPlan.title;
    }
    
    const newPlanName = document.getElementById('newPlanName');
    if (newPlanName) {
        newPlanName.textContent = newPlan.emoji + ' ' + newPlan.title;
    }
    
    // Calcular fecha de renovación (próximo mes, día 15)
    const renewalDate = document.getElementById('renewalDate');
    if (renewalDate) {
        const nextRenewal = getNextRenewalDate();
        renewalDate.textContent = nextRenewal;
    }
    
    modal.classList.add('active');
}

function getNextRenewalDate() {
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Próxima renovación: día 15 del próximo mes
    let month = now.getMonth();
    let year = now.getFullYear();
    
    // Si ya pasó el día 15, ir al próximo mes
    if (now.getDate() >= 15) {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
    }
    
    return `15 de ${months[month]}, ${year}`;
}

function closeChangePlanModal() {
    const modal = document.getElementById('changePlanModal');
    if (modal) modal.classList.remove('active');
    pendingPlanChange = null;
}

function confirmPlanChange() {
    if (!pendingPlanChange || !currentUser) {
        closeChangePlanModal();
        return;
    }
    
    const newPlan = PLANS_DATA[pendingPlanChange];
    
    // Guardar cambio pendiente en el usuario
    currentUser.pendingPlan = {
        plan: pendingPlanChange,
        planName: newPlan.title,
        scheduledDate: getNextRenewalDate(),
        requestedAt: new Date().toISOString()
    };
    
    // Actualizar en localStorage
    if (window.apiService && window.apiService.saveDemoUser) {
        window.apiService.saveDemoUser(currentUser);
    }
    
    closeChangePlanModal();
    
    // Mostrar mensaje de éxito
    showSuccessMessage(`¡Listo! Tu cambio a ${newPlan.title} se aplicará el ${currentUser.pendingPlan.scheduledDate}`);
    
    // Actualizar UI para mostrar el cambio pendiente
    updatePendingPlanUI();
}

function updatePendingPlanUI() {
    // Actualizar la sección de plan actual si hay un cambio pendiente
    if (currentUser && currentUser.pendingPlan) {
        const planCard = document.querySelector('.current-plan .plan-card');
        if (planCard) {
            // Remover badge anterior si existe
            const existingBadge = planCard.querySelector('.pending-plan-badge');
            if (existingBadge) existingBadge.remove();
            
            // Agregar nuevo badge
            const badge = document.createElement('div');
            badge.className = 'pending-plan-badge';
            badge.innerHTML = `<i class="fas fa-clock"></i> Cambio a ${currentUser.pendingPlan.planName} programado para ${currentUser.pendingPlan.scheduledDate}`;
            planCard.appendChild(badge);
        }
    }
}

function hideCurrentPlanFromAvailable() {
    // Obtener plan actual del usuario
    let currentPlanKey = 'plus';
    if (currentUser && currentUser.plan) {
        const planName = currentUser.plan.toLowerCase();
        if (planName.includes('base') || planName.includes('normal')) {
            currentPlanKey = 'base';
        } else if (planName.includes('pro')) {
            currentPlanKey = 'pro';
        }
    }
    
    // Mostrar todos los planes primero
    const planCards = {
        base: document.getElementById('planCardBase'),
        plus: document.getElementById('planCardPlus'),
        pro: document.getElementById('planCardPro')
    };
    
    Object.values(planCards).forEach(card => {
        if (card) card.style.display = 'block';
    });
    
    // Ocultar el plan actual de los disponibles
    if (planCards[currentPlanKey]) {
        planCards[currentPlanKey].style.display = 'none';
    }
}

function showProfile() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('profileScreen');
    updateUserInterface();
}

// ==================== GOOGLE OAUTH ====================
// Tu Client ID de Google OAuth
const GOOGLE_CLIENT_ID = '596128067456-tt2hreel7pgvs0cdtbjr345lgsumfvio.apps.googleusercontent.com';

// Inicializar Google Identity Services y renderizar botones
function initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse
        });

        // Renderizar botón de LOGIN
        const loginBtn = document.getElementById("google-login-btn");
        if (loginBtn) {
            google.accounts.id.renderButton(loginBtn, {
                theme: "filled_blue",
                size: "large",
                text: "continue_with",
                shape: "pill",
                width: 280
            });
        }

        // Renderizar botón de REGISTRO
        const registerBtn = document.getElementById("google-register-btn");
        if (registerBtn) {
            google.accounts.id.renderButton(registerBtn, {
                theme: "outline",
                size: "large",
                text: "signup_with",
                shape: "pill",
                width: 280
            });
        }
    } else {
        // Reintentar en 500ms si la librería no cargó
        setTimeout(initGoogleAuth, 500);
    }
}

// Callback cuando Google devuelve las credenciales
async function handleGoogleResponse(response) {
    try {
        showLoading();
        
        // Decodificar el token JWT de Google
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        console.log("Datos recibidos de Google:", payload);

        const googleUser = {
            googleId: payload.sub,
            email: payload.email,
            firstName: payload.given_name || '',
            lastName: payload.family_name || '',
            photoUrl: payload.picture || null
        };
        
        // Buscar si ya existe en nuestra base de datos
        let existingUser = window.apiService.findDemoUserByEmail(googleUser.email);
        
        if (existingUser && existingUser.dni) {
            // Usuario existente con datos completos - login directo
            existingUser.lastLogin = new Date().toISOString();
            window.apiService.saveDemoUser(existingUser);
            window.apiService.setToken('token-google-' + Date.now());
            
            currentUser = existingUser;
            updateUserInterface();
            showHome();
            hideLoading();
            showSuccessMessage(`¡Hola ${existingUser.firstName}! Bienvenido de nuevo.`);
        } else {
            // Usuario nuevo o sin datos completos - pedir que complete el modal
            hideLoading();
            openGoogleDataModal({
                ...googleUser,
                isNewRegistration: !existingUser
            });
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error con Google:', error);
        showErrorMessage('Error al procesar login con Google');
    }
}

// Modal para completar datos de Google
function openGoogleDataModal(googleUser) {
    const modal = document.getElementById('googleDataModal');
    if (!modal) return;
    
    // Prellenar campos si hay datos
    document.getElementById('googleEmail').value = googleUser.email || '';
    document.getElementById('googleId').value = googleUser.googleId || '';
    
    if (googleUser.firstName) {
        document.getElementById('googleFirstName').value = googleUser.firstName;
    }
    if (googleUser.lastName) {
        document.getElementById('googleLastName').value = googleUser.lastName;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGoogleDataModal() {
    const modal = document.getElementById('googleDataModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('googleDataForm').reset();
    }
}

async function handleGoogleDataSubmit(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('googleFirstName').value.trim();
    const lastName = document.getElementById('googleLastName').value.trim();
    const dni = document.getElementById('googleDni').value.trim();
    const phone = document.getElementById('googlePhone').value.trim();
    const gender = document.getElementById('googleGender').value;
    const email = document.getElementById('googleEmail').value;
    const googleId = document.getElementById('googleId').value;
    
    if (!firstName || !lastName || !dni || !gender) {
        showErrorMessage('Completá todos los campos obligatorios');
        return;
    }
    
    // Verificar si el DNI ya existe
    const users = window.apiService.getDemoUsers();
    const dniExists = users.some(u => u.dni === dni);
    if (dniExists) {
        showErrorMessage('Este DNI ya está registrado en el sistema');
        return;
    }
    
    try {
        showLoading();
        
        const newUser = {
            id: Date.now(),
            uid: 'google-uid-' + Date.now(),
            googleId: googleId,
            email: email,
            firstName: firstName,
            lastName: lastName,
            dni: dni,
            phone: phone || null,
            gender: gender,
            plan: 'Plan Normal',
            registeredWith: 'google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Guardar usuario
        window.apiService.saveDemoUser(newUser);
        window.apiService.setToken('demo-token-google-' + Date.now());
        
        currentUser = newUser;
        closeGoogleDataModal();
        updateUserInterface();
        showHome();
        hideLoading();
        showSuccessMessage('¡Cuenta creada exitosamente!');
        
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al crear cuenta');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showErrorMessage('Por favor, completa todos los campos');
        return;
    }
    
    try {
        showLoading();
        
        const response = await window.apiService.login(email, password);
        
        currentUser = response.user;
        updateUserInterface();
        showHome();
        hideLoading();
        showSuccessMessage('¡Inicio de sesión exitoso!');
        
        document.getElementById('loginForm').reset();
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al iniciar sesión');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const dni = document.getElementById('dni').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('phone').value;
    const gender = document.getElementById('gender').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!firstName || !lastName || !dni || !email || !gender || !password || !confirmPassword) {
        showErrorMessage('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showErrorMessage('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        showLoading();
        
        const userData = {
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
            dni: dni,
            phone: phone,
            gender: gender
        };
        
        const response = await window.apiService.register(userData);
        
        currentUser = response.user;
        updateUserInterface();
        showHome();
        hideLoading();
        showSuccessMessage('¡Cuenta creada exitosamente!');
        
        document.getElementById('registerForm').reset();
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al crear cuenta');
    }
}

async function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        await window.apiService.logout();
        currentUser = null;
        showLogin();
        showSuccessMessage('Sesión cerrada correctamente');
    }
}

// Update UI with user data
function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user name in home - usar firstName y lastName
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const fullName = currentUser.firstName && currentUser.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : currentUser.name || 'Usuario';
        userNameElement.textContent = fullName;
    }
    
    // Update user name in profile
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) {
        const fullName = currentUser.firstName && currentUser.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : currentUser.name || 'Usuario';
        profileNameElement.textContent = fullName;
    }

    const profileEmailElement = document.getElementById('profileEmail');
    if (profileEmailElement) {
        profileEmailElement.textContent = currentUser.email || '-';
    }

    const profileFullNameElement = document.getElementById('profileFullName');
    if (profileFullNameElement) {
        const fullName = currentUser.firstName && currentUser.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : currentUser.name || '-';
        profileFullNameElement.textContent = fullName;
    }

    const profileDniElement = document.getElementById('profileDni');
    if (profileDniElement) {
        profileDniElement.textContent = currentUser.dni || '-';
    }

    const profilePhoneElement = document.getElementById('profilePhone');
    if (profilePhoneElement) {
        profilePhoneElement.textContent = currentUser.phone || '-';
    }

    const profileGenderElement = document.getElementById('profileGender');
    if (profileGenderElement) {
        profileGenderElement.textContent = currentUser.gender || '-';
    }
    
    // Update plan information
    updatePlanInformation();
}

function openEditProfileModal() {
    if (!currentUser) {
        showLogin();
        return;
    }

    const modal = document.getElementById('editProfileModal');
    if (!modal) return;

    const fullName = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser.name || '';

    const editFullName = document.getElementById('editFullName');
    const editPhone = document.getElementById('editPhone');
    const editGender = document.getElementById('editGender');
    const editDni = document.getElementById('editDni');

    if (editFullName) editFullName.value = fullName;
    if (editPhone) editPhone.value = currentUser.phone || '';
    if (editGender) editGender.value = currentUser.gender || '';
    if (editDni) editDni.value = currentUser.dni || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

let selectedHelpType = null;

function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    selectedHelpType = null;

    const formSection = document.getElementById('helpFormSection');
    const helpSubject = document.getElementById('helpSubject');
    const helpMessage = document.getElementById('helpMessage');
    if (formSection) formSection.style.display = 'none';
    if (helpSubject) helpSubject.value = '';
    if (helpMessage) helpMessage.value = '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function selectHelpType(type) {
    selectedHelpType = type;
    const formSection = document.getElementById('helpFormSection');
    const contactPanel = document.getElementById('contactPanel');
    const helpSubject = document.getElementById('helpSubject');

    // Ocultar panel de contacto cuando se selecciona ticket
    if (contactPanel) {
        contactPanel.style.display = 'none';
    }

    if (formSection) {
        formSection.style.display = 'block';
    }

    if (helpSubject) {
        if (type === 'dni') helpSubject.value = 'Solicitud de corrección de DNI';
        if (type === 'problema') helpSubject.value = 'Reporte de problema';
    }
}

function showContactPanel() {
    const formSection = document.getElementById('helpFormSection');
    const contactPanel = document.getElementById('contactPanel');
    
    // Ocultar formulario de ticket
    if (formSection) {
        formSection.style.display = 'none';
    }
    
    // Mostrar panel de contacto
    if (contactPanel) {
        contactPanel.style.display = 'block';
    }
}

function generateTicketCode() {
    const part = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ts = Date.now().toString().slice(-6);
    return `FE-${ts}-${part}`;
}

async function submitHelpTicket() {
    if (!currentUser) {
        showLogin();
        return;
    }

    if (!selectedHelpType) {
        showErrorMessage('Seleccioná una opción de ayuda');
        return;
    }

    const subjectEl = document.getElementById('helpSubject');
    const messageEl = document.getElementById('helpMessage');
    const subject = subjectEl ? subjectEl.value.trim() : '';
    const message = messageEl ? messageEl.value.trim() : '';

    if (!subject || !message) {
        showErrorMessage('Completá asunto y detalle');
        return;
    }

    const code = generateTicketCode();

    const fullName = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser.name || 'Usuario';

    const ticketData = {
        code,
        type: selectedHelpType,
        subject,
        message,
        userId: currentUser.id || currentUser.uid,
        user: {
            email: currentUser.email || null,
            fullName,
            dni: currentUser.dni || null,
            phone: currentUser.phone || null,
            gender: currentUser.gender || null,
            plan: currentUser.plan || null
        }
    };

    try {
        showLoading();
        
        // Enviar ticket usando el api-service (guarda en BD o localStorage según modo)
        const response = await window.apiService.createTicket(ticketData);
        
        hideLoading();
        closeHelpModal();
        
        if (response.success) {
            showSuccessMessage(`¡Ticket enviado! Código: ${code}`);
            console.log('📩 Nuevo ticket de soporte:', response.ticket || ticketData);
        } else {
            showErrorMessage('Error al enviar el ticket');
        }
    } catch (error) {
        hideLoading();
        console.error('Error enviando ticket:', error);
        showErrorMessage('Error al enviar el ticket. Intentá de nuevo.');
    }
}

// ==================== NOTIFICACIONES ====================
function openNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        // Cargar preferencias guardadas
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        
        const pushEl = document.getElementById('pushNotifications');
        const emailEl = document.getElementById('emailNotifications');
        const paymentEl = document.getElementById('paymentAlerts');
        const promoEl = document.getElementById('promoNotifications');
        
        if (pushEl) pushEl.checked = settings.push !== false;
        if (emailEl) emailEl.checked = settings.email !== false;
        if (paymentEl) paymentEl.checked = settings.payment !== false;
        if (promoEl) promoEl.checked = settings.promo === true;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function saveNotificationSettings() {
    const settings = {
        push: document.getElementById('pushNotifications')?.checked ?? true,
        email: document.getElementById('emailNotifications')?.checked ?? true,
        payment: document.getElementById('paymentAlerts')?.checked ?? true,
        promo: document.getElementById('promoNotifications')?.checked ?? false
    };
    
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    closeNotificationsModal();
    showSuccessMessage('Preferencias guardadas');
}

// ==================== SEGURIDAD ====================
function openSecurityModal() {
    const modal = document.getElementById('securityModal');
    if (modal) {
        // Actualizar historial de accesos
        updateAccessHistory();
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSecurityModal() {
    const modal = document.getElementById('securityModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Limpiar formulario de contraseña
        document.getElementById('changePasswordForm')?.reset();
    }
}

function updateAccessHistory() {
    const timeEl = document.getElementById('lastLoginTime');
    const locationEl = document.getElementById('lastLoginLocation');
    
    if (currentUser && currentUser.lastLogin) {
        const lastLogin = new Date(currentUser.lastLogin);
        const now = new Date();
        const isToday = lastLogin.toDateString() === now.toDateString();
        
        const hours = lastLogin.getHours().toString().padStart(2, '0');
        const minutes = lastLogin.getMinutes().toString().padStart(2, '0');
        
        if (timeEl) {
            timeEl.textContent = isToday 
                ? `Último inicio: Hoy, ${hours}:${minutes} hs`
                : `Último inicio: ${lastLogin.toLocaleDateString('es-AR')}, ${hours}:${minutes} hs`;
        }
    } else {
        if (timeEl) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeEl.textContent = `Último inicio: Hoy, ${hours}:${minutes} hs`;
        }
    }
    
    // Simular ubicación (en producción vendría del servidor)
    if (locationEl) {
        locationEl.textContent = 'Desde Argentina';
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showErrorMessage('Completá todos los campos');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showErrorMessage('Las contraseñas nuevas no coinciden');
        return;
    }
    
    if (newPassword.length < 6) {
        showErrorMessage('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // En modo demo, verificar contra localStorage
    if (window.apiService.demoMode) {
        if (currentUser.registeredWith === 'google') {
            showErrorMessage('Los usuarios de Google no pueden cambiar contraseña aquí');
            return;
        }
        
        if (currentUser.password !== currentPassword) {
            showErrorMessage('Contraseña actual incorrecta');
            return;
        }
        
        // Actualizar contraseña
        currentUser.password = newPassword;
        window.apiService.saveDemoUser(currentUser);
        
        document.getElementById('changePasswordForm').reset();
        showSuccessMessage('¡Contraseña actualizada!');
    } else {
        // En producción, llamar al backend
        try {
            showLoading();
            await window.apiService.changePassword(currentPassword, newPassword);
            hideLoading();
            document.getElementById('changePasswordForm').reset();
            showSuccessMessage('¡Contraseña actualizada!');
        } catch (error) {
            hideLoading();
            showErrorMessage(error.message || 'Error al cambiar contraseña');
        }
    }
}

function showPrivacyPolicy() {
    // Abrir políticas de privacidad (puede ser una URL o modal)
    alert('Políticas de Privacidad\n\nFondo Escudo protege tus datos personales y bancarios conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.\n\nTus datos son utilizados únicamente para brindarte el servicio contratado y nunca serán compartidos con terceros sin tu consentimiento.\n\nPara más información, contactanos a soporte@fondoescudo.com');
}

function showTermsOfService() {
    // Abrir términos y condiciones
    alert('Términos y Condiciones\n\nAl utilizar Fondo Escudo aceptás las condiciones del servicio.\n\nEl servicio brinda cobertura según el plan contratado.\n\nPara consultas sobre términos específicos, contactanos a soporte@fondoescudo.com');
}

function updatePlanInformation() {
    if (!currentUser) return;
    
    // Update plan badges and info throughout the app
    const planElements = document.querySelectorAll('.plan-name');
    planElements.forEach(element => {
        element.textContent = currentUser.plan || 'Plan Normal';
    });
}

// Plan Management
function selectPlan(planName, price) {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    if (confirm(`¿Estás seguro de que quieres cambiar al ${planName} por $${price}/mes?`)) {
        showLoading();
        
        setTimeout(() => {
            currentUser.plan = planName;
            updateUserInterface();
            hideLoading();
            showSuccessMessage(`¡Has cambiado al ${planName} exitosamente!`);
            showHome();
        }, 1500);
    }
}

function renewPlan() {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    const planName = currentUser.plan || 'Plan Normal';
    const price = getPlanPrice(planName);
    
    if (confirm(`¿Renovar ${planName} por $${price}?`)) {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            showSuccessMessage('¡Plan renovado exitosamente!');
            updatePaymentHistory();
        }, 1500);
    }
}

function getPlanPrice(planName) {
    const prices = {
        'Plan Normal': 10000,
        'Plan Plus': 15000,
        'Plan Pro': 20000
    };
    return prices[planName] || 10000;
}

function updatePaymentHistory() {
    // Update last payment display
    const lastPaymentElements = document.querySelectorAll('.payment-amount');
    lastPaymentElements.forEach(element => {
        if (element.closest('.last-payment') || element.closest('.payment-summary')) {
            const planName = currentUser.plan || 'Plan Normal';
            element.textContent = `$${getPlanPrice(planName)}`;
        }
    });
}

// Payment Functions
function processPayment() {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    openPaymentModal();
}

// Links de Mercado Pago por plan
const MERCADOPAGO_LINKS = {
    base: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=929754409b3f43d88d0b95b26518abc2',    // Plan Base $10.000
    plus: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=87927456dc854499841959e0572b8c6e',    // Plan Plus $15.000
    pro: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=7e68417d07ec4c5486eaeba408c77707'      // Plan Pro $20.000
};

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        // Actualizar datos del plan en el modal
        updatePaymentModalData();
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function updatePaymentModalData() {
    // Obtener plan del usuario (considerar cambio pendiente)
    let planKey = 'plus';
    let planData = PLANS_DATA.plus;
    
    if (currentUser) {
        // Si hay un cambio de plan pendiente, usar el nuevo plan
        if (currentUser.pendingPlan) {
            planKey = currentUser.pendingPlan.plan;
            planData = PLANS_DATA[planKey];
        } else if (currentUser.plan) {
            const planName = currentUser.plan.toLowerCase();
            if (planName.includes('base') || planName.includes('normal')) {
                planKey = 'base';
                planData = PLANS_DATA.base;
            } else if (planName.includes('pro')) {
                planKey = 'pro';
                planData = PLANS_DATA.pro;
            }
        }
    }
    
    // Actualizar nombre del plan
    const planNameEl = document.getElementById('paymentPlanName');
    if (planNameEl) {
        planNameEl.textContent = planData.emoji + ' ' + planData.title;
    }
    
    // Actualizar monto
    const planAmountEl = document.getElementById('paymentPlanAmount');
    if (planAmountEl) {
        planAmountEl.textContent = planData.cost;
    }
    
    // Actualizar monto de transferencia
    const transferAmountEl = document.getElementById('transferAmount');
    if (transferAmountEl) {
        transferAmountEl.textContent = planData.cost;
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function payWithMercadoPago() {
    closePaymentModal();
    
    // Obtener plan actual (o pendiente)
    let planKey = 'plus';
    if (currentUser) {
        if (currentUser.pendingPlan) {
            planKey = currentUser.pendingPlan.plan;
        } else if (currentUser.plan) {
            const planName = currentUser.plan.toLowerCase();
            if (planName.includes('base') || planName.includes('normal')) {
                planKey = 'base';
            } else if (planName.includes('pro')) {
                planKey = 'pro';
            }
        }
    }
    
    const paymentLink = MERCADOPAGO_LINKS[planKey] || MERCADOPAGO_LINKS.plus;
    
    showSuccessMessage('Redirigiendo a Mercado Pago...');
    window.open(paymentLink, '_blank');
}

function showBankTransfer() {
    closePaymentModal();
    
    // Actualizar monto de transferencia usando datos del plan
    updatePaymentModalData();
    
    const modal = document.getElementById('bankTransferModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBankTransferModal() {
    const modal = document.getElementById('bankTransferModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Reset file upload
    removeFile();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccessMessage(`Copiado: ${text}`);
    }).catch(() => {
        showErrorMessage('No se pudo copiar al portapapeles');
    });
}

let uploadedFile = null;

function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage('El archivo es demasiado grande. Máximo 5MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showErrorMessage('Formato no válido. Solo JPG, PNG o PDF');
        event.target.value = '';
        return;
    }
    
    uploadedFile = file;
    
    // Show preview
    const filePreview = document.getElementById('filePreview');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileName = document.getElementById('fileName');
    const submitBtn = document.getElementById('submitReceiptBtn');
    
    if (filePreview && fileUploadArea && fileName && submitBtn) {
        fileName.textContent = file.name;
        fileUploadArea.style.display = 'none';
        filePreview.style.display = 'flex';
        submitBtn.disabled = false;
    }
}

function removeFile() {
    uploadedFile = null;
    
    const filePreview = document.getElementById('filePreview');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('receiptFile');
    const submitBtn = document.getElementById('submitReceiptBtn');
    
    if (filePreview && fileUploadArea && fileInput && submitBtn) {
        filePreview.style.display = 'none';
        fileUploadArea.style.display = 'block';
        fileInput.value = '';
        submitBtn.disabled = true;
    }
}

async function submitReceipt() {
    if (!uploadedFile) {
        showErrorMessage('Por favor, sube un comprobante');
        return;
    }
    
    try {
        showLoading();
        
        const planName = currentUser.plan || 'Plan Normal';
        const amount = getPlanPrice(planName);
        
        // Upload receipt via API
        await window.apiService.uploadTransferReceipt(planName, amount, uploadedFile);
        
        hideLoading();
        closeBankTransferModal();
        showSuccessMessage('¡Comprobante enviado exitosamente! Lo revisaremos pronto.');
        
        // Reset
        uploadedFile = null;
        removeFile();
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al enviar comprobante');
    }
}

// UI Helper Functions
function showLoading() {
    // Add loading state to buttons
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.disabled) {
            btn.classList.add('loading');
            btn.disabled = true;
        }
    });
}

function hideLoading() {
    // Remove loading state
    document.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('loading');
        btn.disabled = false;
    });
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    // Insert at the top of the current screen
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        const container = activeScreen.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
        }
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Menu Toggle
function toggleMenu() {
    // This would typically show a side menu
    // For now, we'll just show profile
    showProfile();
}

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateDNI(dni) {
    // Basic DNI validation (8 digits for Argentina)
    const re = /^\d{7,8}$/;
    return re.test(dni.replace(/\./g, ''));
}

function validatePhone(phone) {
    // Basic Argentine phone validation
    const re = /^\+?\d{10,13}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Google OAuth
    initGoogleAuth();
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Google data form (para completar registro con Google)
    const googleDataForm = document.getElementById('googleDataForm');
    if (googleDataForm) {
        googleDataForm.addEventListener('submit', handleGoogleDataSubmit);
    }

    // Cambio de contraseña
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!currentUser) {
                showLogin();
                return;
            }

            const fullNameInput = document.getElementById('editFullName');
            const phoneInput = document.getElementById('editPhone');
            const genderSelect = document.getElementById('editGender');

            const fullName = fullNameInput ? fullNameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const gender = genderSelect ? genderSelect.value : '';

            if (!fullName) {
                showErrorMessage('Ingresá tu nombre completo');
                return;
            }

            if (!gender) {
                showErrorMessage('Seleccioná un género');
                return;
            }

            const parts = fullName.split(' ').filter(Boolean);
            const firstName = parts.shift() || '';
            const lastName = parts.join(' ') || '';

            try {
                showLoading();

                const payload = {
                    firstName,
                    lastName,
                    phone: phone || null,
                    gender
                };

                const result = await window.apiService.updateProfile(payload);
                
                currentUser = result.user ? result.user : { ...currentUser, ...payload };
                updateUserInterface();
                hideLoading();
                closeEditProfileModal();
                showSuccessMessage('Datos actualizados');
            } catch (err) {
                hideLoading();
                showErrorMessage(err.message || 'No se pudo actualizar');
            }
        });
    }
    
    // Add input validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = 'var(--danger-color)';
                showErrorMessage('Por favor, ingresa un email válido');
            } else {
                this.style.borderColor = '';
            }
        });
    });
    
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('blur', function() {
            if (this.value && !validateDNI(this.value)) {
                this.style.borderColor = 'var(--danger-color)';
                showErrorMessage('Por favor, ingresa un DNI válido');
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                this.style.borderColor = 'var(--warning-color)';
                showErrorMessage('El formato del celular no es válido');
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    const formRegistro = document.getElementById('form-registro');

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault(); // Esto evita que la página se recargue

    const userData = {
        firstName: document.getElementById('reg-nombre').value,
        lastName: document.getElementById('reg-apellido').value,
        email: document.getElementById('reg-email').value,
        dni: document.getElementById('reg-dni').value,
        gender: document.getElementById('reg-genero').value,
        phone: document.getElementById('reg-telefono').value,
        password: document.getElementById('reg-password').value
    };

    try {
        console.log("Enviando datos...", userData);
        const response = await window.apiService.register(userData);
        alert("¡Registro exitoso!");
        window.showLogin(); // Te manda al login después de registrarte
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error: " + error.message);
    }
    });
    // Add plan selection buttons
    const planButtons = document.querySelectorAll('.plan-card .btn-outline');
    planButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const plans = ['Plan Normal', 'Plan Plus', 'Plan Pro'];
            const prices = [10000, 15000, 20000];
            const planCard = this.closest('.plan-card');
            const planName = planCard.querySelector('h4').textContent;
            selectPlan(planName, prices[index]);
        });
    });
    
    // Add payment button
    const paymentButtons = document.querySelectorAll('.btn-full');
    paymentButtons.forEach(btn => {
        if (btn.textContent.includes('Renovar') || btn.textContent.includes('Pagar')) {
            btn.addEventListener('click', function() {
                if (this.textContent.includes('Renovar')) {
                    renewPlan();
                } else {
                    processPayment();
                }
            });
        }
    });
    
    // Add change plan button
    const changePlanBtn = document.querySelector('.plan-card.current .btn-secondary');
    if (changePlanBtn) {
        changePlanBtn.addEventListener('click', function() {
            // Scroll to available plans
            const availablePlans = document.querySelector('.available-plans');
            if (availablePlans) {
                availablePlans.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Handle back button (browser)
    window.addEventListener('popstate', function(event) {
        if (currentUser) {
            showHome();
        } else {
            showLogin();
        }
    });
    
    // Add touch gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            const screens = ['homeScreen', 'plansScreen', 'paymentsScreen', 'profileScreen'];
            const currentIndex = screens.indexOf(currentScreen);
            
            if (diff > 0 && currentIndex < screens.length - 1) {
                // Swipe left - next screen
                window[screens[currentIndex + 1].replace('Screen', '')]();
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right - previous screen
                window[screens[currentIndex - 1].replace('Screen', '')]();
            }
        }
    }
    
    // Initialize
    showLogin();
});

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Register service worker for offline functionality
        // This would require creating a service-worker.js file
    });
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Analytics (placeholder)
function trackEvent(eventName, properties) {
    // This would integrate with Google Analytics or similar
    console.log('Event:', eventName, properties);
}

// Export functions for global access
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showHome = showHome;
window.showPlans = showPlans;
window.showPayments = showPayments;
window.showServiceStatus = showServiceStatus;
window.showProfile = showProfile;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.toggleMenu = toggleMenu;
window.closePlanStatusModal = closePlanStatusModal;
window.selectPlan = selectPlan;
window.closeChangePlanModal = closeChangePlanModal;
window.confirmPlanChange = confirmPlanChange;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.selectHelpType = selectHelpType;
window.submitHelpTicket = submitHelpTicket;
window.openNotificationsModal = openNotificationsModal;
window.closeNotificationsModal = closeNotificationsModal;
window.saveNotificationSettings = saveNotificationSettings;
window.openSecurityModal = openSecurityModal;
window.closeSecurityModal = closeSecurityModal;
window.showPrivacyPolicy = showPrivacyPolicy;
window.showTermsOfService = showTermsOfService;
window.showMultas = showMultas;
window.showContactPanel = showContactPanel;

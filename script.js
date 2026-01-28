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
}

function showPlans() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('plansScreen');
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
    showScreen('homeScreen');
}

function showProfile() {
    if (!currentUser) {
        showLogin();
        return;
    }
    showScreen('profileScreen');
    updateUserInterface();
}

// Authentication Functions - Con API REST (sin Firebase SDK)
async function loginWithGoogle() {
    try {
        showLoading();
        
        // En modo demo, simular login con Google
        const response = await window.apiService.loginWithGoogle('demo-google-token');
        
        // Si es usuario nuevo sin datos completos, pedir que complete
        if (response.isNewUser || !response.user.dni) {
            hideLoading();
            openGoogleDataModal(response.user);
            return;
        }
        
        currentUser = response.user;
        updateUserInterface();
        showHome();
        hideLoading();
        showSuccessMessage('¡Bienvenido a Fondo Escudo!');
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al iniciar sesión con Google');
    }
}

// Registro con Google - abre modal para completar datos
async function registerWithGoogle() {
    try {
        showLoading();
        
        // Simular autenticación con Google
        const googleToken = 'demo-google-register-' + Date.now();
        const googleEmail = 'nuevo.usuario@gmail.com';
        const googleId = 'google-' + googleToken.slice(-8);
        
        // Verificar si ya existe un usuario con este email
        const existingUser = window.apiService.findDemoUserByEmail(googleEmail);
        
        if (existingUser) {
            hideLoading();
            showErrorMessage('Este email ya está registrado. Usá "Iniciar con Google" en la pantalla de login.');
            return;
        }
        
        hideLoading();
        
        // Abrir modal para completar datos
        openGoogleDataModal({
            email: googleEmail,
            googleId: googleId,
            isNewRegistration: true
        });
        
    } catch (error) {
        hideLoading();
        showErrorMessage(error.message || 'Error al conectar con Google');
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
    const helpSubject = document.getElementById('helpSubject');

    if (formSection) {
        formSection.style.display = 'block';
    }

    if (helpSubject) {
        if (type === 'dni') helpSubject.value = 'Solicitud de corrección de DNI';
        if (type === 'problema') helpSubject.value = 'Reporte de problema';
        if (type === 'otro') helpSubject.value = 'Consulta';
    }
}

function generateTicketCode() {
    const part = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ts = Date.now().toString().slice(-6);
    return `FE-${ts}-${part}`;
}

function submitHelpTicket() {
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

    const ticket = {
        code,
        type: selectedHelpType,
        subject,
        message,
        user: {
            email: currentUser.email || null,
            fullName,
            dni: currentUser.dni || null,
            phone: currentUser.phone || null,
            gender: currentUser.gender || null,
            plan: currentUser.plan || null
        },
        createdAt: new Date().toISOString()
    };

    // Guardar ticket en localStorage para que el desarrollador pueda verlo
    const existing = localStorage.getItem('supportTickets');
    const tickets = existing ? JSON.parse(existing) : [];
    tickets.unshift(ticket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    // Cerrar modal y mostrar confirmación (sin abrir app de email)
    closeHelpModal();
    showSuccessMessage(`¡Ticket enviado! Código: ${ticket.code}`);
    
    // Log para el desarrollador
    console.log('📩 Nuevo ticket de soporte:', ticket);
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

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
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
    showSuccessMessage('Redirigiendo a Mercado Pago...');
    
    // Abrir link de pago de Mercado Pago en nueva pestaña
    window.open('https://mpago.la/18Y8ptZ', '_blank');
}

function showBankTransfer() {
    closePaymentModal();
    
    // Update transfer amount
    const planName = currentUser.plan || 'Plan Normal';
    const amount = getPlanPrice(planName);
    const transferAmountElement = document.getElementById('transferAmount');
    if (transferAmountElement) {
        transferAmountElement.textContent = `$${amount.toLocaleString('es-AR')}`;
    }
    
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

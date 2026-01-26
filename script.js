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
}

// Authentication Functions - Con API REST (sin Firebase SDK)
async function loginWithGoogle() {
    try {
        showLoading();
        
        // En modo demo, simular login con Google
        const response = await window.apiService.loginWithGoogle('demo-google-token');
        
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
    
    // Update user name in home
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
    
    // Update user name in profile
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) {
        profileNameElement.textContent = currentUser.name;
    }
    
    // Update plan information
    updatePlanInformation();
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
    showLoading();
    
    // Simulate Mercado Pago redirect
    setTimeout(() => {
        hideLoading();
        showSuccessMessage('Redirigiendo a Mercado Pago...');
        
        // In production, redirect to Mercado Pago payment link
        setTimeout(() => {
            showSuccessMessage('¡Pago procesado exitosamente!');
            updatePaymentHistory();
        }, 2000);
    }, 1000);
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

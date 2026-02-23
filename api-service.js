// API Service - Conexión al backend sin Firebase SDK
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
        this.demoMode = true; // Cambiar a false cuando el backend esté corriendo
    }

    // Obtener todos los usuarios demo guardados
    getDemoUsers() {
        const saved = localStorage.getItem('demoUsers');
        return saved ? JSON.parse(saved) : [];
    }

    // Guardar usuario en la lista de usuarios demo
    saveDemoUser(user) {
        const users = this.getDemoUsers();
        const existingIndex = users.findIndex(u => u.email === user.email);
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem('demoUsers', JSON.stringify(users));
        localStorage.setItem('demoUser', JSON.stringify(user)); // Usuario actual
    }

    // Buscar usuario por email
    findDemoUserByEmail(email) {
        const users = this.getDemoUsers();
        return users.find(u => u.email === email) || null;
    }

    // Buscar usuario por Google ID
    findDemoUserByGoogleId(googleId) {
        const users = this.getDemoUsers();
        return users.find(u => u.googleId === googleId) || null;
    }

    getDemoUser() {
        const savedUser = localStorage.getItem('demoUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    // Configurar token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Remover token
    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Headers con autenticación
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Manejo de errores
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }
        
        return data;
    }

    // AUTENTICACIÓN

    async register(userData) {
        // MODO DEMO: Funciona sin backend
        if (this.demoMode) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Verificar si el email ya existe
                    const existingUser = this.findDemoUserByEmail(userData.email);
                    if (existingUser) {
                        reject(new Error('Este email ya está registrado'));
                        return;
                    }

                    const mockToken = 'demo-token-' + Date.now();
                    this.setToken(mockToken);
                    
                    const mockUser = {
                        id: Date.now(),
                        uid: 'demo-uid-' + Date.now(),
                        email: userData.email,
                        password: userData.password, // En producción se hashea
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        dni: userData.dni,
                        phone: userData.phone,
                        gender: userData.gender,
                        plan: 'Plan Normal',
                        registeredWith: 'email',
                        createdAt: new Date().toISOString()
                    };
                    
                    // Guardar en lista de usuarios
                    this.saveDemoUser(mockUser);
                    
                    resolve({
                        message: 'Usuario registrado exitosamente',
                        user: mockUser,
                        token: mockToken
                    });
                }, 500);
            });
        }
        
        // MODO REAL: Conecta al backend
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await this.handleResponse(response);
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    async login(email, password) {
        // MODO DEMO: Funciona sin backend
        if (this.demoMode) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Buscar usuario por email en la lista
                    const user = this.findDemoUserByEmail(email);
                    
                    if (!user) {
                        reject(new Error('Usuario no encontrado'));
                        return;
                    }

                    // Verificar contraseña (solo para usuarios registrados con email)
                    if (user.registeredWith === 'email' && user.password !== password) {
                        reject(new Error('Contraseña incorrecta'));
                        return;
                    }

                    const mockToken = 'demo-token-' + Date.now();
                    this.setToken(mockToken);
                    
                    // Actualizar último login
                    user.lastLogin = new Date().toISOString();
                    this.saveDemoUser(user);
                    
                    resolve({
                        message: 'Login exitoso',
                        user: user,
                        token: mockToken
                    });
                }, 500);
            });
        }
        
        // MODO REAL: Conecta al backend
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await this.handleResponse(response);
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async loginWithGoogle(idToken) {
        // MODO DEMO: Funciona sin backend
        if (this.demoMode) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Simular ID único de Google (en producción viene del token)
                    const googleId = 'google-' + idToken.slice(-8);
                    const googleEmail = 'usuario.google@gmail.com';
                    
                    // Buscar si ya existe un usuario con este Google ID o email
                    let existingUser = this.findDemoUserByGoogleId(googleId);
                    if (!existingUser) {
                        existingUser = this.findDemoUserByEmail(googleEmail);
                    }
                    
                    const mockToken = 'demo-token-google-' + Date.now();
                    this.setToken(mockToken);
                    
                    let mockUser;
                    let isNewUser = false;
                    
                    if (existingUser) {
                        // Usuario existente - actualizar último login
                        mockUser = existingUser;
                        mockUser.lastLogin = new Date().toISOString();
                    } else {
                        // Usuario nuevo de Google
                        isNewUser = true;
                        mockUser = {
                            id: Date.now(),
                            uid: 'google-uid-' + Date.now(),
                            googleId: googleId,
                            email: googleEmail,
                            firstName: 'Usuario',
                            lastName: 'Google',
                            dni: null,
                            phone: null,
                            gender: null,
                            plan: 'Plan Normal',
                            registeredWith: 'google',
                            photoUrl: null,
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString()
                        };
                    }
                    
                    // Guardar en lista de usuarios
                    this.saveDemoUser(mockUser);
                    
                    resolve({
                        message: isNewUser ? 'Cuenta creada con Google' : 'Login exitoso con Google',
                        user: mockUser,
                        isNewUser: isNewUser,
                        token: mockToken
                    });
                }, 500);
            });
        }
        
        // MODO REAL: Conecta al backend
        try {
            const response = await fetch(`${this.baseURL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            const data = await this.handleResponse(response);
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Error en login con Google:', error);
            throw error;
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth/verify`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error verificando token:', error);
            this.removeToken();
            throw error;
        }
    }

    async logout() {
        this.removeToken();
        window.currentUser = null;
    }

    // USUARIOS

    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/users/profile`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        // MODO DEMO: actualizar usuario local
        if (this.demoMode) {
            const user = this.getDemoUser();
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('demoUser', JSON.stringify(updatedUser));

            return {
                message: 'Perfil actualizado exitosamente',
                user: updatedUser
            };
        }

        try {
            const response = await fetch(`${this.baseURL}/users/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            throw error;
        }
    }

    async changePlan(plan) {
        try {
            const response = await fetch(`${this.baseURL}/users/plan`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ plan })
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error cambiando plan:', error);
            throw error;
        }
    }

    async getActivity() {
        try {
            const response = await fetch(`${this.baseURL}/users/activity`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo actividad:', error);
            throw error;
        }
    }

    // PAGOS

    async payWithMercadoPago(plan, amount) {
        try {
            const response = await fetch(`${this.baseURL}/payments/mercadopago`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ plan, amount })
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error procesando pago:', error);
            throw error;
        }
    }

    async uploadTransferReceipt(plan, amount, file) {
        try {
            const formData = new FormData();
            formData.append('plan', plan);
            formData.append('amount', amount);
            formData.append('receipt', file);

            const response = await fetch(`${this.baseURL}/payments/transfer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error subiendo comprobante:', error);
            throw error;
        }
    }

    async getPaymentHistory() {
        try {
            const response = await fetch(`${this.baseURL}/payments/history`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            throw error;
        }
    }

    async getNextPayment() {
        try {
            const response = await fetch(`${this.baseURL}/payments/next`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo próximo pago:', error);
            throw error;
        }
    }

    async getPlans() {
        try {
            const response = await fetch(`${this.baseURL}/payments/plans`);

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo planes:', error);
            throw error;
        }
    }

    // GOOGLE OAUTH (Frontend)
    async initGoogleAuth() {
        return new Promise((resolve) => {
            window.gapi.load('auth2', () => {
                window.gapi.auth2.init({
                    client_id: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
                }).then(() => {
                    resolve();
                });
            });
        });
    }

    async getGoogleIdToken() {
        const auth2 = window.gapi.auth2.getAuthInstance();
        const googleUser = await auth2.signIn();
        const authResponse = googleUser.getAuthResponse();
        return authResponse.id_token;
    }

    // TICKETS DE SOPORTE
    async createTicket(ticketData) {
        // MODO DEMO: Guardar en localStorage
        if (this.demoMode) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
                    const newTicket = {
                        id: Date.now(),
                        ...ticketData,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };
                    tickets.unshift(newTicket);
                    localStorage.setItem('supportTickets', JSON.stringify(tickets));
                    
                    resolve({
                        success: true,
                        ticketId: newTicket.id,
                        ticket: newTicket
                    });
                }, 300);
            });
        }

        // MODO REAL: Enviar al backend
        try {
            const response = await fetch(`${this.baseURL}/tickets/create`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    user_id: ticketData.userId,
                    subject: ticketData.subject,
                    description: ticketData.message,
                    category: ticketData.type
                })
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error creando ticket:', error);
            throw error;
        }
    }

    // Obtener tickets del usuario
    async getTickets(userId) {
        if (this.demoMode) {
            const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
            return { success: true, tickets: tickets.filter(t => t.userId === userId) };
        }

        try {
            const response = await fetch(`${this.baseURL}/tickets/${userId}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo tickets:', error);
            throw error;
        }
    }
}

// Inicializar servicio
window.apiService = new ApiService();

// Auto-verificar token al cargar
window.addEventListener('load', async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const response = await window.apiService.verifyToken();
            if (response.valid) {
                window.currentUser = response.user;
                window.updateUserInterface();
                window.showHome();
            }
        } catch (error) {
            console.log('Token inválido o expirado');
            window.showLogin();
        }
    }
});

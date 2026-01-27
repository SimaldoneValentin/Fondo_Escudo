// API Service - Conexión al backend sin Firebase SDK
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
        this.demoMode = false; // Cambiar a false cuando el backend esté corriendo
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
            return new Promise((resolve) => {
                setTimeout(() => {
                    const mockToken = 'demo-token-' + Date.now();
                    this.setToken(mockToken);
                    
                    const mockUser = {
                        id: Date.now(),
                        uid: 'demo-uid-' + Date.now(),
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        dni: userData.dni,
                        phone: userData.phone,
                        gender: userData.gender,
                        plan: 'Plan Normal',
                        registeredWith: 'email'
                    };
                    
                    // Guardar en localStorage
                    localStorage.setItem('demoUser', JSON.stringify(mockUser));
                    
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
                    // Buscar usuario guardado
                    const savedUser = localStorage.getItem('demoUser');
                    
                    if (savedUser) {
                        const user = JSON.parse(savedUser);
                        if (user.email === email) {
                            const mockToken = 'demo-token-' + Date.now();
                            this.setToken(mockToken);
                            
                            resolve({
                                message: 'Login exitoso',
                                user: user,
                                token: mockToken
                            });
                        } else {
                            reject(new Error('Credenciales incorrectas'));
                        }
                    } else {
                        reject(new Error('Usuario no encontrado'));
                    }
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
                    const mockToken = 'demo-token-google-' + Date.now();
                    this.setToken(mockToken);
                    
                    const mockUser = {
                        id: Date.now(),
                        uid: 'google-demo-' + Date.now(),
                        email: 'usuario@gmail.com',
                        firstName: 'Usuario',
                        lastName: 'Google',
                        dni: 'GOOGLE-' + Date.now(),
                        phone: null,
                        gender: 'otro',
                        plan: 'Plan Normal',
                        registeredWith: 'google',
                        photoUrl: null
                    };
                    
                    localStorage.setItem('demoUser', JSON.stringify(mockUser));
                    
                    resolve({
                        message: 'Login exitoso con Google',
                        user: mockUser,
                        token: mockToken,
                        isNewUser: false
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


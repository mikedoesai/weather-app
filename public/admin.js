class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.usageChart = null;
        this.feedbackChart = null;
        this.revenueChart = null;
        this.initializeElements();
        this.bindEvents();
        this.checkAuthentication();
    }

    initializeElements() {
        this.loginSection = document.getElementById('login-section');
        this.adminDashboard = document.getElementById('admin-dashboard');
        this.loginForm = document.getElementById('login-form');
        this.adminPassword = document.getElementById('admin-password');
        
        // Metrics elements
        this.totalUsers = document.getElementById('total-users');
        this.weatherChecks = document.getElementById('weather-checks');
        this.positiveFeedback = document.getElementById('positive-feedback');
        this.profanityUsage = document.getElementById('profanity-usage');
        this.totalRevenue = document.getElementById('total-revenue');
        
        // Activity elements
        this.recentActivity = document.getElementById('recent-activity');
        this.activeSponsorships = document.getElementById('active-sponsorships');
        
        // Forms
        this.sponsorshipForm = document.getElementById('sponsorship-form');
        
        // QA elements
        this.qaWeatherType = document.getElementById('qa-weather-type');
        this.previewMessage = document.getElementById('preview-message');
        this.messagePreview = document.getElementById('message-preview');
        
        // Export buttons
        this.exportFeedback = document.getElementById('export-feedback');
        this.exportUsage = document.getElementById('export-usage');
        this.exportSponsorships = document.getElementById('export-sponsorships');
    }

    bindEvents() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.sponsorshipForm.addEventListener('submit', (e) => this.handleSponsorshipSubmit(e));
        
        this.exportFeedback.addEventListener('click', () => this.exportData('feedback'));
        this.exportUsage.addEventListener('click', () => this.exportData('usage'));
        this.exportSponsorships.addEventListener('click', () => this.exportData('sponsorships'));
        
        // QA functionality
        this.previewMessage.addEventListener('click', () => this.previewSponsoredMessage());
    }

    checkAuthentication() {
        const authToken = localStorage.getItem('adminAuth');
        if (authToken && this.validateToken(authToken)) {
            this.isAuthenticated = true;
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    validateToken(token) {
        // Simple token validation - in production, use proper JWT or server-side validation
        try {
            const decoded = JSON.parse(atob(token));
            const now = Date.now();
            return decoded.exp > now;
        } catch {
            return false;
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const password = this.adminPassword.value;
        
        // Simple password check - in production, use proper authentication
        if (password === 'RainCheck2024!') {
            const token = btoa(JSON.stringify({
                exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            }));
            localStorage.setItem('adminAuth', token);
            this.isAuthenticated = true;
            this.showDashboard();
        } else {
            alert('Invalid password');
        }
    }

    showLogin() {
        this.loginSection.classList.remove('hidden');
        this.adminDashboard.classList.add('hidden');
    }

    showDashboard() {
        this.loginSection.classList.add('hidden');
        this.adminDashboard.classList.remove('hidden');
        this.loadDashboardData();
    }

    async loadDashboardData() {
        await this.loadMetrics();
        await this.loadCharts();
        await this.loadRecentActivity();
        await this.loadSponsorships();
    }

    async loadMetrics() {
        // Load feedback data from localStorage
        const feedbackData = JSON.parse(localStorage.getItem('weatherAppFeedback') || '[]');
        const usageData = JSON.parse(localStorage.getItem('weatherAppUsage') || '[]');
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        
        // Calculate metrics
        const uniqueUsers = new Set(usageData.map(u => u.userId)).size;
        const totalWeatherChecks = usageData.length;
        const positiveFeedback = feedbackData.filter(f => f.type === 'positive').length;
        const profanityUsage = usageData.filter(u => u.profanityMode).length;
        const profanityPercentage = totalWeatherChecks > 0 ? Math.round((profanityUsage / totalWeatherChecks) * 100) : 0;
        
        // Calculate total revenue
        const totalRevenue = sponsorships.reduce((sum, sponsorship) => {
            return sum + parseFloat(sponsorship.price || 0);
        }, 0);
        
        // Update UI
        this.totalUsers.textContent = uniqueUsers;
        this.weatherChecks.textContent = totalWeatherChecks;
        this.positiveFeedback.textContent = positiveFeedback;
        this.profanityUsage.textContent = `${profanityPercentage}%`;
        this.totalRevenue.textContent = `$${totalRevenue.toFixed(2)}`;
        
        // Load sponsorships
        this.loadSponsorships();
    }

    async loadCharts() {
        const feedbackData = JSON.parse(localStorage.getItem('weatherAppFeedback') || '[]');
        const usageData = JSON.parse(localStorage.getItem('weatherAppUsage') || '[]');
        
        // Usage Chart
        const usageCtx = document.getElementById('usage-chart').getContext('2d');
        if (this.usageChart) this.usageChart.destroy();
        
        const last7Days = this.getLast7Days();
        const dailyUsage = last7Days.map(day => {
            return usageData.filter(u => {
                const date = new Date(u.timestamp).toDateString();
                return date === day.toDateString();
            }).length;
        });
        
        const dailyUniqueUsers = last7Days.map(day => {
            const dayData = usageData.filter(u => {
                const date = new Date(u.timestamp).toDateString();
                return date === day.toDateString();
            });
            return new Set(dayData.map(u => u.userId)).size;
        });
        
        this.usageChart = new Chart(usageCtx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: 'Total Weather Checks',
                    data: dailyUsage,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Unique Users',
                    data: dailyUniqueUsers,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        // Feedback Chart
        const feedbackCtx = document.getElementById('feedback-chart').getContext('2d');
        if (this.feedbackChart) this.feedbackChart.destroy();
        
        const positiveCount = feedbackData.filter(f => f.type === 'positive').length;
        const negativeCount = feedbackData.filter(f => f.type === 'negative').length;
        
        this.feedbackChart = new Chart(feedbackCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Negative'],
                datasets: [{
                    data: [positiveCount, negativeCount],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Revenue Chart
        const revenueCtx = document.getElementById('revenue-chart').getContext('2d');
        if (this.revenueChart) this.revenueChart.destroy();
        
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const dailyRevenue = last7Days.map(day => {
            return sponsorships.filter(s => {
                const date = new Date(s.timestamp).toDateString();
                return date === day.toDateString();
            }).reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
        });
        
        this.revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: 'Daily Revenue',
                    data: dailyRevenue,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    async loadRecentActivity() {
        const feedbackData = JSON.parse(localStorage.getItem('weatherAppFeedback') || '[]');
        const usageData = JSON.parse(localStorage.getItem('weatherAppUsage') || '[]');
        
        // Combine and sort by timestamp
        const allActivity = [
            ...feedbackData.map(f => ({ ...f, type: 'feedback' })),
            ...usageData.map(u => ({ ...u, type: 'usage' }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Display last 10 activities
        const recentActivity = allActivity.slice(0, 10);
        
        this.recentActivity.innerHTML = recentActivity.map(activity => {
            const time = new Date(activity.timestamp).toLocaleString();
            if (activity.type === 'feedback') {
                const icon = activity.type === 'positive' ? 'fa-thumbs-up text-green-500' : 'fa-thumbs-down text-red-500';
                return `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <i class="fas ${icon} mr-2"></i>
                            <span class="text-sm">${activity.message}</span>
                        </div>
                        <span class="text-xs text-gray-500">${time}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-cloud-rain text-blue-500 mr-2"></i>
                            <span class="text-sm">Weather check - ${activity.profanityMode ? 'Profanity mode' : 'Normal mode'}</span>
                        </div>
                        <span class="text-xs text-gray-500">${time}</span>
                    </div>
                `;
            }
        }).join('');
    }

    async loadSponsorships() {
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const pendingSponsorships = sponsorships.filter(s => s.status === 'pending');
        const activeSponsorships = sponsorships.filter(s => s.status === 'active');
        
        // Load pending sponsorships
        const pendingContainer = document.getElementById('pending-sponsorships');
        if (pendingContainer) {
            if (pendingSponsorships.length === 0) {
                pendingContainer.innerHTML = '<p class="text-gray-500 text-sm">No pending sponsorships</p>';
            } else {
                pendingContainer.innerHTML = pendingSponsorships.map(sponsorship => `
                    <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <p class="font-medium text-gray-800">${sponsorship.sponsor}</p>
                                <p class="text-sm text-gray-600 mb-2">"${sponsorship.message}"</p>
                                <div class="text-xs text-gray-500 space-y-1">
                                    <p><strong>Weather Type:</strong> ${sponsorship.weatherType}</p>
                                    <p><strong>Duration:</strong> ${sponsorship.duration} days</p>
                                    <p><strong>Amount:</strong> $${sponsorship.price}</p>
                                    <p><strong>Submitted:</strong> ${new Date(sponsorship.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="adminPanel.approveSponsorship('${sponsorship.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="adminPanel.rejectSponsorship('${sponsorship.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Load active sponsorships
        if (this.activeSponsorships) {
            if (activeSponsorships.length === 0) {
                this.activeSponsorships.innerHTML = '<p class="text-gray-500 text-sm">No active sponsorships</p>';
            } else {
                this.activeSponsorships.innerHTML = activeSponsorships.map(sponsorship => {
                    const endDate = new Date(sponsorship.startDate);
                    endDate.setDate(endDate.getDate() + sponsorship.duration);
                    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return `
                        <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div class="font-semibold text-green-800">${sponsorship.sponsor}</div>
                            <div class="text-sm text-green-600">"${sponsorship.message}"</div>
                            <div class="text-xs text-green-500">${sponsorship.weatherType} - ${daysLeft} days left</div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    handleSponsorshipSubmit(e) {
        e.preventDefault();
        
        const sponsorName = document.getElementById('sponsor-name').value;
        const message = document.getElementById('sponsor-message').value;
        const weatherType = document.getElementById('sponsor-weather-type').value;
        const duration = parseInt(document.getElementById('sponsor-duration').value);
        const amount = parseFloat(document.getElementById('sponsor-amount').value);
        
        if (!sponsorName || !message || !weatherType || !duration || !amount) {
            alert('Please fill in all fields including weather type');
            return;
        }
        
        const sponsorship = {
            id: Date.now().toString(),
            sponsor: sponsorName,
            message: message,
            weatherType: weatherType,
            startDate: new Date().toISOString(),
            duration: duration,
            price: amount,
            status: 'active',
            timestamp: new Date().toISOString()
        };
        
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        sponsorships.push(sponsorship);
        localStorage.setItem('weatherAppSponsorships', JSON.stringify(sponsorships));
        
        // Clear form
        this.sponsorshipForm.reset();
        
        // Reload sponsorships
        this.loadSponsorships();
        
        alert('Sponsorship added successfully!');
    }

    approveSponsorship(sponsorshipId) {
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
        
        if (sponsorship) {
            sponsorship.status = 'active';
            sponsorship.startDate = new Date().toISOString();
            localStorage.setItem('weatherAppSponsorships', JSON.stringify(sponsorships));
            this.loadSponsorships();
            alert('Sponsorship approved and activated!');
        }
    }

    rejectSponsorship(sponsorshipId) {
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const updatedSponsorships = sponsorships.filter(s => s.id !== sponsorshipId);
        localStorage.setItem('weatherAppSponsorships', JSON.stringify(updatedSponsorships));
        this.loadSponsorships();
        alert('Sponsorship rejected and removed.');
    }

    previewSponsoredMessage() {
        const weatherType = this.qaWeatherType.value;
        if (!weatherType) {
            alert('Please select a weather type first.');
            return;
        }

        // Get sponsored message for the selected weather type
        const sponsoredMessage = this.getSponsoredMessage(weatherType);
        
        if (sponsoredMessage) {
            this.messagePreview.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
                        <div class="text-lg font-semibold mb-2">${sponsoredMessage.message}</div>
                        <div class="text-sm opacity-90">Sponsored by: ${sponsoredMessage.sponsor}</div>
                    </div>
                    <div class="text-center text-sm text-gray-600">
                        <p class="mb-2">How it appears on the main app:</p>
                        <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div class="text-lg font-medium text-gray-800 mb-2">${sponsoredMessage.message}</div>
                            <div class="text-sm text-gray-500">Sponsored by ${sponsoredMessage.sponsor}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            this.messagePreview.innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>No sponsored messages available for ${weatherType} weather.</p>
                </div>
            `;
        }
    }

    getSponsoredMessage(weatherType) {
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const now = new Date();
        
        // Find active sponsorships that match the weather type
        const activeSponsorships = sponsorships.filter(sponsorship => {
            const startDate = new Date(sponsorship.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + sponsorship.duration);
            return now >= startDate && now <= endDate && 
                   sponsorship.status === 'active' && 
                   sponsorship.weatherType === weatherType;
        });
        
        if (activeSponsorships.length === 0) {
            return null;
        }
        
        // Randomly select an active sponsorship
        const randomSponsorship = activeSponsorships[Math.floor(Math.random() * activeSponsorships.length)];
        
        return {
            message: randomSponsorship.message,
            sponsor: randomSponsorship.sponsor,
            isSponsored: true
        };
    }

    exportData(type) {
        let data, filename;
        
        switch (type) {
            case 'feedback':
                data = JSON.parse(localStorage.getItem('weatherAppFeedback') || '[]');
                filename = 'weather-app-feedback.json';
                break;
            case 'usage':
                data = JSON.parse(localStorage.getItem('weatherAppUsage') || '[]');
                filename = 'weather-app-usage.json';
                break;
            case 'sponsorships':
                data = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
                filename = 'weather-app-sponsorships.json';
                break;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

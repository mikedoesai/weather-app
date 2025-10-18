import { WeatherAppDatabase } from './supabase.js';
import { config, getConfig } from './config.js';
import { safeSetInnerHTML, validateInput } from './utils/security.js';

class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.usageChart = null;
        this.feedbackChart = null;
        this.revenueChart = null;
        this.initializeElements();
        this.bindEvents();
        this.initializeAsync();
    }

    async initializeAsync() {
        await this.checkAuthentication();
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
        
        this.previewMessage.addEventListener('click', () => this.previewSponsoredMessage());
    }

    async checkAuthentication() {
        try {
            const serverConfig = await getConfig();
            const savedPassword = localStorage.getItem('adminPassword');
            if (savedPassword === serverConfig.admin.password) {
                this.isAuthenticated = true;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.warn('Failed to load config for authentication, using defaults:', error);
            const savedPassword = localStorage.getItem('adminPassword');
            if (savedPassword === config.admin.password) {
                this.isAuthenticated = true;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        try {
            const serverConfig = await getConfig();
            const password = this.adminPassword.value;
            if (password === serverConfig.admin.password) {
                this.isAuthenticated = true;
                localStorage.setItem('adminPassword', password);
                this.showDashboard();
            } else {
                alert('Invalid password');
            }
        } catch (error) {
            console.warn('Failed to load config for login, using defaults:', error);
            const password = this.adminPassword.value;
            if (password === config.admin.password) {
                this.isAuthenticated = true;
                localStorage.setItem('adminPassword', password);
                this.showDashboard();
            } else {
                alert('Invalid password');
            }
        }
    }

    showLogin() {
        this.loginSection.style.display = 'block';
        this.adminDashboard.style.display = 'none';
    }

    showDashboard() {
        this.loginSection.style.display = 'none';
        this.adminDashboard.style.display = 'block';
        this.loadData();
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadMetrics(),
                this.loadSponsorships(),
                this.loadCharts()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Check console for details.');
        }
    }

    async loadMetrics() {
        try {
            const [usageData, feedbackData, sponsorships] = await Promise.all([
                WeatherAppDatabase.getUsageData(),
                WeatherAppDatabase.getFeedback(),
                WeatherAppDatabase.getSponsorships()
            ]);

            // Calculate metrics
            const uniqueUsers = new Set(usageData.map(u => u.user_id)).size;
            const totalWeatherChecks = usageData.length;
            const positiveCount = feedbackData.filter(f => f.type === 'positive').length;
            const totalFeedback = feedbackData.length;
            const profanityCount = usageData.filter(u => u.profanity_mode).length;
            const totalRevenue = sponsorships.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);

            // Update UI
            this.totalUsers.textContent = uniqueUsers;
            this.weatherChecks.textContent = totalWeatherChecks;
            this.positiveFeedback.textContent = totalFeedback > 0 ? `${Math.round((positiveCount / totalFeedback) * 100)}%` : '0%';
            this.profanityUsage.textContent = totalWeatherChecks > 0 ? `${Math.round((profanityCount / totalWeatherChecks) * 100)}%` : '0%';
            this.totalRevenue.textContent = `$${totalRevenue.toFixed(2)}`;

            // Load recent activity
            this.loadRecentActivity(usageData, feedbackData);

        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    }

    loadRecentActivity(usageData, feedbackData) {
        const recentActivity = [
            ...usageData.slice(0, 5).map(u => ({
                type: 'usage',
                message: `Weather check: ${u.weather_type || 'Unknown'} (${u.profanity_mode ? 'Profanity' : 'Normal'} mode)`,
                timestamp: new Date(u.created_at)
            })),
            ...feedbackData.slice(0, 5).map(f => ({
                type: 'feedback',
                message: `${f.type === 'positive' ? '👍' : '👎'} Feedback received`,
                timestamp: new Date(f.created_at)
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        if (recentActivity.length === 0) {
            this.recentActivity.innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
        } else {
            this.recentActivity.innerHTML = recentActivity.map(activity => `
                <div class="flex items-center space-x-2 text-sm">
                    <span class="text-gray-500">${activity.timestamp.toLocaleTimeString()}</span>
                    <span class="text-gray-700">${activity.message}</span>
                </div>
            `).join('');
        }
    }

    async loadSponsorships() {
        try {
            const sponsorships = await WeatherAppDatabase.getSponsorships();
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
                                        <p><strong>Weather Type:</strong> ${sponsorship.weather_type}</p>
                                        <p><strong>Duration:</strong> ${sponsorship.duration} days</p>
                                        <p><strong>Amount:</strong> $${sponsorship.price}</p>
                                        <p><strong>Submitted:</strong> ${new Date(sponsorship.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="adminPanel.approveSponsorship(${sponsorship.id})" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-check mr-1"></i>Approve
                                </button>
                                <button onclick="adminPanel.rejectSponsorship(${sponsorship.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
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
                        const endDate = new Date(sponsorship.start_date);
                        endDate.setDate(endDate.getDate() + sponsorship.duration);
                        const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
                        
                        return `
                            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div class="font-semibold text-green-800">${sponsorship.sponsor}</div>
                                <div class="text-sm text-green-600">"${sponsorship.message}"</div>
                                <div class="text-xs text-green-500">${sponsorship.weather_type} - ${daysLeft} days left</div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error('Error loading sponsorships:', error);
        }
    }

    async approveSponsorship(sponsorshipId) {
        try {
            await WeatherAppDatabase.updateSponsorship(sponsorshipId, {
                status: 'active',
                start_date: new Date().toISOString()
            });
            await this.loadSponsorships();
            alert('Sponsorship approved and activated!');
        } catch (error) {
            console.error('Error approving sponsorship:', error);
            alert('Error approving sponsorship');
        }
    }

    async rejectSponsorship(sponsorshipId) {
        try {
            await WeatherAppDatabase.deleteSponsorship(sponsorshipId);
            await this.loadSponsorships();
            alert('Sponsorship rejected and removed.');
        } catch (error) {
            console.error('Error rejecting sponsorship:', error);
            alert('Error rejecting sponsorship');
        }
    }

    async handleSponsorshipSubmit(e) {
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
            sponsor: sponsorName,
            message: message,
            weather_type: weatherType,
            duration: duration,
            price: amount,
            status: 'active',
            start_date: new Date().toISOString()
        };
        
        try {
            await WeatherAppDatabase.addSponsorship(sponsorship);
            this.sponsorshipForm.reset();
            await this.loadSponsorships();
            alert('Sponsorship added successfully!');
        } catch (error) {
            console.error('Error adding sponsorship:', error);
            alert('Error adding sponsorship');
        }
    }

    async previewSponsoredMessage() {
        const weatherType = this.qaWeatherType.value;
        if (!weatherType) {
            alert('Please select a weather type first.');
            return;
        }

        try {
            const sponsorships = await WeatherAppDatabase.getSponsorships();
            const now = new Date();
            
            // Find active sponsorships that match the weather type
            const activeSponsorships = sponsorships.filter(sponsorship => {
                const startDate = new Date(sponsorship.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + sponsorship.duration);
                return now >= startDate && now <= endDate && 
                       sponsorship.status === 'active' && 
                       sponsorship.weather_type === weatherType;
            });
            
            if (activeSponsorships.length === 0) {
                this.messagePreview.innerHTML = `
                    <div class="text-center text-gray-500">
                        <i class="fas fa-info-circle text-2xl mb-2"></i>
                        <p>No sponsored messages available for ${weatherType} weather.</p>
                    </div>
                `;
                return;
            }
            
            // Randomly select from active sponsorships
            const randomSponsorship = activeSponsorships[Math.floor(Math.random() * activeSponsorships.length)];
            
            this.messagePreview.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
                        <div class="text-lg font-semibold mb-2">${randomSponsorship.message}</div>
                        <div class="text-sm opacity-90">Sponsored by: ${randomSponsorship.sponsor}</div>
                    </div>
                    <div class="text-center text-sm text-gray-600">
                        <p class="mb-2">How it appears on the main app:</p>
                        <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div class="text-lg font-medium text-gray-800 mb-2">${randomSponsorship.message}</div>
                            <div class="text-sm text-gray-500">Sponsored by ${randomSponsorship.sponsor}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error previewing sponsored message:', error);
            alert('Error loading sponsored message');
        }
    }

    async loadCharts() {
        try {
            const [usageData, feedbackData, sponsorships] = await Promise.all([
                WeatherAppDatabase.getUsageData(),
                WeatherAppDatabase.getFeedback(),
                WeatherAppDatabase.getSponsorships()
            ]);

            this.createUsageChart(usageData);
            this.createFeedbackChart(feedbackData);
            this.createRevenueChart(sponsorships);
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    createUsageChart(usageData) {
        const ctx = document.getElementById('usage-chart').getContext('2d');
        
        // Group data by day
        const dailyData = {};
        const dailyUniqueUsers = {};
        
        usageData.forEach(entry => {
            const date = new Date(entry.created_at).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = 0;
                dailyUniqueUsers[date] = new Set();
            }
            dailyData[date]++;
            dailyUniqueUsers[date].add(entry.user_id);
        });

        const labels = Object.keys(dailyData).sort();
        const totalChecks = labels.map(date => dailyData[date]);
        const uniqueUsers = labels.map(date => dailyUniqueUsers[date].size);

        if (this.usageChart) {
            this.usageChart.destroy();
        }

        this.usageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Weather Checks',
                    data: totalChecks,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Unique Users',
                    data: uniqueUsers,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Usage'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createFeedbackChart(feedbackData) {
        const ctx = document.getElementById('feedback-chart').getContext('2d');
        
        const positive = feedbackData.filter(f => f.type === 'positive').length;
        const negative = feedbackData.filter(f => f.type === 'negative').length;

        if (this.feedbackChart) {
            this.feedbackChart.destroy();
        }

        this.feedbackChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Negative'],
                datasets: [{
                    data: [positive, negative],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Feedback Distribution'
                    }
                }
            }
        });
    }

    createRevenueChart(sponsorships) {
        const ctx = document.getElementById('revenue-chart').getContext('2d');
        
        // Group revenue by day
        const dailyRevenue = {};
        sponsorships.forEach(sponsorship => {
            const date = new Date(sponsorship.created_at).toDateString();
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += parseFloat(sponsorship.price || 0);
        });

        const labels = Object.keys(dailyRevenue).sort();
        const revenue = labels.map(date => dailyRevenue[date]);

        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        this.revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: revenue,
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderColor: 'rgb(168, 85, 247)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async exportData(type) {
        try {
            let data, filename;
            
            switch (type) {
                case 'feedback':
                    data = await WeatherAppDatabase.getFeedback();
                    filename = 'feedback-export.json';
                    break;
                case 'usage':
                    data = await WeatherAppDatabase.getUsageData();
                    filename = 'usage-export.json';
                    break;
                case 'sponsorships':
                    data = await WeatherAppDatabase.getSponsorships();
                    filename = 'sponsorships-export.json';
                    break;
                default:
                    throw new Error('Invalid export type');
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
            
            alert(`${type} data exported successfully!`);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data');
        }
    }
}

// Initialize admin panel
window.adminPanel = new AdminPanel();
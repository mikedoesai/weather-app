import { WeatherAppDatabase } from './supabase.js';

class DonationSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeDefaultSelection();
    }

    initializeElements() {
        // Helper function to safely get elements
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with id '${id}' not found`);
            }
            return element;
        };

        this.donationForm = getElement('donation-form');
        this.messageInput = getElement('message-input');
        this.sponsorNameInput = getElement('sponsor-name-input');
        this.weatherTypeSelect = getElement('weather-type');
        this.durationSelect = getElement('sponsorship-duration');
        this.charCount = getElement('char-count');
        this.priceDisplay = getElement('price-display');
        this.totalPrice = getElement('total-price');
        this.donateButton = getElement('donate-button');
        this.successMessage = getElement('success-message');
        
        console.log('Donation system elements initialized');
    }

    bindEvents() {
        // Character count for message input
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => this.updateCharCount());
        }
        
        // Duration selection
        if (this.durationSelect) {
            this.durationSelect.addEventListener('change', () => this.updatePrice());
        }
        
        // Package selection - use event delegation for reliability
        document.addEventListener('click', (e) => {
            const packageElement = e.target.closest('.package-option');
            if (packageElement) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Package clicked:', packageElement);
                this.selectPackage(packageElement);
            }
        });
        
        // Form submission
        if (this.donationForm) {
            this.donationForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        console.log('Donation system events bound');
    }
    
    initializeDefaultSelection() {
        // No auto-selection - let user choose
        // Just ensure price display is hidden initially
        if (this.priceDisplay) {
            this.priceDisplay.classList.add('hidden');
        }
        console.log('Default selection initialized');
    }

    updateCharCount() {
        const currentLength = this.messageInput.value.length;
        const maxLength = parseInt(this.messageInput.getAttribute('maxlength'));
        this.charCount.textContent = `${currentLength}/${maxLength}`;
        
        // Change color if approaching limit
        if (currentLength > maxLength * 0.9) {
            this.charCount.classList.add('text-red-500');
        } else {
            this.charCount.classList.remove('text-red-500');
        }
    }

    updatePrice(skipVisualUpdate = false) {
        const selectedOption = this.durationSelect.options[this.durationSelect.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        
        if (price) {
            this.totalPrice.textContent = `$${price}`;
            this.priceDisplay.classList.remove('hidden');
            
            // Update visual selection to match dropdown (only if not called from selectPackage)
            if (!skipVisualUpdate) {
                this.updateVisualSelection();
            }
        } else {
            this.priceDisplay.classList.add('hidden');
        }
    }
    
    updateVisualSelection() {
        const selectedDuration = this.durationSelect.value;
        
        // Remove selected class from all packages
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Find and select the matching package
        const matchingPackage = document.querySelector(`.package-option[data-duration="${selectedDuration}"]`);
        if (matchingPackage) {
            matchingPackage.classList.add('selected');
            this.selectedPackage = matchingPackage;
        }
    }

    selectPackage(packageElement) {
        console.log('selectPackage called with:', packageElement);
        
        // Remove selected class from all packages
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to clicked package
        packageElement.classList.add('selected');
        console.log('Added selected class to package');
        
        // Update form dropdown
        const duration = packageElement.getAttribute('data-duration');
        const price = packageElement.getAttribute('data-price');
        
        console.log('Package data:', { duration, price });
        
        if (this.durationSelect) {
            this.durationSelect.value = duration;
            console.log('Updated duration select to:', duration);
        }
        
        this.updatePrice(true); // Skip visual update since we're handling it manually
        
        // Store the selected package for persistence
        this.selectedPackage = packageElement;
        
        // Force a re-render to ensure the class is applied
        packageElement.offsetHeight;
        
        console.log('Package selection completed');
    }

    validateForm() {
        const message = this.messageInput.value.trim();
        const sponsorName = this.sponsorNameInput.value.trim();
        const weatherType = this.weatherTypeSelect.value;
        const duration = this.durationSelect.value;

        // Basic validation
        if (!message) {
            alert('Please enter your message.');
            return false;
        }

        if (!sponsorName) {
            alert('Please enter your name or organization.');
            return false;
        }

        if (!weatherType) {
            alert('Please select a weather type.');
            return false;
        }

        if (!duration) {
            alert('Please select a sponsorship duration.');
            return false;
        }

        // Content validation
        if (this.containsInappropriateContent(message)) {
            alert('Your message contains inappropriate content. Please revise and try again.');
            return false;
        }

        return true;
    }

    containsInappropriateContent(text) {
        const inappropriateWords = [
            'spam', 'scam', 'free money', 'click here', 'buy now',
            'viagra', 'casino', 'gambling', 'lottery', 'winner'
        ];
        
        const lowerText = text.toLowerCase();
        return inappropriateWords.some(word => lowerText.includes(word));
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        // Get form data
        const formData = {
            message: this.messageInput.value.trim(),
            sponsorName: this.sponsorNameInput.value.trim(),
            weatherType: this.weatherTypeSelect.value,
            duration: this.durationSelect.value,
            price: this.durationSelect.options[this.durationSelect.selectedIndex].getAttribute('data-price'),
            status: 'pending', // New sponsorships need approval
            timestamp: new Date().toISOString()
        };

        // Simulate payment processing
        this.processPayment(formData);
    }

    async processPayment(formData) {
        // Show loading state
        this.donateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        this.donateButton.disabled = true;

        // Simulate payment processing delay
        setTimeout(async () => {
            try {
                // Store sponsorship data
                await this.storeSponsorship(formData);
                
                // Show success message
                this.showSuccessMessage(formData);
                
                // Reset form
                this.resetForm();
            } catch (error) {
                console.error('Error processing payment:', error);
                alert('Error processing your sponsorship. Please try again.');
                this.donateButton.innerHTML = '<i class="fas fa-gem mr-2"></i>Sponsor Message';
                this.donateButton.disabled = false;
            }
        }, 2000);
    }

    async storeSponsorship(formData) {
        try {
            const sponsorship = {
                sponsor: formData.sponsorName,
                message: formData.message,
                weather_type: formData.weatherType,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price),
                status: formData.status
            };

            // Store in Supabase
            const result = await WeatherAppDatabase.addSponsorship(sponsorship);
            console.log('Sponsorship created:', result);
        } catch (error) {
            console.error('Error storing sponsorship:', error);
            // Fallback to localStorage if Supabase fails
            const startDate = new Date();
            const duration = parseInt(formData.duration);
            const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));

            const sponsorship = {
                id: Date.now().toString(),
                message: formData.message,
                sponsor: formData.sponsorName,
                weatherType: formData.weatherType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                duration: duration,
                price: formData.price,
                status: formData.status,
                timestamp: formData.timestamp
            };

            const existingSponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
            existingSponsorships.push(sponsorship);
            localStorage.setItem('weatherAppSponsorships', JSON.stringify(existingSponsorships));
            console.log('Sponsorship created (fallback):', sponsorship);
        }
    }

    showSuccessMessage(formData) {
        this.donationForm.classList.add('hidden');
        this.successMessage.classList.remove('hidden');
        
        // Update success message to reflect approval process
        const successContent = this.successMessage.querySelector('div');
        successContent.innerHTML = `
            <h4 class="text-lg font-semibold text-green-800">Thank you for your sponsorship!</h4>
            <p class="text-green-600">Your message will be reviewed and activated within 24 hours. You'll receive an email confirmation once approved.</p>
        `;
        
        // Scroll to success message
        this.successMessage.scrollIntoView({ behavior: 'smooth' });
    }

    resetForm() {
        // Reset form fields
        this.donationForm.reset();
        
        // Clear package selection
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Reset to default selection
        this.initializeDefaultSelection();
        
        // Reset button
        this.donateButton.innerHTML = '<i class="fas fa-credit-card mr-2"></i>Proceed to Payment';
        this.donateButton.disabled = false;
        
        // Hide price display
        this.priceDisplay.classList.add('hidden');
        
        // Reset character count
        this.updateCharCount();
    }
}

// Initialize the donation system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DonationSystem();
});
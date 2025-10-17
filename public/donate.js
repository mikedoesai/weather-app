class DonationSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.donationForm = document.getElementById('donation-form');
        this.messageInput = document.getElementById('message-input');
        this.sponsorNameInput = document.getElementById('sponsor-name-input');
        this.weatherTypeSelect = document.getElementById('weather-type');
        this.durationSelect = document.getElementById('sponsorship-duration');
        this.charCount = document.getElementById('char-count');
        this.priceDisplay = document.getElementById('price-display');
        this.totalPrice = document.getElementById('total-price');
        this.donateButton = document.getElementById('donate-button');
        this.successMessage = document.getElementById('success-message');
    }

    bindEvents() {
        // Character count for message input
        this.messageInput.addEventListener('input', () => this.updateCharCount());
        
        // Duration selection
        this.durationSelect.addEventListener('change', () => this.updatePrice());
        
        // Package selection
        document.querySelectorAll('.package-option').forEach(option => {
            option.addEventListener('click', () => this.selectPackage(option));
        });
        
        // Form submission
        this.donationForm.addEventListener('submit', (e) => this.handleSubmit(e));
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

    updatePrice() {
        const selectedOption = this.durationSelect.options[this.durationSelect.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        
        if (price) {
            this.totalPrice.textContent = `$${price}`;
            this.priceDisplay.classList.remove('hidden');
        } else {
            this.priceDisplay.classList.add('hidden');
        }
    }

    selectPackage(packageElement) {
        // Remove selected class from all packages
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to clicked package
        packageElement.classList.add('selected');
        
        // Update form dropdown
        const duration = packageElement.getAttribute('data-duration');
        const price = packageElement.getAttribute('data-price');
        
        this.durationSelect.value = duration;
        this.updatePrice();
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

    processPayment(formData) {
        // Show loading state
        this.donateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        this.donateButton.disabled = true;

        // Simulate payment processing delay
        setTimeout(() => {
            // Store sponsorship data
            this.storeSponsorship(formData);
            
            // Show success message
            this.showSuccessMessage(formData);
            
            // Reset form
            this.resetForm();
        }, 2000);
    }

    storeSponsorship(formData) {
        // Calculate end date
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

        // Store in localStorage (in a real app, this would go to a server)
        const existingSponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        existingSponsorships.push(sponsorship);
        localStorage.setItem('weatherAppSponsorships', JSON.stringify(existingSponsorships));

        console.log('Sponsorship created:', sponsorship);
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
        this.donateButton.innerHTML = '<i class="fas fa-credit-card mr-2"></i>Proceed to Payment';
        this.donateButton.disabled = false;
    }
}

// Initialize the donation system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DonationSystem();
});